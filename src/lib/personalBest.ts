import type { Difficulty } from "./maze";

export interface DifficultyPersonalBest {
  fastestMazeSeconds: number;
  fastestMazeLevel: number;
  bestRunLevels: number;
  bestRunTotalSeconds: number;
  updatedAt: number;
}

export type PersonalBestsMap = Partial<Record<Difficulty, DifficultyPersonalBest>>;

const STORAGE_KEY = "lr-personal-bests";
const VALID_DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

function isValidRecord(value: unknown): value is DifficultyPersonalBest {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.fastestMazeSeconds === "number" &&
    Number.isFinite(v.fastestMazeSeconds) &&
    v.fastestMazeSeconds >= 0 &&
    typeof v.fastestMazeLevel === "number" &&
    Number.isFinite(v.fastestMazeLevel) &&
    v.fastestMazeLevel >= 1 &&
    typeof v.bestRunLevels === "number" &&
    Number.isFinite(v.bestRunLevels) &&
    v.bestRunLevels >= 1 &&
    typeof v.bestRunTotalSeconds === "number" &&
    Number.isFinite(v.bestRunTotalSeconds) &&
    v.bestRunTotalSeconds >= 0
  );
}

export function loadPersonalBests(): PersonalBestsMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return {};

    const clean: PersonalBestsMap = {};
    for (const diff of VALID_DIFFICULTIES) {
      if (isValidRecord(parsed[diff])) {
        clean[diff] = parsed[diff];
      }
    }
    return clean;
  } catch {
    return {};
  }
}

export function savePersonalBests(bests: PersonalBestsMap): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bests));
  } catch {
    // Ignore storage quota or privacy-mode errors
  }
}

export function recordMazeCompletion(
  difficulty: Difficulty,
  levelNumber: number,
  mazeSeconds: number,
  runLevelsCleared: number,
  runTotalSeconds: number
): {
  bests: PersonalBestsMap;
  isNewFastestMaze: boolean;
  isNewBestRun: boolean;
} {
  const roundedMaze = Math.max(0, Math.round(mazeSeconds));
  const roundedRunTotal = Math.max(0, Math.round(runTotalSeconds));
  const current = loadPersonalBests();
  const prev = current[difficulty];

  const isNewFastestMaze = !prev || roundedMaze < prev.fastestMazeSeconds;
  const isNewBestRun =
    !prev ||
    runLevelsCleared > prev.bestRunLevels ||
    (runLevelsCleared === prev.bestRunLevels &&
      roundedRunTotal < prev.bestRunTotalSeconds);

  const nextRecord: DifficultyPersonalBest = {
    fastestMazeSeconds: isNewFastestMaze
      ? roundedMaze
      : prev.fastestMazeSeconds,
    fastestMazeLevel: isNewFastestMaze ? levelNumber : prev.fastestMazeLevel,
    bestRunLevels: isNewBestRun ? runLevelsCleared : prev.bestRunLevels,
    bestRunTotalSeconds: isNewBestRun
      ? roundedRunTotal
      : prev.bestRunTotalSeconds,
    updatedAt: Date.now(),
  };

  const nextBests: PersonalBestsMap = {
    ...current,
    [difficulty]: nextRecord,
  };

  savePersonalBests(nextBests);

  return {
    bests: nextBests,
    isNewFastestMaze,
    isNewBestRun,
  };
}

export function clearPersonalBests(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}
