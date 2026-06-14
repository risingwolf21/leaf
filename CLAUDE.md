# Claude Code Instructions

## Code Philosophy

Write code a senior engineer would be proud to review.
Optimise for readability and maintainability, not cleverness.
When in doubt, write less code — not more.

---

## TypeScript

- Always use explicit types. No `any`, ever.
- Prefer `type` over `interface` for object shapes unless extending.
- Use discriminated unions instead of boolean flags where state has
  multiple exclusive variants.
- Never cast with `as` unless interfacing with an untyped third-party
  API — and add a comment explaining why.
- Put types in the file that owns them. Only move to `src/types/index.ts`
  when two or more files need the same type.

---

## React

- One component per file. No exceptions.
- A component that exceeds ~150 lines probably needs to be split.
  Ask yourself: does this have more than one reason to change?
  If yes, extract.
- Extract a component when:
  - A JSX block is used more than once
  - A JSX block has its own internal state
  - A section of JSX is long enough to need a comment explaining it
- Prefer named exports. No default exports except for pages
  (`src/pages/**`).
- Never put business logic inside JSX. Extract to a variable,
  a handler, or a hook first.
- Keep event handlers out of JSX props when they are more than
  one line:

```tsx
  // ✗
  <button onClick={() => { doThing(); doOtherThing() }}>

  // ✓
  const handleClick = () => {
    doThing()
    doOtherThing()
  }
  <button onClick={handleClick}>
```

- Derive state from existing state rather than syncing with
  `useEffect`. If you find yourself writing
  `useEffect(() => setState(...), [someProp])`, stop and rethink.

---

## Hooks

- One concern per hook. A hook that fetches data should not also
  manage UI state.
- Name hooks after what they give you, not what they do:
  `useNotes` not `useFetchNotes`.
- Keep hooks in `src/hooks/`. Name the file after the hook.
- Extract a custom hook when the same `useState` + `useEffect`
  pattern appears in two components.
- Hooks must not have side effects at the module level —
  only inside `useEffect` or event handlers.

---

## React Query

- Every server interaction goes through React Query.
  No raw `supabase` calls inside components.
- Use descriptive, stable query keys. Structure them as arrays
  that go from general to specific:
```ts
  ['notes', userId]
  ['notes', userId, noteId]
  ['tags', userId]
```
- Put query key factories in `src/lib/queryKeys.ts`:
```ts
  export const queryKeys = {
    notes: (userId: string) => ['notes', userId] as const,
    note: (userId: string, noteId: string) =>
      ['notes', userId, noteId] as const,
    tags: (userId: string) => ['tags', userId] as const,
  }
```
- `useQuery` for reads. `useMutation` for writes.
- Always handle `isPending`, `isError` states — never assume
  data is available.
- Invalidate the minimal set of queries after a mutation.
  Don't `invalidateQueries({ queryKey: ['notes'] })` if only
  one note changed.
- Optimistic updates for actions that feel slow otherwise
  (delete, pin, tag). Roll back on error with `onError`.

---

## shadcn/ui + Base UI

- Use shadcn components as the default. Only reach for Base UI
  primitives when shadcn doesn't have what you need.
- Never override shadcn component internals by editing files in
  `src/components/ui/`. Wrap them instead:
```tsx
  // ✗ editing Button.tsx in components/ui
  // ✓ create NoteActionButton.tsx that wraps <Button>
```
- Use the `cn()` utility for conditional class names.
  Never string-concatenate Tailwind classes.
- Avoid arbitrary Tailwind values (`w-[372px]`). Use the scale.
  If you need something off-scale, it probably belongs in CSS.

---

## File Structure

src/

components/       # shared UI components

sidebar/        # sidebar-specific components

editor/         # editor-specific components

ui/             # shadcn generated (do not edit)

hooks/            # one file per hook

pages/            # one file per route, default exports

lib/              # supabase client, queryKeys, utils

types/            # shared types only (see TypeScript rules)

A file should do one thing. If you are unsure which folder a
file belongs in, it is probably a sign the file is doing
too much.

---

## File Size Limits

| File type | Soft limit | Hard limit |
|---|---|---|
| Component | 100 lines | 150 lines |
| Hook | 80 lines | 120 lines |
| Page | 60 lines | 100 lines |
| Utility / lib | 60 lines | 100 lines |

When a file approaches its hard limit: stop, extract, then continue.

---

## Naming

- Components: `PascalCase`
- Hooks: `camelCase` prefixed with `use`
- Everything else: `camelCase`
- Files: match the primary export name exactly
  (`NoteEditor.tsx` exports `NoteEditor`)
- Boolean variables and props: prefix with `is`, `has`, or `can`
  (`isLoading`, `hasError`, `canEdit`)
- Event handler props: prefix with `on` (`onSave`, `onDelete`)
- Event handler implementations: prefix with `handle`
  (`handleSave`, `handleDelete`)

---

## Comments

Write comments that explain **why**, not **what**.
The code already says what it does.

```ts
// ✗ Increment count by 1
count++

// ✓ Supabase RLS requires user_id on insert even though the
// policy already filters by auth.uid() — omitting it throws a
// policy violation error on the client.
const payload = { ...note, user_id: session.user.id }
```

Comment every non-obvious decision. Do not comment obvious code.

---

## What to Avoid

- `useEffect` for data fetching — use React Query.
- `useEffect` for syncing props to state — derive instead.
- Nested ternaries in JSX — extract to a variable or component.
- Index as a list key when items can reorder or be deleted.
- Prop drilling more than two levels — lift to context or
  React Query cache.
- `console.log` left in committed code.
- Importing from `@/components/ui` inside other `components/ui`
  files — shadcn components should not depend on each other
  beyond what shadcn itself generates.
