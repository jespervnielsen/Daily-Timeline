interface PairResultRowProps {
  isCorrect: boolean;
  streak: number;
  earlierItemTitle?: string;
  laterItemTitle?: string;
  /** True when the user placed these two items in the correct relative order,
   *  even if they are not adjacent in the correct answer. */
  inCorrectOrder?: boolean;
}

export default function PairResultRow({
  isCorrect,
  streak,
  earlierItemTitle,
  laterItemTitle,
  inCorrectOrder,
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

  // The user placed these two items in the correct relative order but they are
  // not adjacent in the correct answer – no additional hint is shown.
  if (inCorrectOrder) {
    return null;
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
