export interface Item {
  id: string;
  title: string;
  year: number;
  image: string;
  description: string;
  wikipedia?: string;
  /** Set to true by the enrich script when the image URL fails validation. */
  image_broken?: boolean;
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
