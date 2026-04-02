# MICRO-BUSINESS LAUNCHPAD — COMPLETE PROJECT PLAN v2
# Claude Builders Hackathon @ McGill — April 1-4, 2026
# Updated: 1st April, 2026

---

# TABLE OF CONTENTS

1. Product Summary
2. Stack
3. Features (complete list)
4. Project File Structure
5. Database Schema
6. Knowledge Base Schema
7. API Routes Specification
8. System Prompts
9. UI Screens Specification
10. Feature Logic — Implementation Details
11. Build Assignments — Hour by Hour

---

# 1. PRODUCT SUMMARY

## One-liner
An AI copilot that takes someone from "I have a skill and want to start a business" to 
"I am legally operating a business in Québec" — all the steps, all the money, all the 
numbers, in one place, in plain language, in any language.

## The problem
Québec has one of the most fragmented startup environments in Canada. To legally start 
a micro-business, you need to navigate at minimum 6 government entities (REQ, Revenu 
Québec, CRA, City of Montréal, sector regulators, Bill 96 compliance), 80+ funding 
programs, and a tax system that surprises every first-time self-employed person. The 
information exists but is scattered across dozens of websites, mostly in bureaucratic 
French, and assumes you already know what you're looking for.

## Who we're building for

**Yara, 26** — Syrian immigrant, pastry chef, Villeray. Wants to sell baked goods from 
her home kitchen. Has no idea what she needs to do legally, what to charge, or that she's 
eligible for $90K+ in funding. Would need 8+ government websites to piece it together.

**Marcus, 23** — McGill grad, Plateau. Freelance software consulting. Thinks he's "just 
doing side work." Doesn't know about REQ registration, 12.8% QPP double contributions, 
or quarterly tax installments. Will be shocked when he sees his actual take-home rate.

**Fatima, 41** — Single mother, Rosemont. Wants to open a home daycare — one of the most 
regulated micro-businesses in QC. Doesn't know about the STA program that provides income 
support during startup.

## Three required questions

**Who are you building this for, and why do they need it?**
Aspiring micro-entrepreneurs in Quebec who have skills but no guide. Immigrants, first-gen 
students, career changers, single parents — people who can't afford a lawyer and accountant 
just to understand what steps to take. Over 60,000 new businesses register in Quebec 
annually, and most founders navigate this maze alone.

**What could go wrong, and what would you do about it?**
Wrong legal/tax guidance could cost someone money or legal trouble. Every recommendation 
links to the authoritative government source. The tool explicitly states it is not a legal 
or accounting advisor. High-stakes decisions present trade-offs and recommend free 
professional resources (YES Montréal, PME MTL, Info entrepreneurs). Claude is constrained 
to a curated knowledge base — it cannot fabricate requirements. Zod validates every AI 
response before it reaches the user.

**How does this help people rather than make decisions for them?**
The tool presents options with explained trade-offs, not recommendations. "Sole 
proprietorship vs corporation" becomes a comparison of costs, liability, and tax 
implications at the user's specific income level — they decide. Funding shows eligibility 
scores — they choose which to apply for. The financial snapshot shows real numbers — they 
set their own prices. We inform, they decide.

---

# 2. STACK

## Deployed (what runs in production)

| Layer | Tool | Why |
|-------|------|-----|
| Framework | **Next.js 14 (App Router)** | React frontend + API routes in one repo. One `git push` deploys everything to Vercel. No separate backend server. |
| Styling | **TailwindCSS** | Fast to build polished UI. Teal primary color system, consistent spacing, clean cards. Claude Code generates Tailwind extremely well. |
| State | **Zustand (3 stores)** | `useProfileStore`, `useRoadmapStore`, `useChatStore`. Lightweight, no boilerplate, persists to localStorage as backup. |
| Database + Auth + Storage | **Supabase** | Postgres database (profiles, roadmap, funding, chat, docs), magic-link auth (no passwords), file storage (.docx contracts), Row Level Security. Team already has experience with it. |
| AI | **Claude API — Sonnet 4.6** | Called for 4 tasks: profile synthesis, roadmap generation, financial insight generation, contextual assistant. Responses validated with Zod before storage. |
| Validation | **Zod** | Schema validation on every Claude response. Catches malformed output before it hits the database. |
| Translations | **i18next** | Static UI strings only (sidebar labels, buttons, headings) in FR/EN. All AI-generated content is multilingual for free via Claude. |
| Documents | **docx npm package** | Generates real .docx files from templates. Legal clauses hardcoded — Claude only fills personalized fields. |
| Deploy | **Vercel** | `git push origin main` → live in 45 seconds. Environment vars set once in dashboard. API routes deploy as serverless functions automatically. |

## Not deployed (local tooling)

| Tool | Why |
|------|-----|
| **Python** | Knowledge base curation scripts: scraping government sites, structuring JSON files, validating data completeness. Runs on your laptops, outputs committed to repo. |
| **VS Code + Claude Code** | Every teammate's IDE. Claude Code writes 80%+ of the implementation. |

## What's NOT in the stack (and why)

- **No Express / FastAPI** — Next.js API routes handle all server-side logic. No second server to deploy, no CORS, no separate hosting.
- **No React Router** — Next.js App Router handles routing via folder structure.
- **No ORM (Prisma/Drizzle)** — Supabase JS client is enough for simple reads/writes.
- **No Java** — Wrong tool for a 4-day hackathon. TypeScript everywhere.
- **No separate backend deployment** — One repo, one Vercel project, one URL.

## Knowledge Base (the competitive moat)

Flat JSON files in `/data/` directory. Version-controlled, reviewed in PRs, loaded at build 
time. Edited directly by your team — no CMS, no database migrations. Contains curated, 
verified Quebec regulatory data that no existing tool has in this form.

---

# 3. FEATURES (Complete List)

## CORE FEATURES (non-negotiable — this IS your product)

### Feature 1: Conversational Intake
8 plain-language questions that build a structured user profile. One question per screen, 
progress bar, stored in Supabase. Claude classifies the business type and sector from 
free-text input. This is the single entry point — every other feature reads from this 
profile. Inputs: business idea (free text), location + borough, home-based vs commercial, 
age, immigration status, expected monthly revenue, partners/employees, languages spoken.

### Feature 2: Legal Roadmap
Personalized, dependency-ordered checklist of every legal/administrative step to operate. 
Claude generates it from the curated knowledge base, specific to their business type, 
location, borough, and structure. Each step has: plain-language description, cost, timeline, 
required documents, direct government link, source citation. Users can mark steps complete 
and pick up where they left off. Dependency enforcement: locked steps show which 
prerequisites are missing.

### Feature 3: Funding Matcher
Deterministic scoring engine (no AI) that ranks 15+ Quebec funding programs against the 
user's profile. Each program scored on age, location, citizenship, business stage, sector, 
and demographics. Shows match score (0-100), amount, type (grant/loan/tax credit), 
eligibility breakdown (✅/❌ per criterion), and application link. Claude only called when 
user clicks "explain this program." The "$95,000+ available" total is a key demo moment.

