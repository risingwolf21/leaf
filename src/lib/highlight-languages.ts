import { createLowlight } from 'lowlight'

import bash       from 'highlight.js/lib/languages/bash'
import css        from 'highlight.js/lib/languages/css'
import diff       from 'highlight.js/lib/languages/diff'
import html       from 'highlight.js/lib/languages/xml'   // xml covers html
import java       from 'highlight.js/lib/languages/java'
import javascript from 'highlight.js/lib/languages/javascript'
import json       from 'highlight.js/lib/languages/json'
import kotlin     from 'highlight.js/lib/languages/kotlin'
import markdown   from 'highlight.js/lib/languages/markdown'
import plaintext  from 'highlight.js/lib/languages/plaintext'
import python     from 'highlight.js/lib/languages/python'
import rust       from 'highlight.js/lib/languages/rust'
import scss       from 'highlight.js/lib/languages/scss'
import shell      from 'highlight.js/lib/languages/shell'
import sql        from 'highlight.js/lib/languages/sql'
import swift      from 'highlight.js/lib/languages/swift'
import typescript from 'highlight.js/lib/languages/typescript'
import yaml       from 'highlight.js/lib/languages/yaml'

export const lowlight = createLowlight()

lowlight.register({ bash, css, diff, java, javascript, json, kotlin,
  markdown, plaintext, python, rust, scss, shell, sql, swift,
  typescript, yaml })
lowlight.register({ html })  // registered as 'xml', aliased

export const SUPPORTED_LANGUAGES: Array<{ value: string; label: string }> = [
  { value: 'plaintext',  label: 'Plain text' },
  { value: 'bash',       label: 'Bash' },
  { value: 'css',        label: 'CSS' },
  { value: 'diff',       label: 'Diff' },
  { value: 'html',       label: 'HTML' },
  { value: 'java',       label: 'Java' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'json',       label: 'JSON' },
  { value: 'kotlin',     label: 'Kotlin' },
  { value: 'markdown',   label: 'Markdown' },
  { value: 'python',     label: 'Python' },
  { value: 'rust',       label: 'Rust' },
  { value: 'scss',       label: 'SCSS' },
  { value: 'shell',      label: 'Shell' },
  { value: 'sql',        label: 'SQL' },
  { value: 'swift',      label: 'Swift' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'yaml',       label: 'YAML' },
]
