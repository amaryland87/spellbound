export enum Difficulty {
  EASY = 'EASY',
  HARD = 'HARD'
}

export interface PuzzleData {
  word: string;
  missingIndices: number[];
  hint: string;
}

export interface Choice {
  id: string;
  char: string;
}

export interface GameState {
  status: 'idle' | 'loading' | 'playing' | 'success' | 'error';
  puzzle: PuzzleData | null;
  imageUrl: string | null;
  choices: Choice[]; // The pool of 6 letters
  userAnswers: Record<number, string>; // Maps slot index -> Choice ID
  errorMessage?: string;
}

export interface LetterOption {
  char: string;
  index: number;
}
