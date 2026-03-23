interface PairResultRowProps {
  isCorrect: boolean;
  streak: number;
  earlierItemTitle?: string;
  laterItemTitle?: string;
}

export default function PairResultRow({
  isCorrect,
  streak,
  earlierItemTitle,
  laterItemTitle,
}: PairResultRowProps) {
  if (isCorrect) {
    // streak is always ≥ 1 for correct pairs (incremented before recording)
    const fireEmojis = '🔥'.repeat(Math.max(1, streak));
    return (
      <div className="pair-result-row pair-result-row--correct">
        <span className="pair-result-fire">{fireEmojis}</span>
        <span className="pair-result-correct-text">Right order</span>
      </div>
    );
  }

  return (
    <div className="pair-result-row pair-result-row--wrong">
      <span className="pair-result-icon">❌</span>
      {earlierItemTitle && laterItemTitle ? (
        <span className="pair-result-label">
          <em>{earlierItemTitle}</em> should come before <em>{laterItemTitle}</em>
        </span>
      ) : (
        <span className="pair-result-label">Wrong order</span>
      )}
    </div>
  );
}
