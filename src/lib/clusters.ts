// ============================================================
// BZNS — Business Cluster Definitions
// Each cluster maps to a label, a complexity tier, and the
// exact KB files that should be injected into Claude prompts
// for that type of business.
// ============================================================

export type ClusterID = 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6' | 'C7' | 'C8' | 'C9' | 'C10' | 'C11' | 'C12';

export const CLUSTERS: Record<
  ClusterID,
  { label: string; kb_files: string[]; complexity: 'low' | 'medium' | 'high' }
> = {
  C1: {
    label: 'Home-based food',
    complexity: 'high',
    kb_files: [
      'permits/mapaq.json',
      'permits/municipal_montreal.json',
      'registration/req.json',
      'tax/gst_qst.json',
      'tax/qpp.json',
      'funding/sta.json',
      'funding/pme_mtl.json',
      'compliance/bill96.json',
    ],
  },
  C2: {
    label: 'Freelance & digital services',
    complexity: 'low',
    kb_files: [
      'registration/req.json',
      'registration/revenu_quebec.json',
      'tax/qpp.json',
      'tax/installments.json',
      'tax/deductions.json',
      'tax/gst_qst.json',
      'funding/futurpreneur.json',
      'funding/bdc.json',
      'compliance/bill96.json',
    ],
  },
  C3: {
    label: 'Regulated childcare',
    complexity: 'high',
    kb_files: [
      'permits/famille.json',
      'permits/municipal_montreal.json',
      'registration/req.json',
      'tax/qpp.json',
      'funding/sta.json',
      'compliance/bill96.json',
    ],
  },
  C4: {
    label: 'Regulated professional',
    complexity: 'medium',
    kb_files: [
      'permits/professional_orders.json',
      'registration/req.json',
      'registration/cra.json',
      'tax/gst_qst.json',
      'tax/installments.json',
      'funding/futurpreneur.json',
      'compliance/bill96.json',
    ],
  },
  C5: {
    label: 'Online retail',
    complexity: 'medium',
    kb_files: [
      'registration/req.json',
      'registration/revenu_quebec.json',
      'tax/gst_qst.json',
      'tax/deductions.json',
      'funding/pme_mtl.json',
      'funding/fli.json',
      'compliance/bill96.json',
    ],
  },
  C6: {
    label: 'Physical retail',
    complexity: 'medium',
    kb_files: [
      'registration/req.json',
      'registration/revenu_quebec.json',
      'tax/gst_qst.json',
      'permits/municipal_montreal.json',
      'tax/deductions.json',
      'funding/pme_mtl.json',
      'funding/fli.json',
      'compliance/bill96.json',
      'compliance/signage.json',
    ],
  },
  C7: {
    label: 'Restaurant & food service',
    complexity: 'high',
    kb_files: [
      'permits/mapaq.json',
      'permits/racj.json',
      'permits/municipal_montreal.json',
      'registration/req.json',
      'tax/gst_qst.json',
      'funding/bdc.json',
      'funding/pme_mtl.json',
      'compliance/bill96.json',
      'compliance/signage.json',
    ],
  },
  C8: {
    label: 'Construction & trades',
    complexity: 'high',
    kb_files: [
      'permits/professional_orders.json',
      'registration/req.json',
      'registration/revenu_quebec.json',
      'tax/gst_qst.json',
      'tax/installments.json',
      'funding/futurpreneur.json',
      'funding/pme_mtl.json',
      'compliance/bill96.json',
    ],
  },
  C9: {
    label: 'Personal care & beauty',
    complexity: 'medium',
    kb_files: [
      'registration/req.json',
      'permits/municipal_montreal.json',
      'tax/gst_qst.json',
      'tax/qpp.json',
      'funding/pme_mtl.json',
      'funding/sta.json',
      'compliance/bill96.json',
      'compliance/signage.json',
    ],
  },
  C10: {
    label: 'Fitness & wellness',
    complexity: 'low',
    kb_files: [
      'registration/req.json',
      'permits/municipal_montreal.json',
      'tax/gst_qst.json',
      'tax/qpp.json',
      'tax/deductions.json',
      'funding/sta.json',
      'funding/futurpreneur.json',
      'compliance/bill96.json',
    ],
  },
  C11: {
    label: 'Creative & media',
    complexity: 'low',
    kb_files: [
      'registration/req.json',
      'registration/revenu_quebec.json',
      'tax/qpp.json',
      'tax/deductions.json',
      'tax/gst_qst.json',
      'funding/futurpreneur.json',
      'funding/bdc.json',
      'compliance/bill96.json',
    ],
  },
  C12: {
    label: 'Education & tutoring',
    complexity: 'low',
    kb_files: [
      'registration/req.json',
      'registration/revenu_quebec.json',
      'tax/qpp.json',
      'tax/deductions.json',
      'tax/gst_qst.json',
      'funding/futurpreneur.json',
      'funding/sta.json',
      'compliance/bill96.json',
    ],
  },
};
