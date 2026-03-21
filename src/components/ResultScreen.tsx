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
  const { score, pairs, userOrder, correctOrder } = result;
  const tier = getTierLabel(score);
  const correctCount = pairs.filter((p) => p.correct).length;
  const maxStreak = pairs.reduce((max, p) => Math.max(max, p.streakAtThisPoint), 0);

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
        <div className="score-stats">
          <span className="score-pairs-badge">
            {correctCount}/{pairs.length} pairs correct
          </span>
          {maxStreak >= 2 && (
            <span className="score-streak-badge">
              Best streak: {maxStreak} 🔥
            </span>
          )}
        </div>
      </div>

      {/* ── Timeline Comparison ── */}
      <div className="timelines-comparison">
        {/* User's timeline */}
        <section className="timeline-col">
          <h2 className="timeline-col-heading your-heading">Your Order</h2>
          <div className="result-timeline">
            {userOrder.map((item, i) => {
              const pair = i < pairs.length ? pairs[i] : null;
              return (
                <div key={item.id} className="result-timeline-group">
                  <div className="result-item">
                    <span className="result-item-rank">{i + 1}</span>
                    <img
                      className="result-item-img"
                      src={item.image}
                      alt={item.title}
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div className="result-item-info">
                      <span className="result-item-year">{formatYear(item.year)}</span>
                      <span className="result-item-title">{item.title}</span>
                    </div>
                  </div>
                  {pair && (
                    <div className={`result-pair-connector ${pair.correct ? 'connector-correct' : 'connector-wrong'}`}>
                      <span className="connector-icon">{pair.correct ? '✅' : '❌'}</span>
                      {pair.correct ? (
                        <span className="connector-points">
                          +{pair.points} pt{pair.points !== 1 ? 's' : ''}
                          {pair.streakAtThisPoint >= 2 && (
                            <span className="connector-streak"> 🔥×{pair.streakAtThisPoint}</span>
                          )}
                        </span>
                      ) : (
                        <span className="connector-wrong-label">Wrong order</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="scoring-note">
            💡 <strong>How points work:</strong> Each correct consecutive pair earns <strong>1 base point</strong>, plus <strong>+1 per streak level</strong> (2 correct in a row = +2, three in a row = +3, etc.)
          </div>
        </section>

        {/* Correct timeline */}
        <section className="timeline-col">
          <h2 className="timeline-col-heading correct-heading">Correct Order</h2>
          <div className="result-timeline">
            {correctOrder.map((item, i) => (
              <div key={item.id} className="result-timeline-group">
                <div className="result-item result-item-correct">
                  <span className="result-item-rank correct-rank">{i + 1}</span>
                  <img
                    className="result-item-img"
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="result-item-info">
                    <span className="result-item-year result-item-year-correct">{formatYear(item.year)}</span>
                    <span className="result-item-title">{item.title}</span>
                    <span className="result-item-desc">{item.description}</span>
                  </div>
                </div>
                {i < correctOrder.length - 1 && (
                  <div className="result-pair-connector connector-neutral">
                    <span className="connector-icon">⬇️</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

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
