# Pre-Configured Agent Team Compositions

Copy-paste these prompts to the lead session to spawn a team. Adjust teammate count and tasks based on actual scope.

---

## 1. Cross-Layer Feature Team

**When to use**: Adding a feature that touches components, stores, Supabase, and i18n simultaneously (e.g., "team groups", "calendar integration", "shared schedules").

```
Create an agent team with 3 teammates for implementing [FEATURE NAME]:

1. "frontend" — Owns Vue components and views in src/components/ and src/views/.
   Build the UI using existing patterns: Composition API with <script setup lang="ts">,
   Tailwind classes, Lucide icons. Import from stores and composables. Do NOT modify store files.

2. "backend" — Owns Pinia stores (src/stores/), composables (src/composables/),
   Supabase migrations (supabase/migrations/), and types (src/types/).
   Follow existing patterns: defineStore with setup syntax, async functions with
   try/catch wrapping supabase queries, .eq('user_id', authStore.user.id) for access control.

3. "i18n-and-config" — Owns translation strings (src/i18n/messages.ts),
   Tailwind config (tailwind.config.js), and router updates (src/router/index.ts).
   Add keys for both EN and ES using dot notation (section.subsection.key).
   Coordinate with frontend teammate on which translation keys to create.

Dependencies: backend must define types and store API before frontend can consume them.
i18n-and-config should coordinate with frontend on translation keys.
Require plan approval before any teammate makes changes.
```

---

## 2. Multi-Perspective Code Review Team

**When to use**: Reviewing a PR or a set of changes from multiple angles before merging.

```
Create an agent team with 3 reviewers for [PR/CHANGE DESCRIPTION]:

1. "security" — Review Supabase RLS policies, auth flows in src/stores/auth.ts,
   and any new database queries for injection risks, missing user_id filtering,
   and exposed endpoints. Check that every contacts query enforces user ownership.
   Flag any client-side secrets or env var leaks.

2. "performance" — Review Vue reactivity patterns for unnecessary re-renders,
   computed vs watch usage, Supabase query efficiency, and bundle size impact.
   Check Intl.DateTimeFormat usage in TimeService for timezone-heavy operations.
   Flag any missing cleanup in composables (onUnmounted, interval clearing).

3. "ux-a11y" — Review component accessibility (ARIA labels, keyboard navigation,
   color contrast in all 5 themes and dark mode). Check i18n completeness for
   both EN and ES. Verify responsive behavior and Tailwind breakpoint usage.

Have each reviewer investigate independently, then share findings. Reviewers should
challenge each other's findings — a security concern might have performance implications
and vice versa. Synthesize into a prioritized list.
```

---

## 3. Competing Hypothesis Debugging Team

**When to use**: Bug with unclear root cause, especially involving timezone calculations, auth state, or Supabase data sync.

```
Users report: [DESCRIBE THE BUG].

Create an agent team with 3-4 teammates to investigate competing hypotheses:

1. "timezone-investigator" — Hypothesis: bug is in timezone conversion logic.
   Examine src/services/TimeService.ts, src/composables/useContactTime.ts, and
   src/composables/useContactAvailability.ts. Check Intl.DateTimeFormat edge cases
   (DST transitions, half-hour offsets like Asia/Kolkata, UTC+13 zones).

2. "auth-data-investigator" — Hypothesis: bug is in auth state or data fetching.
   Examine src/stores/auth.ts (session initialization, onAuthStateChange timing),
   src/stores/contacts.ts (fetch ordering, race conditions), and Supabase RLS
   policies in migrations.

3. "ui-state-investigator" — Hypothesis: bug is in Vue reactivity or component state.
   Examine the relevant Vue components for stale refs, missing watchers,
   incorrect computed dependencies, or lifecycle timing issues.

Have teammates talk to each other to disprove each other's theories. Update findings
as evidence emerges. The hypothesis that survives scrutiny is likely the root cause.
```

---

## 4. Internationalization Expansion Team

**When to use**: Adding support for multiple new languages simultaneously.

```
Create an agent team to add [LANGUAGE 1], [LANGUAGE 2], and [LANGUAGE 3] support:

Each teammate owns one language and adds a complete translation block to
src/i18n/messages.ts following the existing key structure from the 'en' block.

1. "[lang1]-translator" — Add complete [LANGUAGE 1] translations. Use the English
   block as source. Maintain all existing keys, adapt cultural conventions
   (date formats, formal/informal address).

2. "[lang2]-translator" — Same for [LANGUAGE 2].

3. "[lang3]-translator" — Same for [LANGUAGE 3].

IMPORTANT: src/i18n/messages.ts is a single file. To avoid conflicts, have each
teammate prepare their translation object and send it to the lead. The lead (or
a dedicated teammate) merges all translations into the file at the end.

Also update src/stores/theme.ts or profile settings if language selection UI
needs new options.
```

---

## 5. Sprint Implementation Team

**When to use**: Implementing multiple independent features or improvements in parallel.

```
Create an agent team for a mini-sprint with these tasks:

1. "feature-a" — [DESCRIBE FEATURE A]. Owns files: [LIST FILES].
2. "feature-b" — [DESCRIBE FEATURE B]. Owns files: [LIST FILES].
3. "feature-c" — [DESCRIBE FEATURE C]. Owns files: [LIST FILES].

Rules:
- No teammate should edit another's files. If coordination is needed, message each other.
- Each teammate: implement, then verify with `npm run build` to check for type errors.
- Use delegate mode (Shift+Tab) so I focus on coordination only.
- Create 5-6 tasks per teammate in the shared task list.
```

---

## Notes

- These compositions are starting points. Adjust teammate count based on task complexity.
- For small tasks (single-layer changes), skip agent teams and use subagents via the Task tool instead.
- Teammates load CLAUDE.md automatically, so they'll have project context. But always include task-specific details in the spawn prompt.
- The file ownership table in CLAUDE.md defines safe boundaries for parallel edits.
