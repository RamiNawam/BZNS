export type RoadmapCategory =
  | 'registration'
  | 'permits'
  | 'tax'
  | 'banking'
  | 'insurance'
  | 'other';

export type StepStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export interface RoadmapStep {
  id: string;
  profileId: string;
  title_en: string;
  title_fr: string;
  description_en: string;
  description_fr: string;
  category: RoadmapCategory;
  priority: number;
  status: StepStatus;
  estimatedTimeHours: number | null;
  links: { label: string; url: string }[];
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoadmapState {
  steps: RoadmapStep[];
  isLoading: boolean;
  error: string | null;
}
