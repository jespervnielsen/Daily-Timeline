import type { Item, PairResult, ScoreResult } from '../types';

export function calculateScore(userOrder: Item[], correctOrder: Item[]): ScoreResult {
  // Build a map from item id to its correct position
  const correctPositionMap = new Map<string, number>();
  correctOrder.forEach((item, idx) => correctPositionMap.set(item.id, idx));

  const n = userOrder.length;

  // 1. Pair / Combo Scoring – rewards streaks of correct adjacent pairs
  let streak = 0;
  let pairScore = 0;
  const pairs: PairResult[] = [];

  for (let i = 0; i < n - 1; i++) {
    const correctPosA = correctPositionMap.get(userOrder[i].id)!;
    const correctPosB = correctPositionMap.get(userOrder[i + 1].id)!;
    const correct = correctPosA < correctPosB;
    if (correct) {
      streak += 1;
      pairScore += 2 + streak * 0.5;
    } else {
      streak = 0;
    }
    pairs.push({
      itemA: userOrder[i],
      itemB: userOrder[i + 1],
      correct,
      streakAtThisPoint: streak,
    });
  }

  // 2. Position Scoring – adds fairness and granularity
  let positionScore = 0;
  userOrder.forEach((item, userIdx) => {
    const correctIdx = correctPositionMap.get(item.id)!;
    const diff = Math.abs(userIdx - correctIdx);
    if (diff === 0) {
      positionScore += 2;
    } else if (diff === 1) {
      positionScore += 1.5;
    } else { // diff >= 2
      positionScore += 1;
    }
  });

  // 3. Combine scores
  const rawScore = pairScore + positionScore;

  // 4. Theoretical maximum: all pairs correct (growing streak) + all positions correct
  // maxPairScore = sum of (2 + k*0.5) for k=1..n-1 = 2(n-1) + (n-1)*n/4
  const maxPairScore = 2 * (n - 1) + (n - 1) * n / 4;
  const maxPositionScore = 2 * n;
  const maxRaw = maxPairScore + maxPositionScore;

  // 5. Normalize to 0–100
  const score = Math.round((rawScore / maxRaw) * 100);

  return { score, pairs, rawScore, maxScore: maxRaw, userOrder, correctOrder };
}
