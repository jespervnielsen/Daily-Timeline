interface PairResultRowProps {
  isCorrect: boolean;
  pairIndex?: number;
}

export default function PairResultRow({ isCorrect, pairIndex }: PairResultRowProps) {
  if (isCorrect) {
    return (
      <div className="pair-result-row pair-result-row--correct">
        {pairIndex !== undefined && (
          <span className="pair-result-number">#{pairIndex}</span>
        )}
        <span className="pair-result-icon">✓</span>
        <span className="pair-result-correct-text">In order</span>
      </div>
    );
  }

  return (
    <div className="pair-result-row pair-result-row--wrong">
      {pairIndex !== undefined && (
        <span className="pair-result-number">#{pairIndex}</span>
      )}
      <span className="pair-result-icon">❌</span>
      <span className="pair-result-label">Out of order</span>
    </div>
  );
}
