import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export interface LeaderboardEntry {
  id: string;
  name: string;
  total: number;
  levels: number;
  day: string;
  difficulty?: string;
  at: number;
}

const STORE_PATH = path.join("/tmp", "labyrinth-of-riddles-scores.json");

let memoryScores: LeaderboardEntry[] | null = null;

function readScores(): LeaderboardEntry[] {
  if (memoryScores !== null) {
    return memoryScores;
  }
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        memoryScores = parsed;
        return memoryScores;
      }
    }
  } catch {
    // Fallback to in-memory store if filesystem is unavailable
  }
  memoryScores = [];
  return memoryScores;
}

function writeScores(scores: LeaderboardEntry[]): void {
  memoryScores = scores;
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(scores), "utf8");
  } catch {
    // Ignore write failure in read-only environments; memoryScores still holds data
  }
}

function sortAndFilterDay(scores: LeaderboardEntry[], day: string): LeaderboardEntry[] {
  return scores
    .filter((entry) => entry.day === day)
    .sort((a, b) => b.levels - a.levels || a.total - b.total)
    .slice(0, 10);
}

export async function GET(req: NextRequest) {
  const day = req.nextUrl.searchParams.get("day") || "";
  const scores = readScores();
  return NextResponse.json({
    scores: day ? sortAndFilterDay(scores, day) : [],
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = typeof body?.id === "string" ? body.id.trim().slice(0, 64) : "";
    const name =
      typeof body?.name === "string" && body.name.trim()
        ? body.name.trim().slice(0, 16)
        : "Wanderer";
    const day = typeof body?.day === "string" ? body.day.trim().slice(0, 16) : "";
    const difficulty =
      body?.difficulty === "easy" || body?.difficulty === "hard"
        ? body.difficulty
        : "medium";
    const levels = Number(body?.levels);
    const total = Number(body?.total);

    if (
      !id ||
      !day ||
      !Number.isFinite(levels) ||
      levels < 1 ||
      !Number.isFinite(total) ||
      total < 0
    ) {
      return NextResponse.json({ error: "Invalid score payload" }, { status: 400 });
    }

    const scores = readScores().filter((entry) => entry.day === day);
    const existingIdx = scores.findIndex((entry) => entry.id === id);

    if (existingIdx >= 0) {
      const prev = scores[existingIdx];
      const isBetter =
        levels > prev.levels || (levels === prev.levels && total < prev.total);
      if (isBetter) {
        scores[existingIdx] = {
          id,
          name,
          levels: Math.floor(levels),
          total: Math.round(total),
          day,
          difficulty,
          at: Date.now(),
        };
      } else if (prev.name !== name) {
        scores[existingIdx] = { ...prev, name };
      }
    } else {
      scores.push({
        id,
        name,
        levels: Math.floor(levels),
        total: Math.round(total),
        day,
        difficulty,
        at: Date.now(),
      });
    }

    writeScores(scores);

    return NextResponse.json({
      scores: sortAndFilterDay(scores, day),
    });
  } catch {
    return NextResponse.json({ error: "Malformed request" }, { status: 400 });
  }
}
