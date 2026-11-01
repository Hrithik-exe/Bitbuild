export type Language = 'javascript' | 'python' | 'cpp';

export interface LessonNote {
  title: string;
  body: string[];
}

export interface DialogueLine {
  speaker: 'mentorA' | 'mentorB';
  text: string;
  trigger?: 'onEnter' | 'onError' | 'onPass' | 'onRetry';
  blipPitch?: [number, number]; // [minFreq, maxFreq]
}

export interface LessonPiece {
  id: string;
  num: string;
  label: string;
  note: LessonNote;
  code: Record<Language, string>;
  mentorLines: DialogueLine[];
}

export interface Lesson {
  id: string;
  num: string;
  label: string;
  chapter: string;
  xp: number;
  note: LessonNote;
  code: Record<Language, string>;
  mentorLines: DialogueLine[];
  pieces?: LessonPiece[];
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  onGround: boolean;
  enemyX: number;
  enemyY: number;
  enemyRadius?: number;
  color?: string;
  coins: { x: number; y: number; collected: boolean }[];
  score: number;
}

export interface WorldConfig {
  width: number;
  height: number;
  groundY: number;
  platform?: { x: number; y: number; w: number; h: number } | null;
  goal?: { x: number; y: number; w: number; h: number } | null;
}

export interface ReadoutData {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fps: number;
}

export interface Chapter {
  id: string;
  title: string;
  description: string;
  lessons: string[];
  capstoneId: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface UserProgressData {
  currentXp: number;
  completedLessonIds: string[];
  completedPieceIds: string[];
  currentLessonId: string;
  codeDrafts?: Record<string, Partial<Record<Language, string>>>;
}

export interface ErrorLineInfo {
  line: number;
  column?: number;
  message: string;
}

export interface FrameRateRateResult {
  fps: number;
  displacement: number;
  dt: number;
}

export interface BenchmarkResult {
  passed: boolean;
  rates: FrameRateRateResult[];
  divergencePercent: number;
  summary: string;
  recommendation: string;
}

export interface AiDiagnosticResult {
  issue: string;
  explanation: string;
  recommendation: string;
  suggestedCode: string;
  isAiGenerated: boolean;
  mode: string;
}
