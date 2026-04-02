# Roadmap Backend Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the stubbed `RoadmapService.generate()` to call Claude with the real KB and profile, validate with Zod, and write to Supabase — making POST /api/roadmap fully functional end-to-end.

**Architecture:** Profile is fetched from Supabase → relevant KB files selected via `selector.ts` → Claude called with `buildRoadmapPrompt` from `knowledge-base/prompts.ts` → response parsed and validated with a corrected Zod schema → steps batch-upserted to `roadmap_steps` and cached. GET/PATCH already work; DELETE is added. One store bug is fixed.

**Tech Stack:** Next.js 15 App Router, Anthropic SDK (`askClaude`), Zod v3, Supabase, Zustand

---

## What already exists (do not rebuild)

| File | Status |
|------|--------|
| `src/app/api/roadmap/route.ts` | GET + POST + PATCH complete — add DELETE only |
| `src/repositories/roadmap.repository.ts` | Complete — do not touch |
| `src/repositories/profile.repository.ts` | Complete — do not touch |
| `src/repositories/cache.repository.ts` | Complete — do not touch |
| `src/lib/claude/client.ts` | `askClaude()` complete — do not touch |
| `src/lib/knowledge-base/loader.ts` | Complete — `loadKnowledgeBase`, `serializeForPrompt` |
| `src/lib/knowledge-base/selector.ts` | Complete — `selectForPrompt`, `contextFromProfile` |
| `src/lib/knowledge-base/prompts.ts` | Complete — `buildRoadmapPrompt(profile, kbJson)` |
| `src/types/roadmap.ts` | Complete — `ClaudeRoadmapStep`, `CreateRoadmapStepDTO` |
| `src/types/profile.ts` | Complete — `Profile` |

## Files to modify

| File | What changes |
|------|-------------|
| `src/lib/claude/schemas.ts` | Replace wrong `RoadmapStepSchema` with correct `ClaudeRoadmapStepSchema`; add `parseClaudeJSON()` |
| `src/services/roadmap.service.ts` | Replace TODO stubs with real Claude call; add `clear()` method |
| `src/app/api/roadmap/route.ts` | Add DELETE handler |
| `src/stores/roadmap-store.ts` | Fix `profileId` → `profile_id` bug |

---

## Key type relationships

```
Profile (types/profile.ts)
  ↓ contextFromProfile()          — selector.ts
SelectionContext
  ↓ selectForPrompt(kb, context)  — selector.ts
KBDocument[]
  ↓ serializeForPrompt(docs)      — loader.ts
string (kbJson)

Profile (types/profile.ts)
  ↓ toPromptProfile(p)            — NEW private helper in service
UserProfile (knowledge-base/prompts.ts)
  ↓ buildRoadmapPrompt(profile, kbJson)
string (systemPrompt)

Claude response string
  ↓ parseClaudeJSON(text)         — schemas.ts
unknown
  ↓ ClaudeRoadmapResponseSchema.parse()
ClaudeRoadmapStep[]
  ↓ map to CreateRoadmapStepDTO
  ↓ RoadmapRepository.batchUpsert()
RoadmapStep[]
```

---

### Task 1: Fix `schemas.ts` — correct schema + `parseClaudeJSON`

**Files:**
- Modify: `src/lib/claude/schemas.ts`

The current `RoadmapStepSchema` has fields `title_en/fr`, `description_en/fr` etc. which don't match what Claude will return. It must match `ClaudeRoadmapStep` from `src/types/roadmap.ts`.

- [ ] **Step 1: Replace the contents of `src/lib/claude/schemas.ts`**

