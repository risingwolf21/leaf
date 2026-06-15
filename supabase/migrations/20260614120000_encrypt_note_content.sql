-- Encrypts notes.title/content and note_versions.title/content at rest
-- using a single shared AES-256 key stored in Supabase Vault.
--
-- Threat model: this protects the underlying table data (and backups/dumps)
-- from anyone with direct database access but no Vault access. It is
-- "encryption at rest", not zero-knowledge — anyone who can read the Vault
-- secret (via the SECURITY DEFINER functions below) can decrypt any note.
-- All app reads/writes continue to go through RPCs and see plaintext.

create extension if not exists pgcrypto with schema extensions;

-- Generate the shared key once and store it in Vault, Supabase's
-- centralized secret store (separate from the `notes` table and never sent
-- to clients).
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'notes_encryption_key') then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'base64'),
      'notes_encryption_key',
      'Shared AES key for encrypting notes.title/content and note_versions.title/content at rest'
    );
  end if;
end;
$$;

-- Internal helpers, not exposed via the API (supabase/config.toml only
-- exposes the `public`/`graphql_public` schemas).
create schema if not exists private;

-- Fetches the shared key from Vault. `security definer` so it can read
-- `vault.decrypted_secrets` regardless of caller; execute is revoked from
-- everyone — only its owner (encrypt_text/decrypt_text below) calls it.
create or replace function private.notes_encryption_key()
returns text
language sql
security definer
set search_path = ''
as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'notes_encryption_key';
$$;

revoke execute on function private.notes_encryption_key() from public;

