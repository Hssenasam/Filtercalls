export interface ProviderResult {
  ok: boolean;
  risk: number;
  trust: number;
  confidence: number;
  evidence: string[];
  source: string;
  metadata?: {
    lineType?: string;
    country?: string;
    carrier?: string;
  };
}

export interface PhoneProvider {
  name: string;
  enabled(): boolean;
  lookup(e164: string): Promise<ProviderResult>;
}