```typescript
import { z } from 'zod';

// ---------------------------------------------------------------------------
// ClaudeRoadmapStep schema — must match ClaudeRoadmapStep in types/roadmap.ts
// ---------------------------------------------------------------------------

export const ClaudeRoadmapStepSchema = z.object({
  step_order: z.number().int().min(1),
  step_key: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  why_needed: z.string(),
  estimated_cost: z.string(),
  estimated_timeline: z.string(),
  required_documents: z.array(z.string()),
  government_url: z.string().url(),
  source: z.string(),
  depends_on: z.array(z.string()),
});

export const ClaudeRoadmapResponseSchema = z.array(ClaudeRoadmapStepSchema);

export type ClaudeRoadmapStepParsed = z.infer<typeof ClaudeRoadmapStepSchema>;

// ---------------------------------------------------------------------------
// Funding / financial schemas (unchanged)
// ---------------------------------------------------------------------------

export const FundingMatchSchema = z.object({
  program_id: z.string(),
  score: z.number().min(0).max(100),
  rationale_en: z.string(),
  rationale_fr: z.string(),
  recommended: z.boolean(),
});

export const FundingResponseSchema = z.array(FundingMatchSchema);

export const FinancialSnapshotSchema = z.object({
  grossRevenue: z.number(),
  expenses: z.number(),
  netIncome: z.number(),
  federalTax: z.number(),
  provincialTax: z.number(),
  qpp: z.number(),
  qpip: z.number(),
  estimatedTakeHome: z.number(),
  effectiveTaxRate: z.number(),
  watchOutFlags: z.array(z.string()).optional(),
});

export type FundingMatch = z.infer<typeof FundingMatchSchema>;
export type FinancialSnapshot = z.infer<typeof FinancialSnapshotSchema>;

// ---------------------------------------------------------------------------
// parseClaudeJSON — strips markdown fences, then JSON.parses
// Claude often wraps its JSON output in ```json ... ``` fences.
// ---------------------------------------------------------------------------

export function parseClaudeJSON(text: string): unknown {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();
  return JSON.parse(cleaned);
}
```

- [ ] **Step 2: Type-check to confirm no breakage**

```bash
cd /Users/josephrassi/BZNS && npx tsc --noEmit 2>&1 | head -40
```

Expected: errors only in `roadmap.service.ts` (it still references the old `RoadmapSchema`). Zero errors in `schemas.ts` itself.

- [ ] **Step 3: Commit**

```bash
cd /Users/josephrassi/BZNS
git add src/lib/claude/schemas.ts
git commit -m "fix(schemas): replace RoadmapStepSchema with ClaudeRoadmapStepSchema matching ClaudeRoadmapStep type; add parseClaudeJSON"
```

---

### Task 2: Add `toPromptProfile` helper + wire imports in `roadmap.service.ts`

**Files:**
- Modify: `src/services/roadmap.service.ts`

`buildRoadmapPrompt` (in `knowledge-base/prompts.ts`) expects a `UserProfile` shape. The DB `Profile` type has different field names (`expected_monthly_revenue` not `expected_revenue_cad`, no `serves_alcohol` flag, no `stage`, etc.). This private helper maps between them.

- [ ] **Step 1: Replace the top of `src/services/roadmap.service.ts`** (lines 1–14, the imports + TODO comments)

```typescript
// ============================================================
// ROADMAP SERVICE — business logic for legal roadmap generation
// Orchestrates: fetch profile → select KB → call Claude → validate → save
// ============================================================

import { ProfileRepository } from '@/repositories/profile.repository'
import { RoadmapRepository } from '@/repositories/roadmap.repository'
import { CacheRepository } from '@/repositories/cache.repository'
import { loadKnowledgeBase, serializeForPrompt } from '@/lib/knowledge-base/loader'
import { selectForPrompt, contextFromProfile } from '@/lib/knowledge-base/selector'
import { buildRoadmapPrompt } from '@/lib/knowledge-base/prompts'
import { askClaude } from '@/lib/claude/client'
import { ClaudeRoadmapResponseSchema, parseClaudeJSON } from '@/lib/claude/schemas'
import type { RoadmapStep, CreateRoadmapStepDTO, UpdateStepStatusDTO } from '@/types/roadmap'
import type { Profile } from '@/types/profile'
import type { UserProfile } from '@/lib/knowledge-base/prompts'
```

- [ ] **Step 2: Add `toPromptProfile` private helper after the imports, before `export const RoadmapService`**

