import type { Item, PairResult, ScoreResult } from '../types';

export function calculateScore(userOrder: Item[], correctOrder: Item[]): ScoreResult {
  // Build a map from item id to its correct position (no year values used)
  const correctPositionMap = new Map<string, number>();
  correctOrder.forEach((item, idx) => correctPositionMap.set(item.id, idx));

  const n = userOrder.length;

  // Calculate positional displacement for each item
  // "one off" (displacement 1) scores much better than being far off (displacement 3+)
  let totalDisplacement = 0;
  userOrder.forEach((item, userIdx) => {
    const correctIdx = correctPositionMap.get(item.id)!;
    totalDisplacement += Math.abs(userIdx - correctIdx);
  });

  // Maximum possible displacement occurs when the order is completely reversed
  let maxDisplacement = 0;
  for (let i = 0; i < n; i++) {
    maxDisplacement += Math.abs(i - (n - 1 - i));
  }

  // Build pair results using correct positions (not year values)
  let streak = 0;
  const pairs: PairResult[] = [];
  for (let i = 0; i < n - 1; i++) {
    const correctPosA = correctPositionMap.get(userOrder[i].id)!;
    const correctPosB = correctPositionMap.get(userOrder[i + 1].id)!;
    const correct = correctPosA < correctPosB;
    if (correct) {
      streak++;
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

  const rawScore = maxDisplacement - totalDisplacement;
  const maxScore = maxDisplacement;
  const score = Math.round(Math.max(0, rawScore / maxScore) * 1000);

  return { score, pairs, rawScore, maxScore, userOrder, correctOrder };
}
