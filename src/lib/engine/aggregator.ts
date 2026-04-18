import { LayerResult } from '@/lib/engine/layer-types';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const LAYER_WEIGHT: Record<LayerResult['name'], number> = {
  structure: 1,
  geography: 1.2,
  reputation: 1.8,
  behavioral: 0.8
};

export const aggregateLayers = (layers: LayerResult[]) => {
  let weightedLogOdds = 0;
  let totalWeight = 0;

  for (const layer of layers) {
    if (layer.confidence <= 0) continue;
    const p = clamp(layer.risk / 100, 0.001, 0.999);
    const logOdds = Math.log(p / (1 - p));
    const weight = layer.confidence * LAYER_WEIGHT[layer.name];
    weightedLogOdds += logOdds * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) {
    return { risk: 50, trust: 50, confidence: 0 };
  }

  const averaged = weightedLogOdds / totalWeight;
  const probability = 1 / (1 + Math.exp(-averaged));
  const risk = Math.round(probability * 100);
  const trust = 100 - risk;

  const confidence = Number(
    (
      1 -
      layers.reduce((acc, layer) => {
        const c = clamp(layer.confidence, 0, 1);
        return acc * (1 - c);
      }, 1)
    ).toFixed(2)
  );

  return { risk, trust, confidence };
};