```typescript
// ---------------------------------------------------------------------------
// Map the DB Profile row to the UserProfile shape buildRoadmapPrompt expects.
// ---------------------------------------------------------------------------

function toPromptProfile(p: Profile): UserProfile {
  const sector = p.industry_sector?.toLowerCase() ?? ''
  return {
    business_type: p.business_type,
    industry_sector: p.industry_sector ?? p.business_type,
    is_home_based: p.is_home_based,
    serves_alcohol: ['bar', 'restaurant', 'catering', 'brewery', 'winery', 'distillery'].some(
      (k) => sector.includes(k)
    ),
    is_regulated_profession:
      p.business_type === 'personal_care' ||
      ['lawyer', 'engineer', 'accountant', 'architect', 'psychologist', 'nurse', 'physiotherapist', 'pharmacist'].some(
        (k) => sector.includes(k)
      ),
    stage: p.has_neq ? 'operating' : 'starting',
    expected_revenue_cad:
      p.expected_monthly_revenue != null ? p.expected_monthly_revenue * 12 : null,
    employee_count: p.num_employees,
    location: [p.borough, p.municipality].filter(Boolean).join(', '),
    age: p.age,
    is_newcomer:
      p.immigration_status === 'work_permit' || p.immigration_status === 'student',
    is_indigenous: false,
    is_woman: p.gender?.toLowerCase().includes('f') ?? false,
    business_summary:
      p.business_description ??
      `A ${p.business_type} business in ${p.municipality}`,
  }
}
```

- [ ] **Step 3: Run type-check**

```bash
cd /Users/josephrassi/BZNS && npx tsc --noEmit 2>&1 | head -40
```

Expected: TypeScript error on `toPromptProfile` if `UserProfile` import resolves incorrectly — fix by checking the import path. No other new errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/josephrassi/BZNS
git add src/services/roadmap.service.ts
git commit -m "feat(roadmap-service): add imports and toPromptProfile mapper"
```

---

### Task 3: Replace the `generate()` stub with the real Claude call

**Files:**
- Modify: `src/services/roadmap.service.ts`

- [ ] **Step 1: Replace the entire `generate()` method body** (the section from `// Check cache first` through `return savedSteps`)

```typescript
  async generate(profile_id: string): Promise<RoadmapStep[]> {
    const cacheKey = `roadmap:${profile_id}`

    // 1. Cache check — return immediately on hit (demo day: Yara's roadmap is pre-cached)
    const cached = await CacheRepository.get<RoadmapStep[]>(cacheKey)
    if (cached) return cached

    // 2. Fetch the user's profile
    const profile = await ProfileRepository.getById(profile_id)
    if (!profile) throw new Error(`RoadmapService.generate: Profile not found ${profile_id}`)

    // 3. Load KB and select documents relevant to this business type
    const kb = await loadKnowledgeBase()
    const context = contextFromProfile(profile)
    const docs = selectForPrompt(kb, context)
    const kbJson = serializeForPrompt(docs)

    // 4. Build the prompt and call Claude (up to 2 attempts)
    const systemPrompt = buildRoadmapPrompt(toPromptProfile(profile), kbJson)
    let rawText: string

    try {
      rawText = await askClaude(systemPrompt, 'Generate the roadmap now.', 'claude-sonnet-4-6')
    } catch (firstError) {
      // Retry once on network / rate-limit errors
      console.warn('[RoadmapService.generate] First Claude call failed, retrying:', firstError)
      rawText = await askClaude(systemPrompt, 'Generate the roadmap now.', 'claude-sonnet-4-6')
    }

    // 5. Parse + validate with Zod (throws if Claude returned malformed data)
    let claudeSteps
    try {
      claudeSteps = ClaudeRoadmapResponseSchema.parse(parseClaudeJSON(rawText))
    } catch (parseError) {
      throw new Error(
        `RoadmapService.generate: Claude response failed validation. Raw: ${rawText.slice(0, 200)}`
      )
    }

    // 6. Map validated Claude steps → DB insert shape
    const stepDTOs: CreateRoadmapStepDTO[] = claudeSteps.map((step) => ({
      profile_id,
      step_order: step.step_order,
      step_key: step.step_key,
      title: step.title,
      description: step.description,
      why_needed: step.why_needed,
      estimated_cost: step.estimated_cost,
      estimated_timeline: step.estimated_timeline,
      required_documents: step.required_documents,
      government_url: step.government_url,
      source: step.source,
      depends_on: step.depends_on,
      status: 'pending',
      completed_at: null,
      notes: null,
    }))

    // 7. Save to DB and cache
    const savedSteps = await RoadmapRepository.batchUpsert(stepDTOs)
    await CacheRepository.set(cacheKey, savedSteps)

    return savedSteps
  },
```

