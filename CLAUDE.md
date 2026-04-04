# CLAUDE.md — Micro-Business Launchpad (BZNS)

## Project Overview

An AI copilot that takes someone from "I have a skill and want to start a business" to "I am legally operating a business in Québec." All the steps, all the money, all the numbers, in one place, in plain language, in any language.

**Hackathon:** Claude Builders Hackathon @ McGill — April 1-4, 2026
**Track:** Economic Empowerment & Education (Social Impact)
**Team:** Pierre, Joseph Rassi, Rami Nawam — all working across the full stack.

## The Problem

Québec has one of the most fragmented startup environments in Canada. To legally start a micro-business, you need to navigate 6+ government entities, 80+ funding programs, and a tax system that surprises every first-time self-employed person. The information exists but is scattered across dozens of websites, mostly in bureaucratic French.

## Target Users

- **Yara, 26** — Syrian immigrant, pastry chef. Wants to sell baked goods from her home kitchen. Eligible for $90K+ in funding she doesn't know about.
- **Marcus, 23** — McGill grad, freelance software consultant. Doesn't know about REQ registration or 12.8% QPP double contributions.
- **Fatima, 41** — Single mother wants to open a home daycare. Doesn't know about the STA program that provides income support during startup.

## Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** TailwindCSS (teal primary #0D9488, amber accent #F59E0B)
- **State:** Zustand (5 stores: profile, roadmap, funding, chat, locale)
- **Database + Auth:** Supabase (Postgres, magic-link auth, RLS)
- **AI:** Claude API — Sonnet 4.6 (roadmap generation, funding explanations, financial insights, contextual assistant)
- **Validation:** Zod (every Claude response validated before storage)
- **Translations:** next-intl + custom `useTranslation` hook (FR/EN; AI responses multilingual natively)
- **Deploy:** Vercel

## Design System

