import { createRng, selectRiddlesForLevel, type Riddle } from "./riddles";

export type Difficulty = "easy" | "medium" | "hard";

export const DIFFICULTY_SETTINGS: Record<
  Difficulty,
  {
    label: string;
    baseSize: number;
    maxSize: number;
    baseGates: number;
    maxGates: number;
    summary: string;
  }
> = {
  easy: {
    label: "Easy",
    baseSize: 7,
    maxSize: 15,
    baseGates: 1,
    maxGates: 5,
    summary: "7×7 to 15×15 mazes · 1–5 gates · Simple everyday riddles",
  },
  medium: {
    label: "Standard",
    baseSize: 9,
    maxSize: 21,
    baseGates: 2,
    maxGates: 8,
    summary: "9×9 to 21×21 mazes · 2–8 gates · Clever wordplay riddles",
  },
  hard: {
    label: "Hard",
    baseSize: 13,
    maxSize: 25,
    baseGates: 3,
    maxGates: 10,
    summary: "13×13 to 25×25 mazes · 3–10 gates · Cryptic poetic riddles",
  },
};

export const DIRS: ReadonlyArray<readonly [number, number, number, number]> = [
  [0, -1, 1, 4], // 0: Up
  [1, 0, 2, 8],  // 1: Right
  [0, 1, 4, 1],  // 2: Down
  [-1, 0, 8, 2], // 3: Left
];

export interface Gate {
  riddle: Riddle;
  ok: boolean;
  hint: boolean;
}

export interface MazeData {
  levelIndex: number;
  difficulty: Difficulty;
  n: number;
  open: number[];
  gates: Record<number, Gate>;
  end: number;
}

export function getDayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function getMazeSpecs(
  levelIndex: number,
  difficulty: Difficulty
): { n: number; gateCount: number } {
  const cfg = DIFFICULTY_SETTINGS[difficulty];
  const n = Math.min(cfg.baseSize + 2 * levelIndex, cfg.maxSize);
  const gateCount = Math.min(
    cfg.baseGates + Math.floor((levelIndex + 1) / 2),
    cfg.maxGates
  );
  return { n, gateCount };
}

export function getLevelTimeLimit(
  levelIndex: number,
  difficulty: Difficulty
): number {
  if (difficulty === "easy") {
    return Math.min(90 + levelIndex * 20, 210);
  }
  if (difficulty === "hard") {
    return Math.min(120 + levelIndex * 25, 300);
  }
  return Math.min(105 + levelIndex * 20, 240);
}

export function buildMaze(
  levelIndex: number,
  dayKey: string,
  difficulty: Difficulty = "medium",
  customRiddles?: Riddle[],
  usedRiddleIds?: Set<string>
): MazeData {
  const { n, gateCount } = getMazeSpecs(levelIndex, difficulty);
  const r = createRng(hashString(`${dayKey}-${difficulty}-L${levelIndex}`));
  const open = new Array<number>(n * n).fill(0);
  const vis: Record<number, boolean> = { 0: true };
  const st: number[] = [0];

  while (st.length > 0) {
    const c = st[st.length - 1];
    const x = c % n;
    const y = (c / n) | 0;
    const opts: number[] = [];

    for (let d = 0; d < 4; d++) {
      const nx = x + DIRS[d][0];
      const ny = y + DIRS[d][1];
      if (nx >= 0 && ny >= 0 && nx < n && ny < n && !vis[ny * n + nx]) {
        opts.push(d);
      }
    }

    if (opts.length === 0) {
      st.pop();
      continue;
    }

    const d2 = opts[Math.floor(r() * opts.length)];
    const nc = (y + DIRS[d2][1]) * n + x + DIRS[d2][0];
    open[c] |= DIRS[d2][2];
    open[nc] |= DIRS[d2][3];
    vis[nc] = true;
    st.push(nc);
  }

  const prev: Record<number, number> = { 0: -1 };
  const q: number[] = [0];
  while (q.length > 0) {
    const u = q.shift()!;
    if (u === n * n - 1) break;
    for (let k = 0; k < 4; k++) {
      if (open[u] & DIRS[k][2]) {
        const v = (((u / n) | 0) + DIRS[k][1]) * n + (u % n) + DIRS[k][0];
        if (!(v in prev)) {
          prev[v] = u;
          q.push(v);
        }
      }
    }
  }

  const path: number[] = [];
  let p = n * n - 1;
  while (p !== -1) {
    path.unshift(p);
    p = prev[p];
  }

  const levelRiddles =
    customRiddles && customRiddles.length >= gateCount
      ? customRiddles.slice(0, gateCount)
      : selectRiddlesForLevel(
          levelIndex,
          gateCount,
          hashString(`${dayKey}-${difficulty}-R${levelIndex}`),
          usedRiddleIds
        );

  const gates: Record<number, Gate> = {};
  for (let i = 0; i < gateCount; i++) {
    const idx = Math.floor((path.length * (i + 1)) / (gateCount + 1));
    gates[path[idx]] = {
      riddle: levelRiddles[i],
      ok: false,
      hint: false,
    };
  }

  return {
    levelIndex,
    difficulty,
    n,
    open,
    gates,
    end: n * n - 1,
  };
}

export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(s / 60);
  const rem = s % 60;
  return `${mins}:${rem < 10 ? "0" : ""}${rem}`;
}
