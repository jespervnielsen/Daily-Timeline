import type { Item, PairResult, ScoreResult } from '../types';

export function calculateScore(userOrder: Item[], correctOrder: Item[]): ScoreResult {
  let streak = 0;
  let rawScore = 0;
  const pairs: PairResult[] = [];

  for (let i = 0; i < userOrder.length - 1; i++) {
    const correct = userOrder[i].year <= userOrder[i + 1].year;
    if (correct) {
      streak++;
      rawScore += 1 + streak;
    } else {
      streak = 0;
    }
    pairs.push({
      itemA: userOrder[i],
      itemB: userOrder[i + 1],
      correct,
      streakAtThisPoint: streak,
      points: correct ? 1 + streak : 0,
    });
  }

  const maxScore = 14;
  const score = Math.round((rawScore / maxScore) * 1000);

  return {
    score,
    pairs,
    rawScore,
    maxScore,
    userOrder,
    correctOrder,
  };
}