- **Primary:** Teal (#0D9488 / teal-600) — full 11-shade palette in tailwind.config.ts
- **Accent:** Amber (#F59E0B) for CTAs and highlights
- **Background:** Slate-50 (#F8FAFC)
- **Cards:** White, subtle shadow, rounded-xl
- **Text:** Slate-900 headings, Slate-600 body
- **Fonts:** Space Grotesk (headings), DM Sans (body), JetBrains Mono (code)
- **Tone:** Clean, professional, approachable — NOT generic AI slop

## Core Features

1. **Conversational Intake** — 8 plain-language questions, one per screen, progress bar. Deterministic decision tree classifies into C1-C12 cluster (no AI needed for intake).
2. **Legal Roadmap** — 3-layer generation: Claude generates steps from KB → Claude adversarially reviews for gaps → merge flags with confidence levels. Dependency-ordered, step completion syncs back to profile.
3. **Funding Matcher** — Deterministic scoring engine ranks 15+ Quebec funding programs. Claude only for "explain this program." Key demo moment: "$95,000+ available."
4. **Financial Snapshot** — Hybrid: deterministic tax math (GST/QST, QPP 12.8%, income tax brackets, QPIP) + cluster-aware expense defaults + questionnaire-based revenue inference + Claude for situational insights (stubbed). Key demo moment: "$573/mo take-home."
5. **Contextual AI Assistant** — Floating panel across all screens. Knows full user state. Cites sources. Refers to professionals when out of scope.

### Stretch Features
6. **Starter Kit** — One-click .docx generation (contract, invoice, pitch). Not built yet.
7. **Pricing Engine** — Pure math, lowest priority. Not built.

## What Is Built (Current State)

### Fully Implemented ✅
- `tailwind.config.ts` — teal/amber design system with custom fonts, shadows, animations
- `src/app/globals.css` — full component layer (btn, card, input, badge, skeleton, shimmer)
- All 5 Zustand stores (profile, roadmap, funding, chat, locale) with optimistic updates
- All UI components: button, card, input, badge, progress-bar, skeleton, language-toggle
- Layout components: sidebar, top-bar
- Intake wizard (8 questions, state machine, progress)
- Roadmap components: roadmap-list, roadmap-step, step-detail with dependency enforcement
- Funding components: funding-list, funding-card, funding-detail modal
- Financial components: snapshot-card, expense-input, take-home-breakdown, watch-out-flags
- Assistant components: chat-panel, floating-assistant, message-bubble, source-badge
- All app pages: dashboard, intake, roadmap, funding, financial, profile, settings
- Landing page: hero, personas, bento features, stats, "how it works," source attribution bar
- Auth: login page, callback handler
- All 7 API routes: profile, roadmap, funding, financial-snapshot, assistant, cache, auth/callback
- All repositories (6 files): profile, roadmap, funding, snapshot, chat, cache
- All services (6 files): profile, roadmap, funding, financial, assistant, cache
- Business classifier: deterministic decision tree → C1-C12 (no AI)
- Cluster system: 12 clusters with KB file mappings and complexity ratings
- Tax calculator: pure math — income tax, GST/QST, QPP, QPIP, quarterly installments (2026 QC rates)
- Expense defaults: cluster-specific templates for all 12 clusters
- Financial deductions: per-cluster deduction categories
- Financial projections: 3-scenario, break-even, pricing calc, funding runway
- Financial questionnaire: cluster-specific questions → infer revenue/expenses
- Funding scorer: deterministic eligibility + match scoring for 15+ programs
- Roadmap gap detection: adversarial Claude review + flag merging + confidence levels
- Step → profile sync: completing steps updates profile fields + triggers funding re-match
- Knowledge base loader, selector, and prompt builders
- All 25 KB JSON files in `/data/` (funding, permits, registration, tax, compliance)
- Supabase migrations: `001_initial_schema.sql` and `002_financial_questionnaire.sql`
- Auth middleware protecting all `/app/*` routes

### Partially Done / Stubbed ⚠️
- **Claude financial insights** — schema ready, Zod schema defined, but the call in `financial.service.ts` returns empty (`suggested_expenses: [], pricing_insight: '', watch_out_flags: []`). Needs ~5 lines uncommented.
- **i18n translations** — next-intl configured, custom `useTranslation` hook exists, but translation JSON files (`en.json`, `fr.json`) may be incomplete.
- **Multi-language UI** — language toggle works, but some page text is still hardcoded English.

### Still To Do 📋
- [ ] Set up Supabase project + fill `.env.local` (URL, anon key, Anthropic key)
- [ ] Run `supabase/migrations/001_initial_schema.sql` + `002_financial_questionnaire.sql` in Supabase SQL editor
- [ ] Add `http://localhost:3000/auth/callback` + production URL to Supabase redirect URLs
- [ ] Wire Claude financial insights (uncomment in `financial.service.ts`)
- [ ] Complete i18n translation files
- [ ] Vercel deployment: connect repo, set env vars
- [ ] Seed Yara demo account (profile + roadmap + funding + snapshot + chat pre-cached in Supabase)
- [ ] Financial Snapshot waterfall/bar chart visual (take-home-breakdown component exists, needs chart)
- [ ] End-to-end validation on all 3 personas (Yara, Marcus, Fatima)
- [ ] Verify cached responses work as fallback for demo day

## File Structure (Actual)

```
src/
├── app/
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Landing page
│   ├── globals.css
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── callback/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx              # Sidebar + top bar (authenticated layout)
│   │   ├── dashboard/page.tsx      # Overview: financial snapshot, roadmap progress, funding totals
│   │   ├── intake/page.tsx
│   │   ├── roadmap/page.tsx
│   │   ├── funding/page.tsx
│   │   ├── financial/page.tsx      # Expense input, tax breakdown, scenarios, break-even
│   │   ├── profile/page.tsx
│   │   └── settings/page.tsx
│   └── api/
│       ├── profile/route.ts
│       ├── roadmap/route.ts
│       ├── funding/route.ts
│       ├── financial-snapshot/route.ts
│       ├── assistant/route.ts
│       ├── auth/callback/route.ts
│       └── cache/route.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser client
│   │   ├── server.ts               # Server client
│   │   └── middleware.ts
│   ├── claude/
│   │   ├── client.ts               # Anthropic SDK wrapper
│   │   ├── prompts.ts              # Prompt templates
│   │   └── schemas.ts              # Zod schemas for Claude responses
│   ├── knowledge-base/
│   │   ├── loader.ts
│   │   ├── selector.ts
│   │   └── prompts.ts              # Builds KB-grounded prompts for Claude
│   ├── funding/
│   │   ├── scorer.ts               # Deterministic funding scorer
│   │   └── classify.ts             # Eligibility logic
│   ├── financial/
│   │   ├── tax-calculator.ts       # Deterministic tax math (all 2026 QC rates)
│   │   ├── constants.ts            # Tax brackets, rates, thresholds
│   │   ├── expense-defaults.ts     # Cluster-specific expense templates
│   │   ├── deductions.ts           # Per-cluster deduction categories
│   │   ├── projections.ts          # Scenarios, break-even, pricing, runway
│   │   └── cluster-questions.ts    # Financial questionnaire per cluster
│   ├── roadmap/
│   │   └── step-profile-sync.ts    # Maps step_key → profile field updates
│   ├── classifier.ts               # Decision tree → C1-C12 cluster
│   ├── clusters.ts                 # Cluster metadata + KB file mappings
│   ├── demo-data.ts
│   └── i18n/
│       ├── config.ts
│       └── useTranslation.ts
├── stores/
│   ├── profile-store.ts
│   ├── roadmap-store.ts
│   ├── funding-store.ts
│   ├── chat-store.ts
│   └── locale-store.ts
├── services/
│   ├── profile.service.ts
│   ├── roadmap.service.ts
│   ├── funding.service.ts
│   ├── financial.service.ts
│   ├── assistant.service.ts
│   └── cache.service.ts
├── repositories/
│   ├── profile.repository.ts
│   ├── roadmap.repository.ts
│   ├── funding.repository.ts
│   ├── snapshot.repository.ts
│   ├── chat.repository.ts
│   └── cache.repository.ts
├── components/
│   ├── ui/                         # button, card, input, progress-bar, badge, skeleton, language-toggle
│   ├── layout/                     # sidebar.tsx, top-bar.tsx
│   ├── intake/                     # intake-wizard, question-card, intake-progress
│   ├── roadmap/                    # roadmap-list, roadmap-step, step-detail
│   ├── funding/                    # funding-list, funding-card, funding-detail
│   ├── financial/                  # snapshot-card, expense-input, take-home-breakdown, watch-out-flags
│   └── assistant/                  # chat-panel, floating-assistant, message-bubble, source-badge
├── types/
│   ├── profile.ts                  # ClusterID (C1-C12), Profile, IntakeAnswers
│   ├── roadmap.ts                  # RoadmapStep, StepStatus, GapFlag, StepConfidence
│   ├── funding.ts                  # FundingMatch, FundingProgramJSON, ProgramType
│   ├── financial.ts                # FinancialSnapshot, TaxCalculationResult, FinancialInsights
│   └── chat.ts                     # ChatMessage, AssistantReply, SourceCitation
└── middleware.ts                   # Auth + route protection
```

## Navigation (Sidebar)

- Logo + app name ("Launchpad")
- Dashboard (home icon)
- Legal Roadmap (checklist icon)
- Funding (dollar icon)
- Financial (calculator icon)
- Settings (gear icon)
- Language toggle (FR/EN) at bottom
- User avatar + logout at bottom

## Database Schema

Two migrations in `supabase/migrations/`:
- `001_initial_schema.sql` — profiles, roadmap_steps, funding_matches, financial_snapshots, chat_messages, generated_documents, response_cache. All with RLS policies scoped to `auth.uid()`.
- `002_financial_questionnaire.sql` — adds `financial_questionnaire_completed` and `financial_questionnaire_answers` JSONB columns to profiles.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
```

## Key Architecture Decisions

- **Deterministic classification** — intake uses a pure decision tree (no AI). Fast, reproducible.
- **3-layer roadmap** — generate → adversarial gap detection → merge. More robust than single-shot.
- **Tax math never touches AI** — pure TypeScript with hardcoded 2026 QC rates. Tested.
- **Cluster-specific everything** — expenses, deductions, KB files, questionnaire all tied to C1-C12.
- **Profile changes invalidate downstream** — `markStale()` on roadmap and funding stores triggers re-generation when profile updates.
- **Zustand with optimistic updates** — all mutations are optimistic with rollback on error.
- **Supabase RLS** — authorization at the database level. No custom auth logic needed.
- **No ORM** — Supabase JS client only.
- **Zod validates all Claude output** — malformed responses are caught before reaching the DB.

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npm run type-check   # TypeScript check
```
