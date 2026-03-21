import type { ScoreResult, Item } from '../types';

interface ResultScreenProps {
  result: ScoreResult;
  items: Item[];
  date: string;
}

function getTierLabel(score: number): string {
  if (score >= 900) return 'Perfect! 🏆';
  if (score >= 700) return 'Strong! 💪';
  if (score >= 400) return 'Okay! 👍';
  return 'Almost! 🤔';
}

function formatYear(year: number): string {
  if (year < 0) return `${Math.abs(year)} BC`;
  return `${year} AD`;
}

export default function ResultScreen({ result, date }: ResultScreenProps) {
  const { score, pairs, correctOrder } = result;
  const tier = getTierLabel(score);

  const handleShare = async () => {
    const pairEmojis = pairs.map((p) => (p.correct ? '✅' : '❌')).join('');
    const text = `Daily Timeline ${date}\n${score}/1000 – ${tier}\n${pairEmojis}\nhttps://github.com/your-repo/Daily-Timeline`;
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard! 📋');
    } catch {
      prompt('Copy this text:', text);
    }
  };

  return (
    <div className="result-screen">
      {/* ── Score Header ── */}
      <div className="score-header">
        <div className="score-emoji">🎉</div>
        <div className="score-number">{score}</div>
        <div className="score-denom">/ 1000</div>
        <div className="score-tier">{tier}</div>
      </div>

      {/* ── Pair Results ── */}
      <section className="pairs-section">
        <h2>Your Pairs</h2>
        <div className="pairs-list">
          {pairs.map((pair, i) => (
            <div key={i} className={`pair-row ${pair.correct ? 'pair-correct' : 'pair-wrong'}`}>
              <span className="pair-icon">{pair.correct ? '✅' : '❌'}</span>
              <span className="pair-names">
                <span className="pair-item">{pair.itemA.title}</span>
                <span className="pair-arrow"> → </span>
                <span className="pair-item">{pair.itemB.title}</span>
              </span>
              {pair.correct && (
                <span className="pair-points">
                  {pair.streakAtThisPoint > 1 && (
                    <span className="pair-flame">{'🔥'.repeat(Math.min(pair.streakAtThisPoint - 1, 3))}</span>
                  )}
                  +{pair.points}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Correct Timeline ── */}
      <section className="timeline-section">
        <h2>Correct Timeline</h2>
        <div className="timeline">
          {correctOrder.map((item, i) => (
            <div key={item.id} className="timeline-item">
              <div className="timeline-connector">
                <div className="timeline-dot" />
                {i < correctOrder.length - 1 && <div className="timeline-line" />}
              </div>
              <div className="timeline-card">
                <img
                  className="timeline-img"
                  src={item.image}
                  alt={item.title}
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="timeline-info">
                  <span className="timeline-year">{formatYear(item.year)}</span>
                  <h3 className="timeline-title">{item.title}</h3>
                  <p className="timeline-description">{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Actions ── */}
      <div className="result-actions">
        <button className="btn-share" onClick={handleShare}>
          Share Results 📤
        </button>
        <p className="tomorrow-note">Come back tomorrow for a new puzzle! 📅</p>
      </div>
    </div>
  );
}
