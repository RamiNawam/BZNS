export type BusinessStage = 'idea' | 'pre_launch' | 'launched' | 'established';

export type BusinessStructure =
  | 'sole_proprietorship'
  | 'general_partnership'
  | 'incorporation'
  | 'cooperative'
  | 'undecided';

export type Province = 'QC' | 'ON' | 'BC' | 'AB' | 'other';

export interface UserProfile {
  id: string;
  userId: string;
  businessName: string | null;
  sector: string | null;
  sectorCode: string | null; // NAICS code
  city: string | null;
  province: Province;
  businessStage: BusinessStage;
  businessStructure: BusinessStructure;
  revenueProjection: number | null;
  employeesCount: number;
  hasEmployees: boolean;

  // Demographics (for funding matching)
  age: number | null;
  gender: string | null;
  isIndigenous: boolean;
  isVisibleMinority: boolean;
  isNewcomer: boolean;
  isWoman: boolean;

  // Sector-specific flags
  sellsFood: boolean;
  sellsAlcohol: boolean;
  isRegulatedProfession: boolean;
  operatesInMontreal: boolean;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export type ProfileFormData = Omit<UserProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
