interface PairResultRowProps {
  isCorrect: boolean;
  earlierItemTitle?: string;
  laterItemTitle?: string;
  /** True when the user placed these two items in the correct relative order,
   *  even if they are not adjacent in the correct answer. */
  inCorrectOrder?: boolean;
}

export default function PairResultRow({
  isCorrect,
  earlierItemTitle,
  laterItemTitle,
  inCorrectOrder,
}: PairResultRowProps) {
  if (isCorrect || inCorrectOrder) {
    return (
      <div className="pair-result-row pair-result-row--correct">
        <span className="pair-result-icon">✓</span>
        <span className="pair-result-correct-text">In order</span>
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
