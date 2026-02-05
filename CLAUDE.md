# WorldTime.es

Global team coordination app — timezone management, contact availability tracking, and work schedule visualization.

## Tech Stack

- **Frontend**: Vue 3 (Composition API) + TypeScript + Vite
- **State**: Pinia stores (`src/stores/`)
- **Styling**: Tailwind CSS with 5 theme variants + dark/light mode
- **Backend**: Supabase (auth, Postgres with RLS, real-time)
- **i18n**: Vue I18n (English + Spanish)
- **Validation**: Zod
- **Icons**: Lucide Vue Next

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build (runs vue-tsc + vite build)
npm run preview  # Preview production build
```

No test runner is configured yet.

## Architecture

```
src/
├── components/    # 14 reusable Vue components (ContactCard, Timeline, PersonCard, etc.)
├── views/         # 7 page-level components (Home, Landing, Login, Profile, etc.)
├── stores/        # 5 Pinia stores (auth, contacts, people, theme, notifications)
├── services/      # TimeService — timezone conversion and formatting
├── composables/   # useContactAvailability, useContactTime, useTimeline
├── types/         # TypeScript interfaces (Person, Contact, User, TimeRange)
├── lib/           # Supabase client initialization
├── i18n/          # Translation messages (EN/ES)
└── data/          # Default/demo data
supabase/
└── migrations/    # 4 SQL migration files (profiles + contacts tables, RLS policies)
```

### Key Patterns

- **Stores own data, components own presentation.** All Supabase queries live in stores, not in components.
- **Composables for shared reactive logic.** `useContactAvailability` computes working/sleeping/free status; `useTimeline` handles drag interactions.
- **RLS enforces access control.** Every contacts query includes `.eq('user_id', authStore.user.id)` as defense-in-depth alongside Supabase RLS policies.
- **Auth via magic link OTP.** No password storage. Google OAuth also configured.
- **i18n keys follow dot notation.** Format: `section.subsection.key` (e.g., `contacts.addNew`).

### File Ownership Boundaries

These boundaries are important for parallel work — each area can be modified independently:

| Layer | Files | Dependencies |
|-------|-------|-------------|
| **Components** | `src/components/*.vue` | Import from stores, composables, types |
| **Views** | `src/views/*.vue` | Import from components, stores, router |
| **Stores** | `src/stores/*.ts` | Import from lib/supabase, types. Cross-store refs allowed |
| **Services** | `src/services/*.ts` | Pure logic, no Vue/store deps |
| **Composables** | `src/composables/*.ts` | Import from services, stores |
| **Types** | `src/types/*.ts` | No imports (leaf nodes) |
| **Database** | `supabase/migrations/*.sql` | Independent of frontend |
| **i18n** | `src/i18n/messages.ts` | No imports (leaf node) |
| **Styles** | `tailwind.config.js`, `src/index.css` | Independent |

## Parallelization: Subagents vs Agent Teams

Use subagents (Task tool) for ~90% of parallel work. Use agent teams when teammates need to communicate with each other.

### Decision Matrix

| Scenario | Use | Why |
|----------|-----|-----|
| Search codebase, read files, gather context | **Subagent** | Result-only, cheap |
| Run build + type-check in background | **Subagent** | One-shot task |
| Implement isolated feature (one layer) | **Subagent** | No cross-agent communication needed |
| Cross-layer feature (component + store + migration + i18n) | **Agent team** | Teammates coordinate file ownership |
| Code review from multiple perspectives | **Agent team** | Reviewers challenge each other's findings |
| Debug with unknown root cause | **Agent team** | Competing hypotheses, teammates disprove each other |
| Add multiple new languages in parallel | **Agent team** | Each translator owns one language, shares patterns |
| Sprint: implement multiple independent features | **Agent team** | Parallel implementation with shared task list |

### Agent Teams Key Concepts

- **Team lead**: Your main session. Coordinates work, assigns tasks, synthesizes results.
- **Teammates**: Independent Claude Code instances with their own context windows. They load this CLAUDE.md but do NOT inherit the lead's conversation history.
- **Delegate mode** (Shift+Tab): Restricts the lead to coordination-only — no code edits, just orchestration.
- **Shared task list**: Tasks with states (pending/in-progress/completed) and dependencies. Teammates self-claim unblocked tasks.
- **Inter-agent messaging**: Teammates can message each other directly, not just report to the lead.
- **Plan approval**: Lead can require teammates to submit plans before implementing. Useful for risky changes.

### Agent Teams Best Practices for This Project

1. **Distinct file ownership.** Assign each teammate different layers from the ownership table above. Two teammates editing the same `.vue` file will cause overwrites.
2. **5-6 tasks per teammate.** Keeps everyone productive and lets the lead reassign if someone gets stuck.
3. **Include context in spawn prompts.** Teammates don't see the lead's history. Say exactly what files, what the goal is, what patterns to follow.
4. **Start with review tasks** if unfamiliar with agent teams. Research/review has clear boundaries and low risk.
5. **Wait for teammates.** Tell the lead "wait for teammates to finish before proceeding" if it starts implementing itself.

### Limitations

- No session resumption for teammates (after `/resume`, spawn fresh teammates)
- One team per session, no nested teams
- Lead is fixed — can't promote a teammate
- Higher token cost than subagents — use only when communication between workers adds value
