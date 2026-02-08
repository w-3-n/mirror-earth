export type TerrainType = 'WETLAND' | 'GRASSLAND' | 'FOREST' | 'ROCKY';
export type WeatherType = 'SUNNY' | 'RAINY' | 'STORMY' | 'WINDY';

export interface Crop {
  id: string;
  name: string;
  realName: string;
  scientificName?: string;
  category: string;
  grade: number;
  terrain: TerrainType;
  growthTime: number; 
  h2oRange: [number, number];
  sellPrice: number;
  description: string;
  educationalDescription?: string;
  researchHint?: string;
  isSeed?: boolean; 
  isUnknown?: boolean; 
}

export interface Relic {
  id: string;
  name: string;
  type: 'WATER' | 'FERTILIZER' | 'PEST' | 'RAIN';
  maxCharges: number;
  currentCharges: number;
  particleType: 'WATER' | 'EARTH' | 'LIGHT' | 'THUNDER';
  color: string;
}

export interface Particle {
  id: string;
  type: 'WATER' | 'EARTH' | 'LIGHT' | 'THUNDER';
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  isCollected?: boolean;
}

export interface Slot {
  id: string;
  terrain: TerrainType;
  type: 'STANDARD' | 'MYSTERY';
  crop: Crop | null;
  growthProgress: number; 
  h2o: number;
  n: number; 
  isReady: boolean;
  persistenceCount: number; 
  highNutrientTimer: number; 
  perfectH2OTimer: number; 
}

export interface Quest {
  id: string;
  npc: string;
  description: string;
  targetCropId: string;
  targetGrade: number;
  rewardFp: number;
  rewardKp: number;
  isCompleted: boolean;
}

export interface GameState {
  fp: number; 
  kp: number; 
  rp: number; 
  inventory: Crop[];
  relics: Relic[]; 
  grid: Slot[];
  weather: WeatherType;
  quests: Quest[];
  restorationProgress: number; 
  verifiedCrops: string[]; 
  dailyQuotas: { [key: string]: number };
}
