interface PairResultRowProps {
  isCorrect: boolean;
}

export default function PairResultRow({ isCorrect }: PairResultRowProps) {
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
      <span className="pair-result-label">Out of order</span>
    </div>
  );
}