-- Encrypts plaintext for storage; null passes through unchanged.
create or replace function private.encrypt_text(plain text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if plain is null then
    return null;
  end if;
  return encode(
    extensions.pgp_sym_encrypt(plain, private.notes_encryption_key(), 'cipher-algo=aes256'),
    'base64'
  );
end;
$$;

-- Decrypts ciphertext produced by encrypt_text; null passes through unchanged.
create or replace function private.decrypt_text(cipher text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if cipher is null then
    return null;
  end if;
  return extensions.pgp_sym_decrypt(decode(cipher, 'base64'), private.notes_encryption_key());
end;
$$;

grant usage on schema private to authenticated, anon;
grant execute on function private.encrypt_text(text) to authenticated, anon;
grant execute on function private.decrypt_text(text) to authenticated, anon;

-- One-time migration of existing plaintext to ciphertext. Must run before
-- the triggers below exist, otherwise this update would be re-encrypted by
-- its own trigger.
--
-- Disable the updated_at trigger for this bulk rewrite: re-encrypting is
-- not a "real" edit, and bumping every note's updated_at would reorder
-- the whole note list by recency.
alter table public.notes disable trigger notes_updated_at;

update public.notes
set title = private.encrypt_text(title),
    content = private.encrypt_text(content);

alter table public.notes enable trigger notes_updated_at;

update public.note_versions
set title = private.encrypt_text(title),
    content = private.encrypt_text(content);

-- The GIN-indexed tsvector can't be computed from ciphertext.
drop index if exists public.notes_search_idx;
alter table public.notes drop column if exists search_vector;

-- Encrypts title/content on the way in. Only re-encrypts a column that is
-- actually changing, so unrelated updates (pin, move, share, etc.) don't
-- re-encrypt the ciphertext already sitting in `old`.
create or replace function private.encrypt_notes_columns()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.title is distinct from old.title then
    new.title := private.encrypt_text(new.title);
  end if;
  if tg_op = 'INSERT' or new.content is distinct from old.content then
    new.content := private.encrypt_text(new.content);
  end if;
  return new;
end;
$$;

drop trigger if exists encrypt_notes_columns on public.notes;
create trigger encrypt_notes_columns
  before insert or update on public.notes
  for each row execute function private.encrypt_notes_columns();

-- note_versions rows are insert-only snapshots: every insert encrypts.
create or replace function private.encrypt_note_versions_columns()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.title := private.encrypt_text(new.title);
  new.content := private.encrypt_text(new.content);
  return new;
end;
$$;

drop trigger if exists encrypt_note_versions_columns on public.note_versions;
create trigger encrypt_note_versions_columns
  before insert on public.note_versions
  for each row execute function private.encrypt_note_versions_columns();

-- Decrypt title/content for the current user's notes.
create or replace function public.get_notes_with_tags()
returns table (
  id uuid,
  user_id uuid,
  title text,
  content text,
  folder_id uuid,
  pinned boolean,
  deleted_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  share_token text,
  shared_at timestamptz,
  share_link_role public.share_role,
  tags json
)
language sql
stable
as $$
  select
    n.id, n.user_id,
    private.decrypt_text(n.title) as title,
    private.decrypt_text(n.content) as content,
    n.folder_id, n.pinned, n.deleted_at,
    n.created_at, n.updated_at,
    n.share_token, n.shared_at, n.share_link_role,
    coalesce(
      (
        select json_agg(
          json_build_object(
            'id', t.id,
            'user_id', t.user_id,
            'name', t.name,
            'color', t.color,
            'created_at', t.created_at
          )
          order by t.name
        )
        from public.note_tags nt
        join public.tags t on t.id = nt.tag_id
        where nt.note_id = n.id
      ),
      '[]'::json
    ) as tags
  from public.notes n
  where n.user_id = auth.uid() and n.deleted_at is null
  order by n.pinned desc, n.updated_at desc;
$$;

-- Decrypt title/content for notes shared with the current user.
create or replace function public.get_shared_notes()
returns table (
  id uuid,
  user_id uuid,
  title text,
  content text,
  folder_id uuid,
  pinned boolean,
  deleted_at timestamptz,
  share_token text,
  shared_at timestamptz,
  share_link_role public.share_role,
  created_at timestamptz,
  updated_at timestamptz,
  owner_email text,
  my_role public.share_role,
  shared_since timestamptz
)
language sql
stable
as $$
  select
    n.id, n.user_id,
    private.decrypt_text(n.title) as title,
    private.decrypt_text(n.content) as content,
    n.folder_id, n.pinned, n.deleted_at,
    n.share_token, n.shared_at, n.share_link_role,
    n.created_at, n.updated_at,
    p.email as owner_email,
    nc.role as my_role,
    nc.created_at as shared_since
  from public.notes n
  join public.note_collaborators nc on nc.note_id = n.id
  join public.profiles p on p.id = n.user_id
  where nc.user_id = auth.uid()
    and n.deleted_at is null
  order by n.updated_at desc;
$$;

-- Returns the current user's trashed notes with decrypted title/content.
-- Replaces a direct `select * from notes`, which would now return ciphertext.
create or replace function public.get_trashed_notes()
returns table (
  id uuid,
  user_id uuid,
  title text,
  content text,
  folder_id uuid,
  pinned boolean,
  deleted_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  share_token text,
  shared_at timestamptz,
  share_link_role public.share_role
)
language sql
stable
as $$
  select
    n.id, n.user_id,
    private.decrypt_text(n.title) as title,
    private.decrypt_text(n.content) as content,
    n.folder_id, n.pinned, n.deleted_at,
    n.created_at, n.updated_at,
    n.share_token, n.shared_at, n.share_link_role
  from public.notes n
  where n.user_id = auth.uid()
    and n.deleted_at is not null
  order by n.deleted_at desc;
$$;

grant execute on function public.get_trashed_notes() to authenticated;

-- Returns a note's version history with decrypted title/content. Replaces
-- a direct `select * from note_versions`, which would now return ciphertext.
create or replace function public.get_note_versions(p_note_id uuid)
returns table (
  id uuid,
  note_id uuid,
  user_id uuid,
  title text,
  content text,
  saved_at timestamptz
)
language sql
stable
as $$
  select
    v.id, v.note_id, v.user_id,
    private.decrypt_text(v.title) as title,
    private.decrypt_text(v.content) as content,
    v.saved_at
  from public.note_versions v
  where v.note_id = p_note_id
    and v.user_id = auth.uid()
  order by v.saved_at desc;
$$;

grant execute on function public.get_note_versions(uuid) to authenticated;

-- Returns a shared note's decrypted title/content by its public share
-- token, for the public /shared/:token page. Relies on the existing
-- "Public can read shared notes" RLS policy to scope visible rows.
create or replace function public.get_shared_note_by_token(p_token text)
returns table (
  id uuid,
  title text,
  content text
)
language sql
stable
as $$
  select
    n.id,
    private.decrypt_text(n.title) as title,
    private.decrypt_text(n.content) as content
  from public.notes n
  where n.share_token = p_token
    and n.deleted_at is null;
$$;

grant execute on function public.get_shared_note_by_token(text) to anon, authenticated;

-- Decrypt before matching. The GIN-indexed tsvector search no longer works
-- on ciphertext, so this decrypts each of the caller's own notes and falls
-- back to a case-insensitive substring match — losing
-- websearch_to_tsquery's stemming/ranking, but search only ever runs over
-- one user's notes.
--
-- Dropped first: previously `returns setof public.notes`, and
-- `create or replace function` cannot change a function's return type.
drop function if exists public.search_notes(text);

create or replace function public.search_notes(search_term text)
returns table (
  id uuid,
  user_id uuid,
  title text,
  content text,
  folder_id uuid,
  pinned boolean,
  deleted_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  share_token text,
  shared_at timestamptz,
  share_link_role public.share_role
)
language sql
stable
as $$
  with decrypted as (
    select
      n.id, n.user_id,
      private.decrypt_text(n.title) as title,
      private.decrypt_text(n.content) as content,
      n.folder_id, n.pinned, n.deleted_at,
      n.created_at, n.updated_at,
      n.share_token, n.shared_at, n.share_link_role
    from public.notes n
    where n.user_id = auth.uid() and n.deleted_at is null
  )
  select *
  from decrypted
  where title ilike '%' || search_term || '%'
     or content ilike '%' || search_term || '%'
  order by updated_at desc
  limit 20;
$$;

-- Decrypt before matching (case-sensitive).
--
-- Dropped first: previously `returns setof public.notes`, and
-- `create or replace function` cannot change a function's return type.
drop function if exists public.search_notes_case_sensitive(text);

create or replace function public.search_notes_case_sensitive(search_term text)
returns table (
  id uuid,
  user_id uuid,
  title text,
  content text,
  folder_id uuid,
  pinned boolean,
  deleted_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  share_token text,
  shared_at timestamptz,
  share_link_role public.share_role
)
language sql
stable
as $$
  with decrypted as (
    select
      n.id, n.user_id,
      private.decrypt_text(n.title) as title,
      private.decrypt_text(n.content) as content,
      n.folder_id, n.pinned, n.deleted_at,
      n.created_at, n.updated_at,
      n.share_token, n.shared_at, n.share_link_role
    from public.notes n
    where n.user_id = auth.uid() and n.deleted_at is null
  )
  select *
  from decrypted
  where title like '%' || search_term || '%'
     or content like '%' || search_term || '%'
  order by updated_at desc
  limit 20;
$$;
