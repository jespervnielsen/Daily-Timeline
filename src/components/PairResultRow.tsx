import type { Item } from '../types';

interface PairResultRowProps {
  isCorrect: boolean;
  streak: number;
  points: number;
  itemA: Item;
  itemB: Item;
  streakBroken: boolean;
}

export default function PairResultRow({
  isCorrect,
  streak,
  points,
  itemA,
  itemB,
  streakBroken,
}: PairResultRowProps) {
  if (isCorrect) {
    const fireEmojis = '🔥'.repeat(streak);
    const streakLabel = streak >= 2 ? ` (streak ×${streak})` : '';
    return (
      <div className="pair-result-row pair-result-row--correct">
        <span className="pair-result-fire">{fireEmojis}</span>
        <span className="pair-result-points">+{points}</span>
        <span className="pair-result-label">Correct order{streakLabel}</span>
      </div>
    );
  }

  // When isCorrect is false, itemA.year > itemB.year by the scoring logic
  const explanation = `${itemB.title} should come before ${itemA.title}`;

  return (
    <div className="pair-result-row pair-result-row--wrong">
      <span className="pair-result-icon">❌</span>
      <div className="pair-result-wrong-info">
        <span className="pair-result-label">Wrong order</span>
        {streakBroken && (
          <span className="pair-result-streak-broken">Streak broken</span>
        )}
        <span className="pair-result-explanation">{explanation}</span>
      </div>
    </div>
  );
}
