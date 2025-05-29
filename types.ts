
export type LanguageCode = 'en' | 'hi' | 'mr' | 'ta';

export interface ChartData {
  labels: string[];
  values: number[];
  dataLabel?: string; // e.g. "Yield (quintals/acre)"
}
export interface Advice {
  title: string;
  description: string;
  details?: string[];
  imageUrl?: string;
  chartData?: ChartData; // For simple bar charts
}

export interface PestDiseaseReport extends Advice {
  confidence?: string;
}

export interface CropRecommendation {
  cropName: string;
  suitabilityReason: string;
  keyBenefit: string;
  plantingTip: string;
}

export interface MarketInfo {
  cropName: string;
  overview: string;
  priceFactors: string[];
  trend?: number[]; // Optional numerical trend for charts e.g. [70, 75, 80]
}

export interface YieldPrediction {
  cropName: string;
  prediction: string;
  affectingFactors: string[];
  estimatedYieldRange?: number[]; // Optional e.g. [10, 12] representing 10-12 quintals/acre
}

export enum SoilType {
  LOAMY = "Loamy",
  SANDY = "Sandy",
  CLAY = "Clay",
  SILTY = "Silty",
  PEATY = "Peaty",
}

export enum Season {
  KHARIF = "Kharif (Monsoon)",
  RABI = "Rabi (Winter)",
  ZAID = "Zaid (Summer)",
}

export enum WaterAvailability {
  GOOD_IRRIGATION = "Good Irrigation",
  LIMITED_IRRIGATION = "Limited Irrigation",
  RAINFED = "Rain-fed Only",
}

export interface UserFarmInput {
  region: string;
  soilType: SoilType;
  season: Season;
  waterAvailability: WaterAvailability;
  cropName?: string; // Optional, for specific crop queries
}

export interface GroundingChunkWeb {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  web: GroundingChunkWeb;
}

export interface TranslationSet {
  [key: string]: string | TranslationSet; // Allow nested translation keys
}

export interface LocaleTranslations {
  en: TranslationSet;
  hi: TranslationSet;
  mr: TranslationSet;
  ta: TranslationSet;
}
