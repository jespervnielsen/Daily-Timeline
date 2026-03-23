import items from '../data/items.json';
import type { Item } from '../types';

const allItems: Item[] = items as Item[];

function hashDate(dateStr: string): number {
  return dateStr.split('').reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) | 0, 0);
}

function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = ((s * 1664525 + 1013904223) >>> 0);
    return s / 0xFFFFFFFF;
  };
}

function selectFiveUniqueYears(rng: () => number): Item[] {
  const shuffled = allItems.filter(item => !item.image_broken);
  // Fisher-Yates shuffle with seeded rng
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const selected: Item[] = [];
  const usedYears = new Set<number>();

  for (const item of shuffled) {
    if (!usedYears.has(item.year)) {
      selected.push(item);
      usedYears.add(item.year);
    }
    if (selected.length === 5) break;
  }

  return selected;
}

export function getDailyItems(dateStr?: string): Item[] {
  const today = dateStr ?? new Date().toISOString().slice(0, 10);
  const seed = hashDate(today);
  const rng = seededRandom(seed);
  return selectFiveUniqueYears(rng);
}

export function getRandomItems(): Item[] {
  const seed = Math.floor(Math.random() * 0xFFFFFFFF);
  const rng = seededRandom(seed);
  return selectFiveUniqueYears(rng);
}
