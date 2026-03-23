import type { ScoreResult, Item } from '../types';
import PairResultRow from './PairResultRow';
import WikimediaImage from './WikimediaImage';

interface ResultScreenProps {
  result: ScoreResult;
  date: string;
  isRandom?: boolean;
}

function getTierLabel(score: number): string {
  if (score >= 90) return 'Perfect! 🏆';
  if (score >= 70) return 'Strong! 💪';
  if (score >= 40) return 'Okay! 👍';
  return 'Keep trying! 😅';
}

function formatYear(year: number): string {
  if (year < 0) return `${Math.abs(year)} BC`;
  return `${year} AD`;
}

function getPositionHint(item: Item, userIndex: number, correctOrder: Item[]): string {
  const correctIndex = correctOrder.findIndex((c) => c.id === item.id);
  const diff = correctIndex - userIndex;
  if (diff === 0) return 'Perfect placement ✓';
  if (diff > 0) return `${diff} place${diff > 1 ? 's' : ''} too early`;
  return `${Math.abs(diff)} place${Math.abs(diff) > 1 ? 's' : ''} too late`;
}

export default function ResultScreen({ result, date, isRandom }: ResultScreenProps) {
  const { score, pairs, userOrder, correctOrder } = result;
  const tier = getTierLabel(score);
  const correctCount = pairs.filter((p) => p.correct).length;
  const maxStreak = pairs.reduce((max, p) => Math.max(max, p.streakAtThisPoint), 0);

  const handleShare = async () => {
    const itemEmojis = userOrder.map((item) => {
      const correctIndex = correctOrder.findIndex((c) => c.id === item.id);
      const userIndex = userOrder.findIndex((u) => u.id === item.id);
      const diff = Math.abs(correctIndex - userIndex);
      if (diff === 0) return '🟩';
      if (diff === 1) return '🟨';
      return '🟥';
    }).join('');

    let text: string;
    if (isRandom) {
      text = `Daily Timeline 🔀 Random\n${score} / 100 – ${tier}\n${itemEmojis}`;
    } else {
      // Use 'en-US' for a consistent share format across all users and locales
      const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      text = `Daily Timeline ${formattedDate}\n${score} / 100 – ${tier}\n${itemEmojis}\n${window.location.href}`;
    }
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
        <div className="score-denom">/ 100</div>
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
        <div className="result-actions">
          <button className="btn-share" onClick={handleShare}>
            Share Results 📤
          </button>
          <p className="tomorrow-note">Come back tomorrow for a new timeline! 📅</p>
        </div>
      </div>

      {/* ── Player Order with Pair Feedback ── */}
      <section className="player-order-section">
        <h2 className="section-heading your-order-heading">Your Order</h2>
        <div className="player-order-list">
          {userOrder.map((item, i) => {
            const pair = i < pairs.length ? pairs[i] : null;
            const positionHint = getPositionHint(item, i, correctOrder);
            const hintCorrect = positionHint.startsWith('Perfect');

            let earlierTitle: string | undefined;
            let laterTitle: string | undefined;
            let pairInCorrectOrder: boolean | undefined;
            if (pair) {
              const posA = correctOrder.findIndex((c) => c.id === pair.itemA.id);
              const posB = correctOrder.findIndex((c) => c.id === pair.itemB.id);
              // inCorrectOrder: user placed itemA before itemB, which IS the right
              // relative order – even if they are not consecutive in the answer.
              pairInCorrectOrder = posA < posB;
              [earlierTitle, laterTitle] =
                posA <= posB
                  ? [pair.itemA.title, pair.itemB.title]
                  : [pair.itemB.title, pair.itemA.title];
            }

            return (
              <div key={item.id} className="player-order-group">
                {/* Card */}
                <div className="result-card">
                  <WikimediaImage
                    className="result-card-img"
                    image={item.image}
                    alt={item.title}
                    width={100}
                  />
                  <div className="result-card-body">
                    <span className="result-card-year">{formatYear(item.year)}</span>
                    <span className="result-card-title">{item.title}</span>
                    <span className={`result-card-hint ${hintCorrect ? 'hint-correct' : 'hint-wrong'}`}>
                      {positionHint}
                    </span>
                  </div>
                </div>

                {/* Pair Result Row (between cards) */}
                {pair && (
                  <PairResultRow
                    isCorrect={pair.correct}
                    streak={pair.streakAtThisPoint}
                    earlierItemTitle={earlierTitle}
                    laterItemTitle={laterTitle}
                    inCorrectOrder={pairInCorrectOrder}
                  />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Correct Timeline (Reference) ── */}
      <section className="correct-timeline-section">
        <h2 className="section-heading correct-order-heading">Correct Order</h2>
        <div className="correct-timeline-list">
          {correctOrder.map((item, i) => (
            <div key={item.id} className="correct-timeline-group">
              <div className="correct-timeline-item">
                <WikimediaImage
                  className="correct-timeline-img"
                  image={item.image}
                  alt={item.title}
                  width={100}
                />
                <div className="correct-timeline-info">
                  <span className="correct-timeline-year">{formatYear(item.year)}</span>
                  <span className="correct-timeline-title">{item.title}</span>
                  {item.description && (
                    <span className="correct-timeline-desc">{item.description}</span>
                  )}
                  {item.wikipedia && (
                    <a
                      className="wiki-link"
                      href={item.wikipedia}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Read more ↗
                    </a>
                  )}
                </div>
              </div>
              {i < correctOrder.length - 1 && (
                <div className="correct-timeline-arrow">↓</div>
              )}
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
