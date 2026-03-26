import type { Item, PairResult, ScoreResult } from '../types';

function getPositionPoints(diff: number): number {
  if (diff === 0) return 2;
  if (diff === 1) return 1.5;
  return 0;
}

export function calculateScore(userOrder: Item[], correctOrder: Item[]): ScoreResult {
  // Build a map from item id to its position in the correct order (used for pair and position scoring)
  const correctPositionMap = new Map<string, number>();
  correctOrder.forEach((item, idx) => correctPositionMap.set(item.id, idx));

  const n = correctOrder.length;

  // 1. Pair / Combo Scoring – rewards streaks of correctly ordered consecutive pairs
  //    Pairs are defined by the user's submitted order (source of truth for feedback rows).
  //    A pair is correct when the left item comes before the right item in the correct
  //    timeline (relative ordering, not necessarily consecutive positions).
  let streak = 0;
  let pairScore = 0;
  const pairs: PairResult[] = [];

  for (let i = 0; i < n - 1; i++) {
    const itemA = userOrder[i];
    const itemB = userOrder[i + 1];
    const correctPosA = correctPositionMap.get(itemA.id)!;
    const correctPosB = correctPositionMap.get(itemB.id)!;
    const correct = correctPosA < correctPosB;
    if (correct) {
      pairScore += 2 + streak * 0.5;
      streak += 1;
    } else {
      streak = 0;
    }
    pairs.push({
      itemA,
      itemB,
      correct,
      streakAtThisPoint: streak,
    });
  }

  // 2. Position Scoring – exact placement earns full points, 1 off earns partial;
  //    2+ off earns nothing (keeps minimum score anchored at 0)
  let positionScore = 0;
  userOrder.forEach((item, userIdx) => {
    const correctIdx = correctPositionMap.get(item.id)!;
    positionScore += getPositionPoints(Math.abs(userIdx - correctIdx));
  });

  // 3. Combine scores
  const rawScore = pairScore + positionScore;

  // 4. Theoretical maximum: all pairs correct (growing streak) + all positions correct
  // maxPairScore = sum of (2 + k*0.5) for k=0..n-2 = 1.5(n-1) + 0.25n(n-1)
  const maxPairScore = 1.5 * (n - 1) + 0.25 * n * (n - 1);
  const maxPositionScore = 2 * n;
  const maxRaw = maxPairScore + maxPositionScore;

  // 5. Normalize to 0–100; minimum is 0 (no correct pairs, all positions 2+ off)
  const score = Math.round((rawScore / maxRaw) * 100);

  return { score, pairs, rawScore, maxScore: maxRaw, userOrder, correctOrder };
}
