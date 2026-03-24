import type { Item, PairResult, ScoreResult } from '../types';

function getPositionPoints(diff: number): number {
  if (diff === 0) return 2;
  if (diff === 1) return 1.5;
  return 1;
}

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
    const correct = correctPosB === correctPosA + 1;
    if (correct) {
      streak += 1;
      pairScore += 1.5 + streak * 0.5;
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
    positionScore += getPositionPoints(Math.abs(userIdx - correctIdx));
  });

  // 3. Combine scores
  const rawScore = pairScore + positionScore;

  // 4. Theoretical maximum: all pairs correct (growing streak) + all positions correct
  // maxPairScore = sum of (1.5 + k*0.5) for k=1..n-1 = 1.5(n-1) + 0.25n(n-1)
  const maxPairScore = 1.5 * (n - 1) + 0.25 * n * (n - 1);
  const maxPositionScore = 2 * n;
  const maxRaw = maxPairScore + maxPositionScore;

  // 5. Normalize to 0–100; rawScore is always > 0 (position always contributes)
  const score = Math.round((rawScore / maxRaw) * 100);

  return { score, pairs, rawScore, maxScore: maxRaw, userOrder, correctOrder };
}
