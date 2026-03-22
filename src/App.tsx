import { useState, useEffect } from 'react';
import './App.css';
import GameBoard from './components/GameBoard';
import ResultScreen from './components/ResultScreen';
import { getDailyItems, getRandomItems } from './lib/getDailyItems';
import { calculateScore } from './lib/calculateScore';
import type { Item, ScoreResult } from './types';

type GameState = 'playing' | 'finished';

interface SavedGame {
  score: number;
  orderedItems: Item[];
}

const today = new Date().toISOString().slice(0, 10);
const STORAGE_KEY = `timeline_played_${today}`;

export default function App() {
  const [gameState, setGameState] = useState<GameState>('playing');
  const [currentItems, setCurrentItems] = useState<Item[]>(() => getDailyItems(today));
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [isRandom, setIsRandom] = useState(false);
  const [hasSaved, setHasSaved] = useState(!!localStorage.getItem(STORAGE_KEY));

  // On mount, check if today's puzzle was already played
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { orderedItems }: SavedGame = JSON.parse(saved);
        const dailyItems = getDailyItems(today);
        const correctOrder = [...dailyItems].sort((a, b) => a.year - b.year);
        const r = calculateScore(orderedItems, correctOrder);
        setCurrentItems(dailyItems);
        setResult(r);
        setGameState('finished');
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const handleSubmit = (orderedItems: Item[]) => {
    const correctOrder = [...currentItems].sort((a, b) => a.year - b.year);
    const r = calculateScore(orderedItems, correctOrder);
    setResult(r);
    setGameState('finished');

    if (!isRandom) {
      const toSave: SavedGame = { score: r.score, orderedItems };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      setHasSaved(true);
    }
  };

  const handleRandom = () => {
    const items = getRandomItems();
    setCurrentItems(items);
    setResult(null);
    setGameState('playing');
    setIsRandom(true);
  };

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setHasSaved(false);
    const items = getDailyItems(today);
    setCurrentItems(items);
    setResult(null);
    setGameState('playing');
    setIsRandom(false);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <h1 className="app-title">
            <span className="title-icon">📅</span>
            Daily Timeline
          </h1>
          <div className="header-actions">
            <button className="btn-secondary" onClick={handleRandom} title="Try 5 random events">
              🔀 Random
            </button>
            {hasSaved && (
              <button className="btn-secondary btn-reset" onClick={handleReset} title="Reset today's puzzle">
                🔄 Reset Today
              </button>
            )}
          </div>
        </div>
        <p className="app-subtitle">
          {isRandom
            ? 'Random mode — drag to sort these 5 events chronologically!'
            : `${today} — drag to sort these 5 events chronologically!`}
        </p>
      </header>

      <main className="app-main">
        {gameState === 'playing' && (
          <GameBoard items={currentItems} onSubmit={handleSubmit} />
        )}
        {gameState === 'finished' && result && (
          <ResultScreen result={result} date={today} isRandom={isRandom} />
        )}
      </main>

      <footer className="app-footer">
        <p>A new puzzle every day · Made with ❤️</p>
      </footer>
    </div>
  );
}
