import { useState, useRef } from 'react';
import type { Item } from '../types';
import WikimediaImage from './WikimediaImage';

interface GameBoardProps {
  items: Item[];
  onSubmit: (orderedItems: Item[]) => void;
}

export default function GameBoard({ items, onSubmit }: GameBoardProps) {
  const [cards, setCards] = useState<Item[]>(items);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  // Touch drag state
  const touchDragIndex = useRef<number | null>(null);
  const touchOverIndex = useRef<number | null>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);

  const reorder = (from: number, to: number) => {
    if (from === to) return;
    const next = [...cards];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setCards(next);
  };

  // ── HTML5 Drag & Drop ─────────────────────────────────────
  const onDragStart = (i: number) => {
    setDraggingIndex(i);
  };

  const onDragEnter = (i: number) => {
    setOverIndex(i);
  };

  const onDragEnd = () => {
    if (draggingIndex !== null && overIndex !== null) {
      reorder(draggingIndex, overIndex);
    }
    setDraggingIndex(null);
    setOverIndex(null);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // ── Touch drag & drop ─────────────────────────────────────
  const getCardElements = () =>
    Array.from(document.querySelectorAll<HTMLElement>('.card'));

  const getIndexFromPoint = (x: number, y: number): number | null => {
    const els = getCardElements();
    for (let i = 0; i < els.length; i++) {
      const r = els[i].getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return i;
    }
    return null;
  };

  const createGhost = (el: HTMLElement, x: number, y: number) => {
    const clone = el.cloneNode(true) as HTMLDivElement;
    const rect = el.getBoundingClientRect();
    clone.style.cssText = `
      position: fixed;
      left: ${rect.left}px;
      top: ${rect.top}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      opacity: 0.75;
      pointer-events: none;
      z-index: 9999;
      transform: scale(1.05);
      transition: none;
      border-radius: 12px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.5);
    `;
    clone.dataset.ghostOffsetX = String(x - rect.left);
    clone.dataset.ghostOffsetY = String(y - rect.top);
    document.body.appendChild(clone);
    ghostRef.current = clone;
  };

  const moveGhost = (x: number, y: number) => {
    const g = ghostRef.current;
    if (!g) return;
    const ox = Number(g.dataset.ghostOffsetX);
    const oy = Number(g.dataset.ghostOffsetY);
    g.style.left = `${x - ox}px`;
    g.style.top = `${y - oy}px`;
  };

  const removeGhost = () => {
    ghostRef.current?.remove();
    ghostRef.current = null;
  };

  const onTouchStart = (e: React.TouchEvent, i: number) => {
    e.preventDefault();
    touchDragIndex.current = i;
    const t = e.touches[0];
    const cardEl = getCardElements()[i];
    if (cardEl) createGhost(cardEl, t.clientX, t.clientY);
    setDraggingIndex(i);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const t = e.touches[0];
    moveGhost(t.clientX, t.clientY);
    const idx = getIndexFromPoint(t.clientX, t.clientY);
    if (idx !== null) {
      touchOverIndex.current = idx;
      setOverIndex(idx);
    }
  };

  const onTouchEnd = () => {
    removeGhost();
    const from = touchDragIndex.current;
    const to = touchOverIndex.current;
    if (from !== null && to !== null) {
      reorder(from, to);
    }
    touchDragIndex.current = null;
    touchOverIndex.current = null;
    setDraggingIndex(null);
    setOverIndex(null);
  };

  return (
    <div className="game-board">
      <p className="instruction">Drag the cards into chronological order (oldest → newest)</p>
      <div className="cards-container">
        {cards.map((item, i) => (
          <div
            key={item.id}
            className={[
              'card',
              draggingIndex === i ? 'dragging' : '',
              overIndex === i && draggingIndex !== i ? 'drag-over' : '',
            ].filter(Boolean).join(' ')}
            draggable
            onDragStart={() => onDragStart(i)}
            onDragEnter={() => onDragEnter(i)}
            onDragEnd={onDragEnd}
            onDragOver={onDragOver}
            onTouchStart={(e) => onTouchStart(e, i)}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div className="card-rank">{i + 1}</div>
            <WikimediaImage
              className="card-image"
              image={item.image}
              alt={item.title}
              width={320}
              fallbackSrc="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Camponotus_flavomarginatus_ant.jpg/320px-Camponotus_flavomarginatus_ant.jpg"
            />
            <div className="card-body">
              <h3 className="card-title">{item.title}</h3>
              <p className="card-hint">🕰️ When did this happen?</p>
            </div>
            <div className="card-drag-handle" aria-hidden="true">⠿</div>
          </div>
        ))}
      </div>
      <div className="submit-area">
        <button className="btn-submit" onClick={() => onSubmit(cards)}>
          Check Answer ✓
        </button>
      </div>
    </div>
  );
}
