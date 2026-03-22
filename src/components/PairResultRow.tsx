import type { Item } from '../types';

interface PairResultRowProps {
  isCorrect: boolean;
  streak: number;
  itemA: Item;
  itemB: Item;
}

export default function PairResultRow({
  isCorrect,
  streak,
  itemA,
  itemB,
}: PairResultRowProps) {
  if (isCorrect) {
    const pairPoints = 2 + streak * 0.5;
    // streak is always ≥ 1 for correct pairs (incremented before recording)
    const fireEmojis = '🔥'.repeat(Math.max(1, streak));
    const streakLabel = `${fireEmojis} +${pairPoints}`;
    return (
      <div className="pair-result-row pair-result-row--correct">
        <span className="pair-result-label">{streakLabel}</span>
        <span className="pair-result-correct-text">Correct order</span>
      </div>
    );
  }

  // When isCorrect is false, itemA should come after itemB in the correct order
  const explanation = `${itemB.title} should come before ${itemA.title}`;

  return (
    <div className="pair-result-row pair-result-row--wrong">
      <span className="pair-result-icon">❌</span>
      <div className="pair-result-wrong-info">
        <span className="pair-result-label">Wrong order</span>
        <span className="pair-result-explanation">{explanation}</span>
      </div>
    </div>
  );
}
