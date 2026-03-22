export interface Item {
  id: string;
  title: string;
  year: number;
  image: string;
  description: string;
  wikipedia?: string;
}

export interface PairResult {
  itemA: Item;
  itemB: Item;
  correct: boolean;
  streakAtThisPoint: number;
}

export interface ScoreResult {
  score: number;
  pairs: PairResult[];
  rawScore: number;
  maxScore: number;
  userOrder: Item[];
  correctOrder: Item[];
}