Note: `askClaude` in `src/lib/claude/client.ts` defaults to `max_tokens: 2048`. A full roadmap can be 15 steps × ~200 tokens each. You must also update `askClaude` to accept a `maxTokens` override OR bump the default. See Task 4.

- [ ] **Step 2: Run type-check**

```bash
cd /Users/josephrassi/BZNS && npx tsc --noEmit 2>&1 | head -40
```

Expected: zero errors in `roadmap.service.ts`. Fix any type errors before proceeding.

- [ ] **Step 3: Commit**

```bash
cd /Users/josephrassi/BZNS
git add src/services/roadmap.service.ts
git commit -m "feat(roadmap-service): wire Claude call, KB selection, Zod validation, and DB write in generate()"
```

---

### Task 4: Bump `askClaude` token limit for roadmap generation

**Files:**
- Modify: `src/lib/claude/client.ts`

The roadmap can be 10–15 steps, each with 6+ fields. The current default of 2048 tokens will truncate mid-JSON and cause Zod to throw. 4096 is safe.

- [ ] **Step 1: Update `askClaude` signature in `src/lib/claude/client.ts`** to accept an optional `maxTokens` param

```typescript
export async function askClaude(
  systemPrompt: string,
  userMessage: string,
  model = 'claude-opus-4-5',
  maxTokens = 4096           // ← was 2048
): Promise<string> {
  const client = getAnthropicClient();
  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const block = response.content[0];
  if (block.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }
  return block.text;
}
```

- [ ] **Step 2: Run type-check**

```bash
cd /Users/josephrassi/BZNS && npx tsc --noEmit 2>&1 | head -20
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/josephrassi/BZNS
git add src/lib/claude/client.ts
git commit -m "fix(claude-client): bump default max_tokens to 4096 to avoid roadmap truncation"
```

---

### Task 5: Add `clear()` to service + DELETE handler to route

**Files:**
- Modify: `src/services/roadmap.service.ts`
- Modify: `src/app/api/roadmap/route.ts`

- [ ] **Step 1: Add `clear()` method to `RoadmapService`** (after `regenerate()`)

```typescript
  /**
   * Clear all steps for a profile without regenerating.
   * The frontend calls POST /api/roadmap again when it wants a fresh roadmap.
   */
  async clear(profile_id: string): Promise<void> {
    await RoadmapRepository.deleteByProfileId(profile_id)
    await CacheRepository.delete(`roadmap:${profile_id}`)
  },
```

- [ ] **Step 2: Add DELETE handler to `src/app/api/roadmap/route.ts`** (after the PATCH export)

```typescript
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const profile_id = searchParams.get('profile_id')

    if (!profile_id) return NextResponse.json({ error: 'profile_id required' }, { status: 400 })

    await RoadmapService.clear(profile_id)
    return NextResponse.json({
      message: 'Roadmap cleared — generate a new one by posting to /api/roadmap',
    })
  } catch (err) {
    console.error('[DELETE /api/roadmap]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Run type-check**

```bash
cd /Users/josephrassi/BZNS && npx tsc --noEmit 2>&1 | head -20
```

Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/josephrassi/BZNS
git add src/services/roadmap.service.ts src/app/api/roadmap/route.ts
git commit -m "feat(roadmap): add clear() service method and DELETE /api/roadmap handler"
```

---

### Task 6: Fix the store camelCase bug

**Files:**
- Modify: `src/stores/roadmap-store.ts`

The store currently sends `{ profileId }` (camelCase) but the POST route destructures `const { profile_id } = body` (snake_case). This means every `generateRoadmap()` call from the frontend returns a 400.

- [ ] **Step 1: Fix `generateRoadmap` in `src/stores/roadmap-store.ts`**

