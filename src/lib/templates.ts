import { formatDate } from '@/lib/utils'

export type BuiltinTemplate = {
  id: string
  name: string
  content: string
}

export const BUILTIN_TEMPLATES: BuiltinTemplate[] = [
  {
    id: 'builtin-meeting',
    name: 'Meeting Notes',
    content: `# Meeting Notes

**Date:** {{date}}
**Attendees:**

## Agenda

-

## Notes

## Action Items

- [ ]

## Decisions Made

`,
  },
  {
    id: 'builtin-todo',
    name: 'To-Do List',
    content: `# To-Do List

## Today

- [ ]

## This Week

- [ ]

## Someday

- [ ]
`,
  },
  {
    id: 'builtin-journal',
    name: 'Daily Journal',
    content: `# {{date}}

## How I'm feeling

## What happened today

## What I'm grateful for

1.
2.
3.

## Tomorrow's focus

`,
  },
  {
    id: 'builtin-project',
    name: 'Project Brief',
    content: `# Project Name

## Goal

## Scope

### In scope

-

### Out of scope

-

## Timeline

| Milestone | Date |
|-----------|------|
|           |      |

## Notes

`,
  },
]

/** Replaces template variables (currently just `{{date}}`) with their current values. */
export function applyTemplateVariables(content: string): string {
  return content.replace(/\{\{date\}\}/g, formatDate(new Date().toISOString()))
}
