// ============================================================
// BUSINESS CLASSIFIER — Maps intake answers to cluster (C1-C9)
// Pure deterministic logic based on keywords + setup
// ============================================================

import type { IntakeFormState } from '@/stores/profile-store';
import type { ClusterID } from '@/lib/clusters';

/**
 * Classify a user's business into one of 9 clusters based on intake answers.
 * Uses keyword matching on business_idea + setup context.
 * Falls back to C9 (General) if no clear match.
 */
export function classifyBusiness(intake: Partial<IntakeFormState>): ClusterID {
  const businessIdea = (intake.business_idea ?? '').toLowerCase();
  const isHomeBased = intake.is_home_based;

  // ── C1: Home-based food ────────────────────────────────────────────────────
  // Keywords: bake, pastry, cake, cookie, bread, jam, honey, tea, coffee, spice, sauce, sauce, prepared food
  const FOOD_KEYWORDS = [
    'bake', 'bakery', 'pastry', 'cake', 'cookie', 'bread', 'donut',
    'jam', 'honey', 'spice', 'sauce', 'prepared', 'meal', 'lunch',
    'dinner', 'coffee', 'tea', 'preserve', 'cookie', 'brownie',
  ];
  if (hasKeywords(businessIdea, FOOD_KEYWORDS) && isHomeBased) {
    return 'C1';
  }

  // ── C2: Freelance / consulting ─────────────────────────────────────────────
  // Keywords: freelance, consultant, designer, developer, programmer, writer, editor,
  // coach, accountant (if not regulated), financial advisor (if not regulated)
  const FREELANCE_KEYWORDS = [
    'freelance', 'consultant', 'consulting', 'designer', 'design',
    'developer', 'programmer', 'coding', 'writer', 'writing', 'editor',
    'coach', 'coaching', 'tutor', 'tutoring', 'trainer', 'training',
    'copywriter', 'translator', 'interpreter', 'analyst',
    'virtual assistant', 'bookkeeper', 'virtual',
  ];
  if (hasKeywords(businessIdea, FREELANCE_KEYWORDS)) {
    return 'C2';
  }

  // ── C3: Regulated childcare ────────────────────────────────────────────────
  // Keywords: childcare, daycare, babysit, nanny, preschool, nursery, children
  const CHILDCARE_KEYWORDS = [
    'childcare', 'daycare', 'babysit', 'babysitting', 'nanny', 'preschool',
    'nursery', 'children', 'kids', 'infants', 'toddlers', 'home care',
  ];
  if (hasKeywords(businessIdea, CHILDCARE_KEYWORDS)) {
    return 'C3';
  }

  // ── C4: Regulated professional ─────────────────────────────────────────────
  // Keywords: lawyer, notary, accountant, auditor, engineer, plumber, electrician (regulated)
  // architect, surveyor, technician (regulated)
  const REGULATED_KEYWORDS = [
    'lawyer', 'notary', 'accountant', 'ca', 'auditor', 'engineer',
    'architect', 'surveyor', 'vet', 'dentist', 'chiropractor',
    'psychologist', 'therapist', 'optometrist', 'optician',
  ];
  if (hasKeywords(businessIdea, REGULATED_KEYWORDS)) {
    return 'C4';
  }

  // ── C6: Food service / hospitality ─────────────────────────────────────────
  // Keywords: restaurant, cafe, café, catering, bistro, bar, pub, pizzeria, poutine, BBQ, grill
  const HOSPITALITY_KEYWORDS = [
    'restaurant', 'cafe', 'café', 'catering', 'bistro', 'bar', 'pub',
    'pizzeria', 'poutine', 'bbq', 'grill', 'deli', 'diner', 'brunch',
    'food truck', 'truck', 'stall', 'food stall', 'takeout', 'delivery',
    'kitchen', 'commercial food', 'commercial kitchen', 'commissary',
  ];
  if (hasKeywords(businessIdea, HOSPITALITY_KEYWORDS) && !isHomeBased) {
    return 'C6';
  }

  // ── C7: Construction / trades ──────────────────────────────────────────────
  // Keywords: carpenter, plumber, electrician (if not regulated), roofer, mason, painter,
  // contractor, construction, hvac, welding, handyman, renovations
  const TRADES_KEYWORDS = [
    'carpenter', 'carpentry', 'plumber', 'plumbing', 'electrician', 'electrical',
    'roofer', 'roofing', 'mason', 'masonry', 'painter', 'painting',
    'contractor', 'construction', 'hvac', 'welding', 'handyman', 'renovation',
    'handy', 'home repair', 'decking', 'hardwood', 'tile', 'flooring',
  ];
  if (hasKeywords(businessIdea, TRADES_KEYWORDS)) {
    return 'C7';
  }

  // ── C8: Personal services ──────────────────────────────────────────────────
  // Keywords: hair, salon, barber, stylist, massage, spa, nails, beauty, makeup,
  // personal trainer, fitness, yoga, pilates, cleaning, housekeeping, laundry
  const PERSONAL_KEYWORDS = [
    'hair', 'salon', 'barber', 'stylist', 'massage', 'spa', 'nails',
    'beauty', 'makeup', 'personal trainer', 'fitness', 'yoga', 'pilates',
    'cleaning', 'housekeeping', 'laundry', 'ironing', 'maid', 'home care',
    'esthetic', 'waxing', 'threading', 'tattoo',
  ];
  if (hasKeywords(businessIdea, PERSONAL_KEYWORDS)) {
    return 'C8';
  }

  // ── C5: Retail / product sales ─────────────────────────────────────────────
  // Keywords: sell, shop, store, retail, ecommerce, online store, dropship, resell,
  // craft, handmade, etsy, amazon, ebay, boutique, merchandise
  const RETAIL_KEYWORDS = [
    'sell', 'shop', 'store', 'retail', 'ecommerce', 'e-commerce',
    'online store', 'dropship', 'resell', 'craft', 'handmade',
    'etsy', 'amazon', 'ebay', 'boutique', 'merchandise', 'products',
    'clothing', 'apparel', 'fashion', 'jewelry', 'accessories',
    'gifts', 'art', 'vintage', 'collectibles', 'home decor',
  ];
  if (hasKeywords(businessIdea, RETAIL_KEYWORDS)) {
    return 'C5';
  }

  // ── C9: General / unknown (fallback) ───────────────────────────────────────
  return 'C9';
}

/**
 * Helper: check if text contains any of the keywords
 */
function hasKeywords(text: string, keywords: string[]): boolean {
  if (!text) return false;
  return keywords.some((kw) => text.includes(kw));
}
