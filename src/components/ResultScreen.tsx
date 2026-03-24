import type { ReactNode } from 'react';
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
  if (diff === 1) return '1 place too early';
  if (diff === -1) return '1 place too late';
  return '2+ places off';
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

      {/* ── Player Order with Position Hints ── */}
      <section className="player-order-section">
        <h2 className="section-heading your-order-heading">Your Order</h2>
        <div className="player-order-list">
          {userOrder.map((item, i) => {
            const positionHint = getPositionHint(item, i, correctOrder);
            const hintCorrect = positionHint.startsWith('Perfect');

            // Compute the pair between this item and the next in the user's order
            let pairRow: ReactNode = null;
            if (i < userOrder.length - 1) {
              const nextItem = userOrder[i + 1];
              const correctPosA = correctOrder.findIndex((c) => c.id === item.id);
              const correctPosB = correctOrder.findIndex((c) => c.id === nextItem.id);
              const isCorrectPair = correctPosA < correctPosB;
              const earlierItem = isCorrectPair ? item : nextItem;
              const laterItem = isCorrectPair ? nextItem : item;
              pairRow = (
                <PairResultRow
                  isCorrect={isCorrectPair}
                  earlierItemTitle={earlierItem.title}
                  laterItemTitle={laterItem.title}
                />
              );
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
                {pairRow}
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
                <div className="correct-timeline-connector" />
              )}
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