### Feature 4: Financial Snapshot
A single-screen financial reality check that answers: "If I charge X and sell Y, what do I 
actually take home?" Hybrid engine: deterministic math for tax calculations (GST/QST, 
QPP at 12.8%, QPIP, federal + provincial income tax brackets) + Claude for 
situation-specific insights (missing expense categories, pricing guidance, risk flags). 
Mostly powered by data already captured in intake — only 2-3 additional inputs needed 
(monthly expenses, optionally price per unit and volume). Output: gross revenue → taxes → 
contributions → expenses → actual take-home number. Includes "watch out" flags (approaching 
QST threshold, quarterly installments due, expenses you're probably forgetting).

### Feature 5: Contextual AI Assistant
Persistent chat interface that knows the user's full state: profile, roadmap progress, 
funding matches, financial snapshot, and conversation history. Answers questions specific 
to their situation. Cites sources from the knowledge base. Refers to professionals (YES 
Montréal, PME MTL, Éducaloi, community tax clinics) when out of scope. Available from 
every screen.

## STRETCH FEATURES (build if core is solid by end of Day 2)

### Feature 6: Starter Kit
One-click generation of personalized business documents as downloadable .docx files. 
Three document types: bilingual FR/EN service contract (Bill 96 compliant), invoice 
template (with NEQ, GST/QST fields), and 2-paragraph business pitch. Legal clauses are 
hardcoded templates — Claude only fills personalized fields (business name, price, NEQ, 
borough, service description). Upload to Supabase Storage, return signed download URL.

### Feature 7: Pricing Engine
Pure math, no AI. User enters their actual costs (ingredients, packaging, time, utilities). 
Engine calculates true cost per unit, compares against hardcoded Montréal market rates for 
their business type, and recommends a price with visible reasoning. Projects monthly revenue 
and profit at each price tier. LOWEST PRIORITY — cut this first if behind schedule.

## INFRASTRUCTURE (invisible to user, critical to winning)

### Infrastructure 1: Curated Knowledge Base
14+ structured JSON files covering business structures, REQ registration, tax obligations 
(GST/QST, QPP, income tax, deductions), sector permits (MAPAQ, Ministère de la Famille, 
municipal Montreal), 15+ funding programs with eligibility rules, Bill 96 compliance, and 
Quebec financial constants (tax brackets, contribution rates). Every fee verified against 
official government page, every URL tested.

### Infrastructure 2: Response Caching
Pre-generate and cache Yara's roadmap, funding results, financial snapshot, and assistant 
answers in Supabase. Live demo runs from cache if Claude API is slow on hackathon day. 
Judges never see a spinner.

### Infrastructure 3: Trilingual AI Responses
Claude responds in whatever language the user writes in (EN/FR/AR). Static UI strings 
translated for FR/EN via i18next. No extra work for Arabic in the AI layer — it's native 
to Claude.

### Infrastructure 4: Pre-loaded Demo Account
Yara's profile fully populated, roadmap generated, funding scored, financial snapshot 
calculated, chat history seeded. Log in and everything is already there. Zero friction 
in the 5-minute pitch.

---

# 4. PROJECT FILE STRUCTURE

```
micro-business-launchpad/
│
├── .env.local                          # NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, ANTHROPIC_API_KEY
├── .env.example
├── .gitignore
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
│
├── public/
│   ├── logo.svg
│   └── favicon.ico
│
├── data/                               # ← THE KNOWLEDGE BASE
│   ├── business_structures.json
│   ├── financial_constants.json        # ← NEW: tax brackets, QPP rates, QST rates for 2026
│   ├── registration/
│   │   ├── req.json
│   │   ├── cra.json
│   │   └── revenu_quebec.json
│   ├── permits/
│   │   ├── mapaq.json
│   │   ├── famille.json
│   │   ├── racj.json
│   │   ├── municipal_montreal.json
│   │   └── professional_orders.json
│   ├── tax/
│   │   ├── gst_qst.json
│   │   ├── qpp.json
│   │   ├── installments.json
│   │   └── deductions.json
│   ├── funding/
│   │   ├── futurpreneur.json
│   │   ├── pme_mtl.json
│   │   ├── bdc.json
│   │   ├── sta.json
│   │   ├── investissement_quebec.json
│   │   ├── fli.json
│   │   ├── irap.json
│   │   ├── demographic_programs.json
│   │   └── canada_summer_jobs.json
│   └── compliance/
│       ├── bill96.json
│       └── signage.json
│
├── scripts/                            # Python tooling (not deployed)
│   ├── validate_knowledge_base.py
│   ├── scrape_req_fees.py
│   └── generate_funding_summary.py
│
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Landing page
│   │   ├── globals.css
│   │   │
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── callback/page.tsx
│   │   │
│   │   ├── (app)/
│   │   │   ├── layout.tsx              # Sidebar + top bar
│   │   │   ├── dashboard/page.tsx      # Profile summary + Financial Snapshot + quick actions
│   │   │   ├── intake/page.tsx
│   │   │   ├── roadmap/page.tsx
│   │   │   ├── funding/page.tsx
│   │   │   ├── starter-kit/page.tsx    # Stretch
│   │   │   └── assistant/page.tsx
│   │   │
│   │   └── api/
│   │       ├── profile/route.ts
│   │       ├── roadmap/route.ts
│   │       ├── funding/route.ts
│   │       ├── financial-snapshot/route.ts   # ← NEW
│   │       ├── assistant/route.ts
│   │       ├── documents/route.ts            # Stretch
│   │       └── cache/route.ts
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── middleware.ts
│   │   ├── claude/
│   │   │   ├── client.ts
│   │   │   ├── prompts.ts              # All 4 system prompts
│   │   │   └── schemas.ts             # All Zod schemas
│   │   ├── knowledge-base/
│   │   │   ├── loader.ts
│   │   │   └── selector.ts
│   │   ├── funding/
│   │   │   └── scorer.ts              # Deterministic funding scorer
│   │   ├── financial/                   # ← NEW
│   │   │   ├── tax-calculator.ts       # Deterministic: income tax, QPP, QPIP, GST/QST
│   │   │   └── constants.ts            # 2026 tax brackets, rates, thresholds
│   │   └── i18n/
│   │       ├── config.ts
│   │       ├── en.json
│   │       └── fr.json
│   │
│   ├── stores/
│   │   ├── profile-store.ts
│   │   ├── roadmap-store.ts
│   │   └── chat-store.ts
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── progress-bar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── skeleton.tsx
│   │   │   └── language-toggle.tsx
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   └── top-bar.tsx
│   │   ├── intake/
│   │   │   ├── intake-wizard.tsx
│   │   │   ├── question-card.tsx
│   │   │   └── intake-progress.tsx
│   │   ├── roadmap/
│   │   │   ├── roadmap-list.tsx
│   │   │   ├── roadmap-step.tsx
│   │   │   └── step-detail.tsx
│   │   ├── funding/
│   │   │   ├── funding-list.tsx
│   │   │   ├── funding-card.tsx
│   │   │   └── funding-detail.tsx
│   │   ├── financial/                   # ← NEW
│   │   │   ├── snapshot-card.tsx        # The main Financial Snapshot card
│   │   │   ├── expense-input.tsx        # Simple expense entry form
│   │   │   ├── take-home-breakdown.tsx  # Visual breakdown: revenue → taxes → take-home
│   │   │   └── watch-out-flags.tsx      # Warning badges (QST threshold, QPP, etc.)
│   │   ├── assistant/
│   │   │   ├── chat-panel.tsx
│   │   │   ├── message-bubble.tsx
│   │   │   └── source-badge.tsx
│   │   └── starter-kit/                # Stretch
│   │       ├── document-picker.tsx
│   │       └── document-preview.tsx
│   │
│   ├── types/
│   │   ├── profile.ts
│   │   ├── roadmap.ts
│   │   ├── funding.ts
│   │   ├── financial.ts                # ← NEW
│   │   └── chat.ts
│   │
│   └── templates/                      # Stretch
│       ├── contract-fr-en.ts
│       └── invoice.ts
│
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql
```

---

# 5. DATABASE SCHEMA

```sql
-- ============================================================
-- TABLE: profiles
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- From intake
  business_name TEXT,
  business_type TEXT NOT NULL,            -- 'food', 'freelance', 'daycare', 'retail', 'personal_care', 'other'
  business_description TEXT,
  industry_sector TEXT,                   -- 'bakery', 'software_consulting', 'home_daycare'
  municipality TEXT NOT NULL DEFAULT 'montreal',
  borough TEXT,
  is_home_based BOOLEAN DEFAULT false,
  has_physical_location BOOLEAN DEFAULT false,
  
  full_name TEXT NOT NULL,
  age INTEGER,
  immigration_status TEXT,                -- 'citizen', 'permanent_resident', 'work_permit', 'student'
  gender TEXT,
  languages_spoken TEXT[],
  preferred_language TEXT DEFAULT 'en',
  
  business_structure TEXT,                -- 'sole_proprietorship', 'corporation', 'partnership', null
  has_partners BOOLEAN DEFAULT false,
  num_employees INTEGER DEFAULT 0,
  expected_monthly_revenue NUMERIC,
  startup_budget NUMERIC,
  has_neq BOOLEAN DEFAULT false,
  has_gst_qst BOOLEAN DEFAULT false,
  
  -- Financial Snapshot inputs (NEW)
  monthly_expenses NUMERIC,               -- Total estimated monthly business expenses
  expense_categories JSONB,               -- { "supplies": 380, "packaging": 90, "utilities": 50 }
  price_per_unit NUMERIC,                 -- Optional: what they charge per product/service
  units_per_month INTEGER,                -- Optional: how many they sell/deliver per month
  
  intake_completed BOOLEAN DEFAULT false,
  intake_answers JSONB,

  UNIQUE(user_id)
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own profile" ON profiles
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- TABLE: roadmap_steps
-- ============================================================
CREATE TABLE roadmap_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  step_order INTEGER NOT NULL,
  step_key TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  why_needed TEXT,
  estimated_cost TEXT,
  estimated_timeline TEXT,
  required_documents TEXT[],
  government_url TEXT,
  source TEXT,
  depends_on TEXT[],
  
  status TEXT DEFAULT 'pending',          -- 'pending', 'in_progress', 'completed', 'skipped'
  completed_at TIMESTAMPTZ,
  notes TEXT,

  UNIQUE(profile_id, step_key)
);

ALTER TABLE roadmap_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own roadmap" ON roadmap_steps
  FOR ALL USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- ============================================================
-- TABLE: funding_matches
-- ============================================================
CREATE TABLE funding_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),

  program_key TEXT NOT NULL,
  program_name TEXT NOT NULL,
  program_type TEXT NOT NULL,             -- 'loan', 'grant', 'tax_credit', 'mentorship'
  amount_description TEXT,
  match_score INTEGER NOT NULL,
  eligibility_details JSONB,
  summary TEXT,
  application_url TEXT,
  source_url TEXT,
  
  is_bookmarked BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,

  UNIQUE(profile_id, program_key)
);

ALTER TABLE funding_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own funding" ON funding_matches
  FOR ALL USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- ============================================================
-- TABLE: financial_snapshots (NEW)
-- ============================================================
CREATE TABLE financial_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Inputs (copied from profile at time of generation for snapshot integrity)
  gross_monthly_revenue NUMERIC NOT NULL,
  monthly_expenses NUMERIC NOT NULL,
  business_structure TEXT NOT NULL,
  
  -- Deterministic calculations
  annual_revenue NUMERIC,
  gst_collected NUMERIC,                  -- 5% of taxable revenue
  qst_collected NUMERIC,                  -- 9.975% of taxable revenue
  gst_qst_remittance NUMERIC,            -- Total sales tax to remit (0 if under $30K)
  net_revenue NUMERIC,                    -- After expenses
  federal_income_tax NUMERIC,
  provincial_income_tax NUMERIC,
  qpp_contribution NUMERIC,               -- ~12.8% for self-employed
  qpip_premium NUMERIC,
  total_deductions NUMERIC,
  monthly_take_home NUMERIC,              -- The key number
  effective_take_home_rate NUMERIC,       -- take_home / gross as percentage
  
  -- Claude-generated insights
  suggested_expenses JSONB,               -- Expenses they might be forgetting
  pricing_insight TEXT,                    -- Pricing guidance based on their business
  watch_out_flags JSONB,                  -- Risk flags and opportunities
  
  -- Quarterly installment estimate
  quarterly_installment NUMERIC,

  UNIQUE(profile_id)
);

ALTER TABLE financial_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own snapshot" ON financial_snapshots
  FOR ALL USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- ============================================================
-- TABLE: chat_messages
-- ============================================================
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),

  role TEXT NOT NULL,                     -- 'user' or 'assistant'
  content TEXT NOT NULL,
  sources TEXT[],
  context_type TEXT,
  session_id UUID DEFAULT gen_random_uuid()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own chat" ON chat_messages
  FOR ALL USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- ============================================================
-- TABLE: generated_documents (stretch)
-- ============================================================
CREATE TABLE generated_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),

  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  download_url TEXT,
  metadata JSONB
);

ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own documents" ON generated_documents
  FOR ALL USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- ============================================================
-- TABLE: response_cache
-- ============================================================
CREATE TABLE response_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  response_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT now() + interval '24 hours'
);

-- ============================================================
-- STORAGE
-- ============================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false);

CREATE POLICY "Users access own documents" ON storage.objects
  FOR ALL USING (
    bucket_id = 'documents' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_roadmap_profile ON roadmap_steps(profile_id);
CREATE INDEX idx_roadmap_order ON roadmap_steps(profile_id, step_order);
CREATE INDEX idx_funding_profile ON funding_matches(profile_id);
CREATE INDEX idx_funding_score ON funding_matches(profile_id, match_score DESC);
CREATE INDEX idx_chat_profile ON chat_messages(profile_id, created_at);
CREATE INDEX idx_snapshot_profile ON financial_snapshots(profile_id);
CREATE INDEX idx_cache_key ON response_cache(cache_key);
```

---

# 6. KNOWLEDGE BASE SCHEMA

Every JSON file follows a strict schema. This is what the team curates on Day 1.

## NEW FILE: `/data/financial_constants.json`

This powers the deterministic tax calculator. No AI needed — just math.

```json
{
  "year": 2026,
  "last_verified": "2026-03-31",
  
  "gst_rate": 0.05,
  "qst_rate": 0.09975,
  "gst_qst_registration_threshold": 30000,
  
  "qpp": {
    "rate_self_employed": 0.128,
    "max_pensionable_earnings": 71300,
    "basic_exemption": 3500,
    "note": "Self-employed pay both employee and employer shares"
  },
  
  "qpip": {
    "rate_self_employed": 0.00878,
    "max_insurable_earnings": 98000
  },

  "federal_tax_brackets_2026": [
    { "min": 0, "max": 57375, "rate": 0.15 },
    { "min": 57375, "max": 114750, "rate": 0.205 },
    { "min": 114750, "max": 158468, "rate": 0.26 },
    { "min": 158468, "max": 221708, "rate": 0.29 },
    { "min": 221708, "max": null, "rate": 0.33 }
  ],
  "federal_basic_personal_amount": 16129,

  "quebec_tax_brackets_2026": [
    { "min": 0, "max": 52455, "rate": 0.14 },
    { "min": 52455, "max": 104910, "rate": 0.19 },
    { "min": 104910, "max": 126590, "rate": 0.24 },
    { "min": 126590, "max": null, "rate": 0.2575 }
  ],
  "quebec_basic_personal_amount": 18056,
  
  "corporate_tax_rate_small_business": {
    "federal": 0.09,
    "quebec": 0.032,
    "combined": 0.122,
    "applies_to_first": 500000,
    "note": "Combined ~12.2% on first $500K of active business income (Quebec CCPC)"
  },

  "source_urls": {
    "federal_brackets": "https://www.canada.ca/en/revenue-agency/services/tax/individuals/frequently-asked-questions-individuals/canadian-income-tax-rates-individuals-current-previous-years.html",
    "quebec_brackets": "https://www.revenuquebec.ca/en/citizens/income-tax-return/completing-your-income-tax-return/how-to-complete-your-income-tax-return/line-by-line-help/",
    "qpp": "https://www.revenuquebec.ca/en/businesses/source-deductions-and-employer-contributions/calculating-source-deductions-and-employer-contributions/quebec-pension-plan-contributions/",
    "gst_qst": "https://www.revenuquebec.ca/en/businesses/consumption-taxes/gsthst-and-qst/"
  }
}
```

## Business structures, permits, registration, funding files

Same schema as v1 plan (see sections 3.1-3.4 in the individual plan documents). 
Key files and their purposes:

**Registration:**
- `req.json` — NEQ registration steps, fees ($41 in 2026), required documents
- `revenu_quebec.json` — Provincial tax registration, GST/QST setup
- `cra.json` — Federal Business Number (nice to have)

**Permits:**
- `mapaq.json` — Food business permits (Yara)
- `famille.json` — Home daycare permits (Fatima)
- `municipal_montreal.json` — Occupancy permits, zoning, signage
- `racj.json` — Liquor license (nice to have)
- `professional_orders.json` — Regulated professions (nice to have)

**Tax:**
- `gst_qst.json` — Thresholds, registration process, exemptions
- `qpp.json` — Self-employed contribution rates and rules
- `deductions.json` — Common deductible expenses by business type
- `installments.json` — Quarterly installment rules

**Funding (15+ programs with full eligibility rules and scoring weights):**
- `futurpreneur.json` — Up to $75K, ages 18-39
- `pme_mtl.json` — Young Business Fund ($15K+$5K), Innovation Fund, Social Economy
- `sta.json` — Soutien au travail autonome (income support during startup)
- `bdc.json` — BDC micro-loans
- `investissement_quebec.json` — Plan PME
- `fli.json` — Fonds locaux d'investissement
- `demographic_programs.json` — Black Entrepreneur, Women, Immigrant-specific programs
- `irap.json`, `canada_summer_jobs.json` — Nice to have

**Compliance:**
- `bill96.json` — French language obligations by business size
- `signage.json` — Signage rules (French-first)

### Knowledge Base Day 1 Checklist

Must have (blocks the demo):
- [ ] `business_structures.json`
- [ ] `financial_constants.json` ← NEW
- [ ] `registration/req.json`
- [ ] `registration/revenu_quebec.json`
- [ ] `permits/mapaq.json`
- [ ] `permits/municipal_montreal.json`
- [ ] `permits/famille.json`
- [ ] `tax/gst_qst.json`
- [ ] `tax/qpp.json`
- [ ] `tax/deductions.json`
- [ ] `funding/futurpreneur.json`
- [ ] `funding/pme_mtl.json`
- [ ] `funding/sta.json`
- [ ] `funding/bdc.json`
- [ ] `compliance/bill96.json`

---

# 7. API ROUTES SPECIFICATION

## Route 1: `POST /api/profile`

Takes raw intake answers → Claude synthesizes structured profile → stored in Supabase.

Input: `{ user_id, answers: { business_idea, location, borough, is_home_based, age, immigration_status, expected_monthly_revenue, has_partners, languages, preferred_language } }`

Server-side: Validate with Zod → Call Claude (profile synthesis prompt) → Validate response → Upsert profiles table → Return profile.

Claude's job: Classify business_type, infer industry_sector, suggest business_name, write business_description. NOT: give advice.

Output: Complete profile object with all fields.

## Route 2: `POST /api/roadmap`

Generates personalized, dependency-ordered legal roadmap.

Input: `{ profile_id }`

Server-side: Fetch profile → Check cache → Select relevant KB files via selector.ts → Call Claude (roadmap prompt + KB + profile) → Validate with Zod → Batch insert roadmap_steps → Cache → Return.

Output: `{ steps: [{ step_order, step_key, title, description, why_needed, estimated_cost, estimated_timeline, required_documents, government_url, source, depends_on }] }`

## Route 3: `POST /api/funding`

Deterministic scoring + optional Claude explanation.

Input: `{ profile_id, explain_program?: string }`

Server-side (scoring — no AI): Fetch profile → Load funding JSONs → Run scorer.ts → Filter score > 0 → Sort by score → Batch insert funding_matches → Return.

Server-side (explain — Claude): Find program JSON → Call Claude with profile + program → Return explanation.

Output: `{ matches: [{ program_key, program_name, type, amount, match_score, eligibility_details, application_url }], total_potential_funding }`

## Route 4: `POST /api/financial-snapshot` ← NEW

Hybrid: deterministic tax math + Claude for situation-specific insights.

Input: `{ profile_id, monthly_expenses?: number, expense_categories?: object, price_per_unit?: number, units_per_month?: number }`

Server-side:
1. Fetch profile (has expected_monthly_revenue, business_structure, business_type)
2. Update profile with any new financial inputs
3. Load `financial_constants.json`
4. Run `tax-calculator.ts`:
   - annual_revenue = monthly_revenue × 12
   - If annual_revenue > 30000: calculate GST/QST collected and remittable
   - net_revenue = annual_revenue - (monthly_expenses × 12)
   - federal_tax = calculateBrackets(net_revenue, federal_brackets, federal_personal_amount)
   - provincial_tax = calculateBrackets(net_revenue, quebec_brackets, quebec_personal_amount)
   - qpp = min(net_revenue - 3500, 71300 - 3500) × 0.128
   - qpip = min(net_revenue, 98000) × 0.00878
   - total_deductions = federal_tax + provincial_tax + qpp + qpip
   - annual_take_home = net_revenue - total_deductions
   - monthly_take_home = annual_take_home / 12
   - effective_rate = monthly_take_home / monthly_revenue
5. Call Claude (financial insight prompt):
   - "Given this user's business type and expenses, suggest 3-5 expense categories 
     they might be forgetting. Estimate a reasonable price range for their product/service. 
     Flag any financial risks or opportunities."
6. Validate Claude response with Zod
7. Upsert into financial_snapshots table
8. Cache the response
9. Return full snapshot

Output:
```json
{
  "snapshot": {
    "gross_monthly_revenue": 1000,
    "monthly_expenses": 380,
    "annual_revenue": 12000,
    "gst_qst_remittance": 0,
    "gst_qst_status": "Not required (under $30,000 threshold)",
    "net_revenue_annual": 7440,
    "federal_income_tax": 0,
    "provincial_income_tax": 0,
    "qpp_contribution": 504,
    "qpip_premium": 65,
    "total_annual_deductions": 569,
    "monthly_take_home": 573,
    "effective_take_home_rate": 0.573,
    "quarterly_installment": 142,
    
    "insights": {
      "suggested_expenses": [
        { "category": "Home kitchen utilities (prorated)", "estimated_monthly": 40 },
        { "category": "Packaging and labels", "estimated_monthly": 30 },
        { "category": "Food handler certification renewal", "estimated_monthly": 3 },
        { "category": "Cleaning supplies", "estimated_monthly": 15 },
        { "category": "Delivery/transport costs", "estimated_monthly": 25 }
      ],
      "pricing_insight": "Home bakeries in Montreal typically charge $14-20 per portion for artisan pastries. At your current cost of ~$9.50 per portion, a price of $15-17 would give you a 37-44% margin, which is healthy for a home food business.",
      "watch_out_flags": [
        {
          "type": "info",
          "title": "You're under the QST threshold",
          "detail": "At $12,000/year, you don't need to register for GST/QST yet. But if you grow past $30,000, you'll need to register within 29 days."
        },
        {
          "type": "warning",
          "title": "QPP double contribution",
          "detail": "As a self-employed person, you pay both the employee and employer share of QPP — that's ~$504/year at your income level. This surprises most people."
        },
        {
          "type": "tip",
          "title": "Track your home expenses",
          "detail": "You can deduct a proportional share of your rent, electricity, internet, and home insurance as business expenses. Calculate based on the % of your home used for business."
        }
      ]
    }
  }
}
```

Zod schema:
```typescript
const FinancialInsightSchema = z.object({
  suggested_expenses: z.array(z.object({
    category: z.string(),
    estimated_monthly: z.number()
  })).min(2).max(6),
  pricing_insight: z.string(),
  watch_out_flags: z.array(z.object({
    type: z.enum(['info', 'warning', 'tip']),
    title: z.string(),
    detail: z.string()
  })).min(1).max(5)
});
```

## Route 5: `POST /api/assistant`

Contextual AI assistant. Now also includes financial snapshot in context.

Input: `{ profile_id, message, context?: string }`

Server-side: Fetch profile → Fetch roadmap steps → Fetch funding matches → Fetch financial snapshot → Fetch last 10 messages → Select KB → Call Claude (assistant prompt) → Store messages → Return.

Output: `{ message, sources, suggested_actions }`

## Route 6: `POST /api/documents` (stretch)

Generate personalized .docx files.

Input: `{ profile_id, document_type, language }`

Server-side: Fetch profile → Load template → Claude fills personalized fields → docx package generates file → Upload to Supabase Storage → Return signed download URL.

---

# 8. SYSTEM PROMPTS

## Prompt 1: Profile Synthesis
```
SYSTEM:
You are a business classification engine for a Quebec micro-business startup tool.
Your ONLY job is to take a user's intake answers and produce a structured business profile.

Rules:
- Classify into exactly ONE type: food, freelance, daycare, retail, personal_care, other
- Infer the industry_sector (e.g., "bakery", "software_consulting", "home_daycare")
- If no business name provided, suggest one based on their description
- Write a one-sentence business_description that is specific and factual
- Do NOT give legal advice, recommendations, or next steps
- Respond ONLY with valid JSON — no preamble, no markdown

Schema:
{
  "business_type": "food" | "freelance" | "daycare" | "retail" | "personal_care" | "other",
  "industry_sector": string,
  "business_name": string | null,
  "business_description": string
}

USER:
Here are the intake answers:
{{INTAKE_ANSWERS_JSON}}
```

## Prompt 2: Roadmap Generation
```
SYSTEM:
You are a regulatory guide for starting a micro-business in Quebec. Generate a 
personalized, ORDERED checklist of legal and administrative steps for this specific person.

Your knowledge base (ONLY source of truth — do not add anything not in this data):
{{SELECTED_KNOWLEDGE_BASE_JSON}}

Rules:
1. SEQUENCE by dependency. Can't get MAPAQ permit before NEQ. Can't register QST before business number.
2. PERSONALIZE every step. Not "register your business" — "Register 'Amina's Kitchen' as a sole proprietorship with the REQ in Villeray."
3. INCLUDE ONLY RELEVANT STEPS. Freelancer doesn't need MAPAQ. Bakery doesn't need professional order.
4. Each step must have: step_order, step_key, title, description, why_needed, estimated_cost, estimated_timeline, required_documents, government_url, source, depends_on.
5. NEVER invent fees, URLs, or requirements not in the knowledge base.
6. NEVER give legal advice. Present facts.
7. Aim for 5-12 steps.
8. Respond ONLY with valid JSON: { "steps": [...] }

USER:
Generate a legal roadmap for:
{{PROFILE_JSON}}
```

## Prompt 3: Financial Insights ← NEW
```
SYSTEM:
You are a financial awareness tool for new micro-business owners in Quebec. Given a user's 
business profile and their financial numbers, provide practical insights. You are NOT a 
financial advisor — you help people understand their numbers.

The user's tax calculations have already been done by a deterministic engine. Your job is 
to provide three things:

1. SUGGESTED EXPENSES: Based on their business type and setup, suggest 3-5 expense 
   categories they might be forgetting to account for. Be specific to their business 
   (a home baker has different expenses than a freelance coder). Include estimated 
   monthly amounts for Montreal.

2. PRICING INSIGHT: Based on their business type, location, and costs, provide 1-2 
   sentences about typical pricing in their market. Reference their cost per unit if 
   available. Never tell them what to charge — inform them about the range.

3. WATCH OUT FLAGS: 1-3 financial risks or opportunities specific to their situation. 
   Examples: approaching QST threshold, QPP double contribution surprise, deductible 
   expenses they should track, quarterly installment requirements.

Rules:
- Be specific to their business type and location, not generic
- Never say "you should" — say "you could" or "many [business type] owners..."
- Keep each item to 1-2 sentences
- Respond in their preferred language
- Respond ONLY with valid JSON matching the schema

USER:
Business profile: {{PROFILE_JSON}}
Calculated numbers: {{TAX_CALCULATIONS_JSON}}
```

## Prompt 4: Contextual Assistant
```
SYSTEM:
You are a helpful assistant in a Quebec micro-business startup tool.

Who you are talking to: {{PROFILE_JSON}}
Their roadmap progress: {{ROADMAP_STEPS_WITH_STATUS_JSON}}
Their funding matches: {{FUNDING_MATCHES_JSON}}
Their financial snapshot: {{FINANCIAL_SNAPSHOT_JSON}}
Knowledge base: {{SELECTED_KNOWLEDGE_BASE_JSON}}
Previous conversation: {{LAST_10_MESSAGES_JSON}}

Rules:
1. Answer based on THEIR SPECIFIC SITUATION with real numbers from their profile.
2. ALWAYS CITE your source from the knowledge base.
3. STAY IN YOUR LANE. Refer to professionals when out of scope:
   - Free business advice: YES Montréal, Info entrepreneurs (1-888-576-4444)
   - Free legal info: Éducaloi (educaloi.qc.ca)
   - Accounting: suggest a CPA or community tax clinic
   - PME MTL advisors: pmemtl.com
4. USE THEIR LANGUAGE. Match the language they write in.
5. BE CONCISE. 2-4 sentences per answer.
6. NEVER FABRICATE. If not in the KB, say so and give a referral.
7. Respond as JSON: { "message": "...", "sources": [...], "suggested_actions": [...] }
```

## Knowledge Base Selector (TypeScript, not a prompt)
```typescript
const KB_MAP: Record<BusinessType, string[]> = {
  food: ['req.json', 'revenu_quebec.json', 'mapaq.json', 'municipal_montreal.json', 'gst_qst.json', 'qpp.json', 'deductions.json', 'bill96.json', 'business_structures.json', 'financial_constants.json'],
  freelance: ['req.json', 'revenu_quebec.json', 'gst_qst.json', 'qpp.json', 'deductions.json', 'installments.json', 'bill96.json', 'business_structures.json', 'financial_constants.json'],
  daycare: ['req.json', 'revenu_quebec.json', 'famille.json', 'municipal_montreal.json', 'gst_qst.json', 'qpp.json', 'bill96.json', 'business_structures.json', 'financial_constants.json'],
  retail: ['req.json', 'revenu_quebec.json', 'municipal_montreal.json', 'gst_qst.json', 'qpp.json', 'deductions.json', 'bill96.json', 'signage.json', 'business_structures.json', 'financial_constants.json'],
  personal_care: ['req.json', 'revenu_quebec.json', 'municipal_montreal.json', 'gst_qst.json', 'qpp.json', 'bill96.json', 'business_structures.json', 'financial_constants.json'],
  other: ['req.json', 'revenu_quebec.json', 'gst_qst.json', 'qpp.json', 'deductions.json', 'bill96.json', 'business_structures.json', 'financial_constants.json'],
};
// Funding files always loaded for scoring
```

---

# 9. UI SCREENS SPECIFICATION

## Design System
- Primary: Teal (#0D9488 / teal-600)
- Accent: Amber (#F59E0B) for CTAs and highlights
- Background: Slate-50 (#F8FAFC)
- Cards: White, subtle shadow, rounded-xl
- Text: Slate-900 headings, Slate-600 body
- Font: System font stack
- Tone: Clean, professional, approachable

## Navigation (Sidebar)
- Logo + app name
- Dashboard (home icon)
- Legal Roadmap (checklist icon)
- Funding (dollar icon)
- Starter Kit (document icon) — greyed out if not built
- AI Assistant (chat icon)
- Language toggle (FR/EN) at bottom
- User avatar + logout at bottom
- Completion badges: green checkmark on completed sections

## Screen 1: Landing Page (`/`)
Hero: "Start your business in Québec. All the steps. One place."
Three persona cards (Yara, Marcus, Fatima). CTA: "Get Started — Free"
No sidebar. Full-width.

## Screen 2: Login (`/login`)
Email input → "Send Magic Link" → "Check your email" confirmation.

## Screen 3: Intake (`/intake`)
8 questions, one per screen, centered card, progress bar.
1. "What kind of business?" (free text)
2. "Where in Québec?" (dropdown + borough)
3. "Home-based or separate location?" (cards)
4. "How old are you?" (number)
5. "Residency status?" (cards)
6. "Expected monthly revenue?" (slider/cards)
7. "Partners or employees?" (cards)
8. "Languages you speak?" (multi-select + preferred language)
Submit → POST /api/profile → redirect to dashboard.

## Screen 4: Dashboard (`/dashboard`) — UPDATED

**Top row — Profile Summary Card:**
Business name, type badge, location, structure. "Edit Profile" button.

**Second row — Financial Snapshot Card:** ← NEW
This is now a prominent card on the dashboard.

If no snapshot yet: 
- "See what you actually take home"
- Simple form: "Monthly expenses" input + optional "Price per unit" + "Units/month"
- "Calculate" button → POST /api/financial-snapshot

If snapshot exists:
- Three-column summary:
  - Gross Revenue: $1,000/mo
  - Taxes & Contributions: -$47/mo  
  - Take-Home: **$573/mo** (large, teal, emphasized)
- Effective rate badge: "57.3% take-home rate"
- "View breakdown →" expands into full detail:
  - Visual waterfall/funnel: Revenue → GST/QST → Expenses → Taxes → QPP → QPIP → Take-Home
  - Suggested expenses section (from Claude): "You might be forgetting..."
  - Watch out flags as colored badges (info=blue, warning=amber, tip=green)
  - Pricing insight text
- "Recalculate" button to update inputs

**Third row — Three feature cards:**
Card 1: Legal Roadmap (progress bar, next step)
Card 2: Funding ("6 matches · $95K+ available")
Card 3: Starter Kit ("Generate your first documents")

**Bottom — AI Assistant teaser**

## Screen 5: Legal Roadmap (`/roadmap`)
Progress bar at top. Ordered, expandable step cards. Each has: title, status badge, 
cost badge, expanded view with full details + documents + government link. Mark 
complete/in progress. Dependency lock icons. "Ask AI about this step" button.

## Screen 6: Funding Matcher (`/funding`)
"Total available: $95,000+" header. Sort/filter. Ranked cards with match score, 
amount, type, eligibility breakdown. "Learn more" triggers Claude explanation. 
"Apply →" links to application URL. Bookmark/dismiss.

## Screen 7: AI Assistant (`/assistant`)
Full chat interface. Knows profile, roadmap, funding, financial snapshot, conversation 
history. Source citations. Suggested actions as chips. Pre-loaded question suggestions. 
Typing indicator.

## Screen 8: Starter Kit (`/starter-kit`) — STRETCH
Three document types: bilingual contract, invoice template, business pitch. 
Generate → preview → download .docx.

## Demo Flow (5 minutes)
```
0:00-0:30  Problem (show quebec.ca screenshot, count the clicks)
0:30-1:00  "Meet Yara" (persona + pain)
1:00-1:30  Dashboard tour — Financial Snapshot: "$573/mo take-home" ← NEW DEMO MOMENT
1:30-2:30  Legal Roadmap: show 9 personalized steps, expand 2-3
2:30-3:15  Funding: "$95K+ available", show Futurpreneur breakdown
3:15-3:45  AI Assistant: "Do I need QST?" → specific answer
3:45-4:15  Ethical reflection (3 questions answered)
4:15-4:45  Technical architecture (one slide)
4:45-5:00  Impact potential
```

---

# 10. FEATURE LOGIC — IMPLEMENTATION DETAILS

## Feature 1: Intake
State machine: IDLE → Q1 → Q2 → ... → Q8 → SUBMITTING → COMPLETE.
One question per screen. Answers mapped to raw profile. POST /api/profile on submit.
Claude classifies business_type + industry_sector. Redirect to dashboard on success.

## Feature 2: Legal Roadmap
Fetch profile → check cache → select KB slice → call Claude → validate Zod → store steps 
→ render. Step completion tracked in Supabase. Dependency enforcement via depends_on 
field. Lock icon on blocked steps.

Expected output per persona:
- Yara (bakery): 9 steps (structure → NEQ → zoning → MAPAQ cert → MAPAQ permit → occupancy → GST/QST → bank → Bill 96)
- Marcus (freelance): 8 steps (registration check → NEQ → tax setup → GST/QST → QPP → deductions → bank → Bill 96)
- Fatima (daycare): 10 steps (structure → NEQ → Ministère contact → training → background check → premises → permit → occupancy → GST/QST → STA)

## Feature 3: Funding Matcher
Deterministic scorer: for each program, evaluate eligibility rules against profile. 
Hard requirements (age, citizenship) → score 0 if failed. Soft requirements → reduces 
score. Sort by score descending. Claude only for "explain" button.

Expected output:
- Yara (26, PR, food): Futurpreneur 94, PME MTL Young 88, STA 71 → ~$95K
- Marcus (23, citizen, freelance): Futurpreneur 92, PME MTL 85, BDC 70 → ~$90K
- Fatima (41, citizen, daycare): PME MTL 82, STA 88, BDC 75 → ~$45K (no Futurpreneur, age>39)

## Feature 4: Financial Snapshot ← NEW

### Tax Calculator (`tax-calculator.ts`) — Pure TypeScript, no AI

```typescript
import { financialConstants } from './constants';

interface TaxInput {
  annualRevenue: number;
  annualExpenses: number;
  businessStructure: 'sole_proprietorship' | 'corporation';
}

interface TaxOutput {
  grossAnnualRevenue: number;
  gstCollected: number;
  qstCollected: number;
  gstQstRemittance: number;
  mustRegisterGstQst: boolean;
  netRevenue: number;
  federalTax: number;
  provincialTax: number;
  qppContribution: number;
  qpipPremium: number;
  totalDeductions: number;
  annualTakeHome: number;
  monthlyTakeHome: number;
  effectiveRate: number;
  quarterlyInstallment: number;
}

function calculateBrackets(income: number, brackets: Bracket[], personalAmount: number): number {
  const taxableIncome = Math.max(0, income - personalAmount);
  let tax = 0;
  let remaining = taxableIncome;
  
  for (const bracket of brackets) {
    const bracketSize = bracket.max ? bracket.max - bracket.min : Infinity;
    const taxableInBracket = Math.min(remaining, bracketSize);
    tax += taxableInBracket * bracket.rate;
    remaining -= taxableInBracket;
    if (remaining <= 0) break;
  }
  
  return Math.round(tax * 100) / 100;
}

function calculateTaxes(input: TaxInput): TaxOutput {
  const c = financialConstants;
  const { annualRevenue, annualExpenses, businessStructure } = input;
  
  // GST/QST
  const mustRegister = annualRevenue > c.gst_qst_registration_threshold;
  const gstCollected = mustRegister ? annualRevenue * c.gst_rate : 0;
  const qstCollected = mustRegister ? annualRevenue * c.qst_rate : 0;
  const gstQstRemittance = gstCollected + qstCollected;
  
  // Net revenue (GST/QST is pass-through, not income)
  const netRevenue = annualRevenue - annualExpenses;
  
  if (businessStructure === 'sole_proprietorship') {
    // Personal income tax on net business income
    const federalTax = calculateBrackets(netRevenue, c.federal_tax_brackets_2026, c.federal_basic_personal_amount);
    const provincialTax = calculateBrackets(netRevenue, c.quebec_tax_brackets_2026, c.quebec_basic_personal_amount);
    
    // QPP (self-employed pays both shares)
    const qppPensionable = Math.min(Math.max(netRevenue - c.qpp.basic_exemption, 0), c.qpp.max_pensionable_earnings - c.qpp.basic_exemption);
    const qppContribution = qppPensionable * c.qpp.rate_self_employed;
    
    // QPIP
    const qpipInsurable = Math.min(netRevenue, c.qpip.max_insurable_earnings);
    const qpipPremium = qpipInsurable * c.qpip.rate_self_employed;
    
    const totalDeductions = federalTax + provincialTax + qppContribution + qpipPremium;
    const annualTakeHome = netRevenue - totalDeductions;
    
    return {
      grossAnnualRevenue: annualRevenue,
      gstCollected,
      qstCollected,
      gstQstRemittance,
      mustRegisterGstQst: mustRegister,
      netRevenue,
      federalTax: Math.round(federalTax),
      provincialTax: Math.round(provincialTax),
      qppContribution: Math.round(qppContribution),
      qpipPremium: Math.round(qpipPremium),
      totalDeductions: Math.round(totalDeductions),
      annualTakeHome: Math.round(annualTakeHome),
      monthlyTakeHome: Math.round(annualTakeHome / 12),
      effectiveRate: annualRevenue > 0 ? Math.round((annualTakeHome / annualRevenue) * 1000) / 10 : 0,
      quarterlyInstallment: Math.round(totalDeductions / 4),
    };
  }
  
  // Corporation path (simplified — show combined rate)
  const corpTax = Math.min(netRevenue, c.corporate_tax_rate_small_business.applies_to_first) * c.corporate_tax_rate_small_business.combined;
  // ... simplified version, note: money still in corporation, not personal
  // For hackathon, focus on sole proprietorship path
}
```

### Key UX for Financial Snapshot

**Expense input form** (2-3 fields, minimal friction):
- "Estimated monthly business expenses" — one number input, with helper text: 
  "Include supplies, tools, subscriptions, transport. Don't worry about being exact — 
  we'll suggest things you might be missing."
- Optional: "What do you charge per product/service?" + "How many per month?"
- "Calculate My Take-Home" button

**The take-home reveal** — this is a demo moment:
- Big number, teal color: **$573/mo**
- Below it: "That's a 57.3% take-home rate"
- Visual breakdown bar: Revenue | Expenses | Taxes | QPP | QPIP | Take-Home
- Each segment is colored and labeled with the dollar amount

**Suggested expenses** (from Claude):
- Listed as a checklist with estimated amounts
- "Add to my expenses" button next to each → recalculates instantly
- This is where Claude adds value without hardcoding per industry

**Watch out flags** (from Claude):
- Colored badges: blue (info), amber (warning), green (tip)
- Expandable for detail

## Feature 5: AI Assistant
Context includes ALL user data: profile + roadmap + funding + financial snapshot + 
last 10 messages + KB. Token budget ~8,000-10,000 tokens input, well within limits.
Pre-loaded questions adapt to user state.

## Feature 6: Starter Kit (stretch)
Template-based .docx generation. Hardcoded legal clauses. Claude fills personalized 
fields. Upload to Supabase Storage, return signed URL.

## Feature 7: Pricing Engine (lowest priority)
Pure math calculator. Cut this first if behind schedule.

---

# 11. BUILD ASSIGNMENTS — REVISED POST-TEAMMATE CONTRIBUTIONS

## Status as of April 1, 2026 (Evening)

### What's done

**Person B (Joseph Rassi) — COMPLETE ✅**
- All 25 KB JSON files in `/data/` — structured, URL-verified, 2026 data
- `src/lib/knowledge-base/loader.ts` — production-ready singleton loader
- `src/lib/knowledge-base/selector.ts` — context-aware KB selector by business type
- `src/lib/knowledge-base/prompts.ts` — all 4 Claude system prompts as typed builder functions
- `scripts/check_links.py` — URL validation utility

**Person C (Rami Nawam) — BACKEND COMPLETE, Claude wiring pending 🔄**
- `src/types/` (5 files) — complete, snake_case, mirrors Supabase schema
- `src/repositories/` (6 files) — complete Supabase CRUD layer
- `src/services/` (6 files) — architecture in place, `// TODO` comments where Claude calls go
- `src/lib/supabase/` — browser + server clients, middleware helper
- `src/lib/claude/client.ts`, `prompts.ts`, `schemas.ts` — SDK wrapper, generic stubs (real prompts are in `src/lib/knowledge-base/prompts.ts`)
- `src/lib/funding/scorer.ts` — deterministic scoring logic
- `src/lib/financial/tax-calculator.ts` + `constants.ts` — complete 2026 tax math
- `src/app/api/` (7 routes) — all routes implemented
- `src/middleware.ts` — auth session middleware
- `src/app/(auth)/login/page.tsx` — full auth UI with email magic link
- Component type migration — all components updated to use new snake_case types
- `src/components/intake/question-card.tsx` — intake wizard questions rewritten

**Person A (Pierre) — scaffold complete, pages need wiring**
- Project scaffold, all directories, `tailwind.config.ts` (⚠️ still blue — needs teal fix)
- `src/components/` — most components complete (sidebar, layout, roadmap, financial, assistant, intake, starter-kit)
- `src/stores/` — all 3 Zustand stores complete
- `src/app/(app)/layout.tsx` — app shell complete
- `src/app/page.tsx` — landing page (needs hero polish)

---

## Remaining Work by Person

### Person A — Frontend + Infrastructure (YOU)

**Config (do first):**
- [ ] Fix `tailwind.config.ts` — blue → teal (#0D9488 primary, #F59E0B accent)
- [ ] Fix `src/app/globals.css` — CSS vars, body bg-slate-50
- [ ] Set up Supabase project + fill `.env.local`
- [ ] Run `supabase/migrations/001_initial_schema.sql`
- [ ] Add `http://localhost:3000/auth/callback` to Supabase redirect URLs

**Page wiring (wire stubs to existing components):**
- [ ] `src/app/(app)/intake/page.tsx` — render `<IntakeWizard />`
- [ ] `src/app/(app)/dashboard/page.tsx` — wire profile store on mount, real stat cards
- [ ] `src/app/(app)/roadmap/page.tsx` — render `<RoadmapList />`
- [ ] `src/app/(app)/funding/page.tsx` — render `<FundingList />`
- [ ] `src/app/(app)/assistant/page.tsx` — render `<ChatPanel />`

**Component completion:**
- [ ] `src/components/ui/language-toggle.tsx` — FR/EN toggle
- [ ] `src/components/funding/funding-detail.tsx` — eligibility detail view

**Polish:**
- [ ] Landing page hero — 3 persona cards, compelling copy, CTA
- [ ] Loading skeletons on data-dependent pages
- [ ] Empty states (no roadmap yet, no funding matches yet)
- [ ] Error states
- [ ] Financial Snapshot waterfall/bar chart visual
- [ ] `src/lib/i18n/en.json` + `fr.json` — all static UI strings

**Deployment + Demo:**
- [ ] Vercel: connect repo, set env vars, add production URL to Supabase redirect URLs
- [ ] Seed Yara demo account (profile + roadmap + funding + snapshot + chat pre-cached)

---

### Person C (Rami) — Current Status (Updated Apr 2, 2026)

**Implemented now (backend + integration):**
- [x] Financial questionnaire persistence migration: `supabase/migrations/002_financial_questionnaire.sql`
- [x] Profile/type support for questionnaire answers + completion state (`src/types/profile.ts`, `src/types/financial.ts`)
- [x] API support for questionnaire payloads in `POST/PUT /api/financial-snapshot`
- [x] Cluster-driven financial computation path in `financial.service.ts` (C1-C9 question set -> normalized outputs -> deterministic tax math)
- [x] Profile persistence of inferred financial fields (expected revenue, expenses, category map, unit economics when derivable)
- [x] Frontend financial page flow updated to questionnaire-first, with organized Layout A sections
- [x] Business type label fix for fallback cluster (`C9: General Micro-Business`)

**Still remaining (Rami):**
- [ ] Final Claude prompt wiring cleanup across services (`profile.service.ts`, `roadmap.service.ts`, `assistant.service.ts`, `cache.service.ts`)
- [ ] End-to-end validation on all 3 personas (Yara, Marcus, Fatima) with saved questionnaire answers
- [ ] Apply migration `002_financial_questionnaire.sql` in shared/prod Supabase project

---

## File Ownership Reference

| Path | Owner |
|------|-------|
| `tailwind.config.ts`, `globals.css` | Person A |
| `src/app/(app)/` — all page files | Person A |
| `src/app/page.tsx` — landing page | Person A |
| `src/components/` — all UI components | Person A |
| `src/stores/` — Zustand stores | Person A |
| Vercel deployment | Person A |
| `data/` | Person B ✅ |
| `src/lib/knowledge-base/` | Person B ✅ |
| `scripts/` | Person B ✅ |
| `src/app/api/` | Person C ✅ |
| `src/repositories/` | Person C ✅ |
| `src/services/` | Person C 🔄 |
| `src/lib/supabase/` | Person C ✅ |
| `src/lib/claude/` | Person C ✅ |
| `src/lib/funding/`, `src/lib/financial/` | Person C ✅ |
| `src/types/` | Person C ✅ |
| `src/middleware.ts` | Person C ✅ |

---

## Demo Readiness Checklist

- [ ] Yara demo account loads instantly (all data pre-cached, no Claude API call on demo day)
- [ ] Financial Snapshot shows "$573/mo take-home" for Yara
- [ ] Funding shows "$95,000+ available" for Yara
- [ ] Roadmap shows 9 personalized steps for Yara's bakery
- [ ] AI assistant answers contextually about Yara's situation
- [ ] Language toggle switches UI between FR/EN
- [ ] App deployed on Vercel with production URL
- [ ] Localhost fallback verified (`npm run dev`)
- [ ] Cached responses verified (Claude API down → demo still works)

---

## DAY 4 — Saturday April 4 (Hackathon Day)

| Time | Task |
|------|------|
| 10:00 | Check-in at Trottier. Set up, connect WiFi, verify deployment. |
| 10:30 | Opening ceremony. |
| 11:00-12:30 | Final polish + bug fixes. |
| 12:30 | Lunch |
| 1:00-3:00 | Final testing + rehearsal × 2 on presentation laptop |
| 3:00-4:00 | Buffer. Fix nothing unless critical. |
| 4:00 | **SUBMISSION DEADLINE** |
| 4:15 | Demo presentations (5 min + 2 min Q&A) |
| 5:45 | Awards |

## Prepared Q&A

| Question | Answer |
|----------|--------|
| "What if the knowledge base is outdated?" | Every entry is date-stamped and links to the official source. Users can always verify. The architecture supports updates by editing JSON files — no code changes needed. |
| "How do you prevent Claude from hallucinating?" | Three layers: Claude is constrained to our curated KB (can't invent requirements), Zod validates every response against a strict schema before storage, and all tax math is deterministic TypeScript — not AI. |
| "Are the financial calculations accurate?" | The tax calculator uses official 2026 rates from CRA and Revenu Québec. We clearly state this is an estimate, not professional tax advice, and recommend consulting a CPA for their specific situation. |
| "Could this scale beyond Quebec?" | The architecture is modular — the KB is swappable. Same pipeline works for Ontario, BC, or any jurisdiction. The tax calculator loads constants from a JSON file per jurisdiction. |
| "What's the business model?" | Free for individuals. Premium tier for accountants, business advisors, and government agencies who want to embed this in their services. |

## Emergency Protocols

- **Claude API down:** Serve from response_cache. Demo works without live API.
- **Vercel down:** Run locally: `npm run dev`. Present from localhost.
- **Feature broken during demo:** Skip it. "We also built X, let me show you Y."
- **Over time:** Cut architecture slide. Demo speaks louder.
- **Judge asks about unbuilt feature:** "That's on our roadmap. Here's how we'd implement it."

---

# END OF PLAN
