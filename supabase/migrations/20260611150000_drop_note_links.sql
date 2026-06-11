-- Roll back the note links feature in favor of inline markdown-style links
-- (and tables) directly in the note editor.
drop table if exists public.note_links;
