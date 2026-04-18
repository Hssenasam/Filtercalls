export type LayerName = 'structure' | 'geography' | 'reputation' | 'behavioral';

export interface LayerResult {
  name: LayerName;
  risk: number;
  trust: number;
  confidence: number;
  evidence: string[];
  source?: string;
  latencyMs: number;
}

export interface AnalyzeContext {
  e164: string;
  selectedCountry?: string;
  queryFresh?: boolean;
}
