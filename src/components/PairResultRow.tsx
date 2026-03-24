interface PairResultRowProps {
  isCorrect: boolean;
  earlierItemTitle?: string;
  laterItemTitle?: string;
}

export default function PairResultRow({
  isCorrect,
  earlierItemTitle,
  laterItemTitle,
}: PairResultRowProps) {
  if (isCorrect) {
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
