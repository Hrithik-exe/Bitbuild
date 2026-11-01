/* Shared, non-reactive scroll story state read by the 3D world every frame. */

export interface StoryState {
  /** Continuous chapter value 0..4 (integer = chapter anchor, fraction = progress through it). */
  p: number;
  /** 0..1 progress through the Journey (chapter 03) camera flight. */
  j: number;
  /** 0..1 progress of the "Idea" collapse (chapter 01). */
  idea: number;
  /** Normalised pointer -1..1. */
  mx: number;
  my: number;
  /** 0..1 intro reveal (loader finished). */
  reveal: number;
  /** Increments to trigger a particle burst. */
  burst: number;
  /** Which journey beat is active: 0 skill tree, 1 guides, 2 errors, 3 wins. */
  beat: number;
}

export function createStory(): StoryState {
  return { p: 0, j: 0, idea: 0, mx: 0, my: 0, reveal: 0, burst: 0, beat: 0 };
}

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const smooth = (v: number) => {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
};