Change line:
```typescript
body: JSON.stringify({ profileId }),
```
To:
```typescript
body: JSON.stringify({ profile_id: profileId }),
```

The full updated method:
```typescript
  generateRoadmap: async (profileId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: profileId }),
      });
      if (!response.ok) throw new Error('Failed to generate roadmap');
      const data = await response.json();
      set({ steps: data.steps ?? [] });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      set({ isLoading: false });
    }
  },
```

- [ ] **Step 2: Run type-check**

```bash
cd /Users/josephrassi/BZNS && npx tsc --noEmit 2>&1 | head -20
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/josephrassi/BZNS
git add src/stores/roadmap-store.ts
git commit -m "fix(roadmap-store): send profile_id (snake_case) to match POST /api/roadmap body"
```

---

### Task 7: Final type-check and smoke verification

**Files:** None — verification only.

- [ ] **Step 1: Full type-check — must be clean**

```bash
cd /Users/josephrassi/BZNS && npx tsc --noEmit
```

Expected output: no output (zero errors). If there are errors, fix them before proceeding.

- [ ] **Step 2: Lint check**

```bash
cd /Users/josephrassi/BZNS && npx next lint 2>&1 | tail -20
```

Expected: no errors (warnings are OK).

- [ ] **Step 3: Verify the full generate() flow mentally**

Trace through `RoadmapService.generate('some-uuid')` step by step:
1. `CacheRepository.get('roadmap:some-uuid')` → null (first call)
2. `ProfileRepository.getById('some-uuid')` → Profile row
3. `loadKnowledgeBase()` → KnowledgeBase (singleton, fast after first call)
4. `contextFromProfile(profile)` → `{ businessType: 'food', isHomeBased: true, servesAlcohol: false, ... }`
5. `selectForPrompt(kb, context)` → 12 KB documents
6. `serializeForPrompt(docs)` → JSON string, `_meta` stripped
7. `buildRoadmapPrompt(toPromptProfile(profile), kbJson)` → system prompt string
8. `askClaude(systemPrompt, 'Generate the roadmap now.', 'claude-sonnet-4-6')` → `"```json\n[...]```"`
9. `parseClaudeJSON(rawText)` → array of objects
10. `ClaudeRoadmapResponseSchema.parse(...)` → validated `ClaudeRoadmapStep[]`
11. `.map(step => ({ profile_id, ...step, status: 'pending', ... }))` → `CreateRoadmapStepDTO[]`
12. `RoadmapRepository.batchUpsert(stepDTOs)` → `RoadmapStep[]` with DB-generated IDs
13. `CacheRepository.set(cacheKey, savedSteps)` → cached for 24h

- [ ] **Step 4: Final commit if anything was cleaned up**

```bash
cd /Users/josephrassi/BZNS
git add -p  # stage only relevant fixes
git commit -m "chore: final type-check fixes for roadmap wiring"
```

---

## Self-review

**Spec coverage check:**
- ✅ POST generates roadmap (profile fetch → cache → KB select → Claude → Zod → DB write → return)
- ✅ GET returns existing roadmap (already worked, untouched)
- ✅ PATCH marks step complete with dependency check (already worked, untouched)
- ✅ DELETE clears roadmap (Task 5)
- ✅ Cache check returns instantly without calling Claude (Task 3 — `if (cached) return cached`)
- ✅ Zod validation catches malformed Claude output before DB write (Task 3)
- ✅ Dependency ordering enforced — Claude generates `depends_on`, stored in DB, service checks on PATCH (already in service)
- ✅ `profile_id` snake_case bug fixed (Task 6)
- ✅ Token truncation prevented (Task 4 — 4096 tokens)

**Type consistency:**
- `ClaudeRoadmapStepParsed` (from schema) → mapped to `CreateRoadmapStepDTO` (from types/roadmap.ts) ✅
- `toPromptProfile(p: Profile): UserProfile` — `UserProfile` imported from `knowledge-base/prompts.ts` ✅
- `contextFromProfile` accepts `Profile` because `Profile` satisfies `selector.UserProfile` structurally ✅
- `askClaude` called with 3 args — `maxTokens` defaults to 4096 ✅
