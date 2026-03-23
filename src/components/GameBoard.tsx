import { useState, useRef } from 'react';
import type { Item } from '../types';
import WikimediaImage from './WikimediaImage';

interface GameBoardProps {
  items: Item[];
  onSubmit: (orderedItems: Item[]) => void;
}

interface DropZoneProps {
  isActive: boolean;
  isDragging: boolean;
  onDragEnter: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
}

function DropZone({ isActive, isDragging, onDragEnter, onDragOver, onDrop }: DropZoneProps) {
  return (
    <div
      className={[
        'drop-zone',
        isDragging ? 'drop-zone--dragging' : '',
        isActive ? 'drop-zone--active' : '',
      ].filter(Boolean).join(' ')}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="drop-zone-indicator" />
    </div>
  );
}

export default function GameBoard({ items, onSubmit }: GameBoardProps) {
  const [cards, setCards] = useState<Item[]>(items);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [activeDropZone, setActiveDropZone] = useState<number | null>(null);

  // Touch drag state
  const touchDragIndex = useRef<number | null>(null);
  const touchActiveDropZone = useRef<number | null>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);

  const reorderByDropZone = (from: number, dropZoneIndex: number) => {
    const next = [...cards];
    const [moved] = next.splice(from, 1);
    // After removing the dragged item, adjust insertion index if needed
    const insertAt = dropZoneIndex > from ? dropZoneIndex - 1 : dropZoneIndex;
    next.splice(insertAt, 0, moved);
    setCards(next);
  };

  // ── HTML5 Drag & Drop ─────────────────────────────────
  const onDragStart = (i: number) => {
    setDraggingIndex(i);
  };

  const onDragEnd = () => {
    setDraggingIndex(null);
    setActiveDropZone(null);
  };

  const onDropZoneDragEnter = (i: number) => {
    setActiveDropZone(i);
  };

  const onDropZoneDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDropZoneDrop = (i: number) => {
    if (draggingIndex !== null) {
      reorderByDropZone(draggingIndex, i);
    }
    setDraggingIndex(null);
    setActiveDropZone(null);
  };

  // Compute the drop zone index from cursor position relative to the card's midpoint.
  const getDropZoneFromCardEvent = (e: React.DragEvent, cardIndex: number): number => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const isVertical = window.innerWidth < 640;
    return isVertical
      ? (e.clientY < rect.top + rect.height / 2 ? cardIndex : cardIndex + 1)
      : (e.clientX < rect.left + rect.width / 2 ? cardIndex : cardIndex + 1);
  };

  // Update active drop zone while dragging over a card based on which half the cursor is in.
  const onCardDragOver = (e: React.DragEvent, cardIndex: number) => {
    e.preventDefault();
    setActiveDropZone(getDropZoneFromCardEvent(e, cardIndex));
  };

  // Handle a drop event that lands on the card body (not the drop zone element).
  const onCardDrop = (e: React.DragEvent, cardIndex: number) => {
    e.preventDefault();
    if (draggingIndex !== null) {
      reorderByDropZone(draggingIndex, getDropZoneFromCardEvent(e, cardIndex));
    }
    setDraggingIndex(null);
    setActiveDropZone(null);
  };

  // ── Touch drag & drop ─────────────────────────────────
  const getCardElements = () =>
    Array.from(document.querySelectorAll<HTMLElement>('.card'));

  // Compute which drop zone index best matches a touch point by finding
  // which card's midpoint the touch crosses.
  const getDropZoneFromPoint = (x: number, y: number): number => {
    const els = getCardElements();
    if (els.length === 0) return 0;
    const isVertical = window.innerWidth < 640;
    if (isVertical) {
      for (let i = 0; i < els.length; i++) {
        const r = els[i].getBoundingClientRect();
        if (y < r.top + r.height / 2) return i;
      }
    } else {
      for (let i = 0; i < els.length; i++) {
        const r = els[i].getBoundingClientRect();
        if (x < r.left + r.width / 2) return i;
      }
    }
    return els.length;
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
    const dzIdx = getDropZoneFromPoint(t.clientX, t.clientY);
    touchActiveDropZone.current = dzIdx;
    setActiveDropZone(dzIdx);
  };

  const onTouchEnd = () => {
    removeGhost();
    const from = touchDragIndex.current;
    const dzIdx = touchActiveDropZone.current;
    if (from !== null && dzIdx !== null) {
      reorderByDropZone(from, dzIdx);
    }
    touchDragIndex.current = null;
    touchActiveDropZone.current = null;
    setDraggingIndex(null);
    setActiveDropZone(null);
  };

  const isDragging = draggingIndex !== null;

  return (
    <div className="game-board">
      <p className="instruction">Drag the cards into chronological order (oldest → newest)</p>
      <div className="cards-container">
        <DropZone
          isActive={activeDropZone === 0 && isDragging}
          isDragging={isDragging}
          onDragEnter={() => onDropZoneDragEnter(0)}
          onDragOver={onDropZoneDragOver}
          onDrop={() => onDropZoneDrop(0)}
        />
        {cards.map((item, i) => (
          <div key={item.id} className="drop-zone-group">
            <div
              className={[
                'card',
                draggingIndex === i ? 'dragging' : '',
              ].filter(Boolean).join(' ')}
              draggable
              onDragStart={() => onDragStart(i)}
              onDragEnd={onDragEnd}
              onDragOver={(e) => onCardDragOver(e, i)}
              onDrop={(e) => onCardDrop(e, i)}
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
            <DropZone
              isActive={activeDropZone === i + 1 && isDragging}
              isDragging={isDragging}
              onDragEnter={() => onDropZoneDragEnter(i + 1)}
              onDragOver={onDropZoneDragOver}
              onDrop={() => onDropZoneDrop(i + 1)}
            />
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
