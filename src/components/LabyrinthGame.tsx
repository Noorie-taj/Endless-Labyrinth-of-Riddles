"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  buildMaze,
  DIFFICULTY_SETTINGS,
  DIRS,
  formatTime,
  getDayKey,
  getLevelTimeLimit,
  getMazeSpecs,
  type Difficulty,
  type MazeData,
} from "@/lib/maze";
import { getHintText, isAnswerCorrect, type Riddle } from "@/lib/riddles";
import {
  clearPersonalBests,
  loadPersonalBests,
  recordMazeCompletion,
  type PersonalBestsMap,
} from "@/lib/personalBest";
import {
  playCountdownTickSound,
  playGateOpenSound,
  playLevelCompleteSound,
  playMoveSound,
  playRiddleSolvedSound,
  playTimeUpSound,
  playWallBumpSound,
  playWrongAnswerSound,
  setSoundMuted,
} from "@/lib/sound";

interface LeaderboardEntry {
  id: string;
  name: string;
  total: number;
  levels: number;
  day: string;
  difficulty?: string;
}

type ScreenState = "start" | "playing";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
  shape: "circle" | "diamond";
}

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

export default function LabyrinthGame() {
  const [screen, setScreen] = useState<ScreenState>("start");
  const [playerName, setPlayerName] = useState("Wanderer");
  const [nameInput, setNameInput] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [uid, setUid] = useState<string>("");
  const [dayKey, setDayKey] = useState<string>(() => getDayKey());

  const [levelIndex, setLevelIndex] = useState(0);
  const [gridSize, setGridSize] = useState(9);
  const [penalty, setPenalty] = useState(0);
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const [timeLimit, setTimeLimit] = useState(105);
  const [remainingSeconds, setRemainingSeconds] = useState(105);
  const [timedOut, setTimedOut] = useState(false);
  const [clearedInRun, setClearedInRun] = useState(0);
  const [runTotalSeconds, setRunTotalSeconds] = useState(0);
  const [loadingRiddles, setLoadingRiddles] = useState(false);
  const [riddleLoadError, setRiddleLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; tone: "good" | "bad" | "mute" }>({
    text: "",
    tone: "mute",
  });

  // Gate riddle modal state
  const [activeGatePos, setActiveGatePos] = useState<number | null>(null);
  const [riddleAnswer, setRiddleAnswer] = useState("");
  const [riddleMsg, setRiddleMsg] = useState<{ text: string; tone: "good" | "bad" | "mute" }>({
    text: "",
    tone: "mute",
  });
  const [shakeModal, setShakeModal] = useState(false);

  // Leaderboard & Personal Best state
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lbNote, setLbNote] = useState("");
  const [personalBests, setPersonalBests] = useState<PersonalBestsMap>({});
  const [muted, setMuted] = useState(false);

  // Mutable game refs for zero-latency canvas rendering & keyboard handling
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const answerInputRef = useRef<HTMLInputElement | null>(null);
  const mazeRef = useRef<MazeData | null>(null);
  const posRef = useRef(0);
  const seenRef = useRef<Record<number, boolean>>({ 0: true });
  const t0Ref = useRef(0);
  const penaltyRef = useRef(0);
  const timeLimitRef = useRef(105);
  const lastTickSecondRef = useRef<number | null>(null);
  const timesRef = useRef<number[]>([]);
  const runningRef = useRef(false);
  const gatePosRef = useRef<number | null>(null);
  const difficultyRef = useRef<Difficulty>("medium");
  const usedRiddlesRef = useRef<Set<string>>(new Set());
  const usedAnswersRef = useRef<string[]>([]);
  const currentLevelRiddlesRef = useRef<Riddle[] | undefined>(undefined);
  const levelRequestIdRef = useRef(0);
  const canvasWidthRef = useRef(520);
  const particlesRef = useRef<Particle[]>([]);
  const particleRafRef = useRef<number | null>(null);
  const lastParticleTimeRef = useRef(0);

  const getCssVar = useCallback((name: string) => {
    if (typeof window === "undefined") return "#0a1f44";
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }, []);

  const drawMaze = useCallback(() => {
    const cv = canvasRef.current;
    const m = mazeRef.current;
    if (!cv || !m) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const w = canvasWidthRef.current;
    const n = m.n;
    const c = w / n;
    const pos = posRef.current;
    const px = pos % n;
    const py = (pos / n) | 0;

    ctx.fillStyle = getCssVar("--fog");
    ctx.fillRect(0, 0, w, w);
    ctx.lineCap = "round";
    ctx.lineWidth = Math.max(2, c * 0.09);

    for (let i = 0; i < n * n; i++) {
      const x = i % n;
      const y = (i / n) | 0;
      const lit = Math.abs(x - px) + Math.abs(y - py) <= 2;
      const seen = seenRef.current[i];

      if (!lit && !seen) {
        if (i === m.end) {
          ctx.font = `${Math.floor(c * 0.6)}px serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("🚩", x * c + c / 2, y * c + c / 2);
        }
        continue;
      }

      ctx.fillStyle = getCssVar(lit ? "--lit" : "--seen");
      ctx.fillRect(x * c, y * c, c, c);

      ctx.strokeStyle = getCssVar("--wall");
      ctx.globalAlpha = lit ? 1 : 0.45;
      ctx.beginPath();
      const o = m.open[i];
      if (!(o & 1)) {
        ctx.moveTo(x * c, y * c);
        ctx.lineTo((x + 1) * c, y * c);
      }
      if (!(o & 2)) {
        ctx.moveTo((x + 1) * c, y * c);
        ctx.lineTo((x + 1) * c, (y + 1) * c);
      }
      if (!(o & 4)) {
        ctx.moveTo(x * c, (y + 1) * c);
        ctx.lineTo((x + 1) * c, (y + 1) * c);
      }
      if (!(o & 8)) {
        ctx.moveTo(x * c, y * c);
        ctx.lineTo(x * c, (y + 1) * c);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.font = `${Math.floor(c * 0.6)}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const g = m.gates[i];
      if (g) {
        ctx.fillText(g.ok ? "🔓" : "🔒", x * c + c / 2, y * c + c / 2);
      }
      if (i === m.end) {
        ctx.fillText("🚩", x * c + c / 2, y * c + c / 2);
      }
    }

    ctx.fillStyle = getCssVar("--acc");
    ctx.beginPath();
    ctx.arc(px * c + c / 2, py * c + c / 2, c * 0.3, 0, Math.PI * 2);
    ctx.fill();

    if (particlesRef.current.length > 0) {
      ctx.save();
      for (const p of particlesRef.current) {
        const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        if (p.shape === "diamond") {
          const r = p.radius * (0.55 + 0.45 * alpha);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - r);
          ctx.lineTo(p.x + r, p.y);
          ctx.lineTo(p.x, p.y + r);
          ctx.lineTo(p.x - r, p.y);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * (0.4 + 0.6 * alpha), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }
  }, [getCssVar]);

  const stopParticleLoop = useCallback(() => {
    if (particleRafRef.current !== null) {
      cancelAnimationFrame(particleRafRef.current);
      particleRafRef.current = null;
    }
    particlesRef.current = [];
  }, []);

  const startParticleLoop = useCallback(() => {
    if (particleRafRef.current !== null) return;
    lastParticleTimeRef.current = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastParticleTimeRef.current) / 1000));
      lastParticleTimeRef.current = now;

      const next: Particle[] = [];
      for (const p of particlesRef.current) {
        p.life -= dt;
        if (p.life <= 0) continue;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.92;
        p.vy = p.vy * 0.92 + (p.shape === "diamond" ? 65 * dt : 0);
        next.push(p);
      }
      particlesRef.current = next;
      drawMaze();

      if (next.length > 0) {
        particleRafRef.current = requestAnimationFrame(tick);
      } else {
        particleRafRef.current = null;
      }
    };

    particleRafRef.current = requestAnimationFrame(tick);
  }, [drawMaze]);

  const prefersReducedMotion = useCallback(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const spawnWallParticles = useCallback(
    (cellIndex: number, dir: number) => {
      if (prefersReducedMotion()) return;
      const m = mazeRef.current;
      if (!m) return;

      const w = canvasWidthRef.current;
      const c = w / m.n;
      const x = cellIndex % m.n;
      const y = (cellIndex / m.n) | 0;
      const dx = DIRS[dir][0];
      const dy = DIRS[dir][1];

      const impactX = x * c + c / 2 + dx * c * 0.44;
      const impactY = y * c + c / 2 + dy * c * 0.44;
      const baseAngle = Math.atan2(-dy, -dx);
      const colors = ["#c0392b", "#1f5fd6", "#5a6b8c", "#dfe6f5"];

      for (let i = 0; i < 12; i++) {
        const angle = baseAngle + (Math.random() - 0.5) * 1.9;
        const speed = c * (1.1 + Math.random() * 1.8);
        const maxLife = 0.26 + Math.random() * 0.14;
        particlesRef.current.push({
          x: impactX + (Math.random() - 0.5) * c * 0.16,
          y: impactY + (Math.random() - 0.5) * c * 0.16,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: Math.max(2, c * (0.06 + Math.random() * 0.05)),
          color: colors[i % colors.length],
          life: maxLife,
          maxLife,
          shape: "circle",
        });
      }

      startParticleLoop();
    },
    [prefersReducedMotion, startParticleLoop]
  );

  const spawnSolveParticles = useCallback(
    (cellIndex: number) => {
      if (prefersReducedMotion()) return;
      const m = mazeRef.current;
      if (!m) return;

      const w = canvasWidthRef.current;
      const c = w / m.n;
      const x = cellIndex % m.n;
      const y = (cellIndex / m.n) | 0;
      const cx = x * c + c / 2;
      const cy = y * c + c / 2;
      const colors = ["#1b7f4c", "#f59e0b", "#1f5fd6", "#10b981", "#ffffff"];

      for (let i = 0; i < 24; i++) {
        const angle = (Math.PI * 2 * i) / 24 + (Math.random() - 0.5) * 0.35;
        const speed = c * (1.4 + Math.random() * 2.4);
        const maxLife = 0.45 + Math.random() * 0.25;
        particlesRef.current.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - c * 0.35,
          radius: Math.max(2.5, c * (0.08 + Math.random() * 0.07)),
          color: colors[i % colors.length],
          life: maxLife,
          maxLife,
          shape: i % 2 === 0 ? "diamond" : "circle",
        });
      }

      startParticleLoop();
    },
    [prefersReducedMotion, startParticleLoop]
  );

  const sizeCanvas = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv || !cv.parentElement) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const w = Math.min(cv.parentElement.clientWidth, 520);
    const dpr = window.devicePixelRatio || 1;
    cv.style.height = `${w}px`;
    cv.width = w * dpr;
    cv.height = w * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    canvasWidthRef.current = w;
  }, []);

  const syncHud = useCallback(() => {
    const elapsed = (Date.now() - t0Ref.current) / 1000;
    const totalUsed = elapsed + penaltyRef.current;
    const remaining = Math.max(0, timeLimitRef.current - totalUsed);

    setDisplaySeconds(totalUsed);
    setRemainingSeconds(remaining);
    setPenalty(penaltyRef.current);

    if (runningRef.current) {
      const ceilSec = Math.ceil(remaining);
      if (ceilSec > 0 && ceilSec <= 10 && lastTickSecondRef.current !== ceilSec) {
        lastTickSecondRef.current = ceilSec;
        playCountdownTickSound();
      }
      if (remaining <= 0) {
        runningRef.current = false;
        gatePosRef.current = null;
        setActiveGatePos(null);
        setTimedOut(true);
        setClearedInRun(timesRef.current.length);
        setRunTotalSeconds(timesRef.current.reduce((a, b) => a + b, 0));
        playTimeUpSound();
      }
    }
  }, []);

  const fetchLeaderboard = useCallback(async (day: string) => {
    try {
      const res = await fetch(`/api/leaderboard?day=${encodeURIComponent(day)}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      if (Array.isArray(data?.scores)) {
        setLeaderboard(data.scores);
        setLbNote("");
      }
    } catch {
      setLbNote("Playing offline: scores are saved locally in this browser.");
      try {
        const cached = localStorage.getItem(`lr-board-${day}`);
        if (cached) setLeaderboard(JSON.parse(cached));
      } catch {
        // Ignore storage errors
      }
    }
  }, []);

  const saveScore = useCallback(
    async (
      name: string,
      levels: number,
      total: number,
      day: string,
      currentUid: string,
      diff: Difficulty
    ) => {
      if (!currentUid) return;
      try {
        const res = await fetch("/api/leaderboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: currentUid,
            name,
            levels,
            total,
            day,
            difficulty: diff,
          }),
        });
        if (!res.ok) throw new Error("Save failed");
        const data = await res.json();
        if (Array.isArray(data?.scores)) {
          setLeaderboard(data.scores);
          try {
            localStorage.setItem(`lr-board-${day}`, JSON.stringify(data.scores));
          } catch {
            // Ignore storage errors
          }
        }
      } catch {
        setToast((prev) => ({
          text: prev.text
            ? `${prev.text} (Saved locally)`
            : "Leaderboard offline, score kept locally.",
          tone: prev.tone,
        }));
      }
    },
    []
  );

  // Initialize player ID, saved preferences, and daily leaderboard
  useEffect(() => {
    const currentDay = getDayKey();
    setDayKey(currentDay);

    let resolvedUid = "";
    try {
      const savedName = localStorage.getItem("lr-name");
      if (savedName) {
        setNameInput(savedName);
        setPlayerName(savedName);
      }
      const savedDiff = localStorage.getItem("lr-diff");
      if (savedDiff === "easy" || savedDiff === "medium" || savedDiff === "hard") {
        setDifficulty(savedDiff);
        difficultyRef.current = savedDiff;
      }
      const existingUid = localStorage.getItem("lr-uid");
      if (existingUid) {
        resolvedUid = existingUid;
      } else {
        resolvedUid =
          typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `w-${Math.random().toString(36).slice(2)}-${Date.now()}`;
        localStorage.setItem("lr-uid", resolvedUid);
      }
      const savedMuted = localStorage.getItem("lr-muted");
      if (savedMuted === "true") {
        setMuted(true);
        setSoundMuted(true);
      }
    } catch {
      resolvedUid = `w-${Date.now()}`;
    }
    setUid(resolvedUid);
    setPersonalBests(loadPersonalBests());
    fetchLeaderboard(currentDay);
  }, [fetchLeaderboard]);

  const activateMaze = useCallback(
    (lvl: number, day: string, diff: Difficulty, customRiddles?: Riddle[]) => {
      const m = buildMaze(lvl, day, diff, customRiddles, usedRiddlesRef.current);
      const limit = getLevelTimeLimit(lvl, diff);
      mazeRef.current = m;
      currentLevelRiddlesRef.current = Object.values(m.gates).map((g) => g.riddle);
      posRef.current = 0;
      seenRef.current = { 0: true };
      gatePosRef.current = null;
      penaltyRef.current = 0;
      timeLimitRef.current = limit;
      lastTickSecondRef.current = null;
      t0Ref.current = Date.now();
      runningRef.current = true;
      setLevelIndex(lvl);
      setGridSize(m.n);
      setTimeLimit(limit);
      setRemainingSeconds(limit);
      setPenalty(0);
      setDisplaySeconds(0);
      setTimedOut(false);
      setActiveGatePos(null);
      setLoadingRiddles(false);
      setRiddleLoadError(null);
      syncHud();
      requestAnimationFrame(() => {
        sizeCanvas();
        drawMaze();
      });
    },
    [drawMaze, sizeCanvas, syncHud]
  );

  const startLevel = useCallback(
    async (lvl: number, day: string, diff: Difficulty, useBuiltInFallback = false) => {
      const reqId = ++levelRequestIdRef.current;
      const { n, gateCount } = getMazeSpecs(lvl, diff);
      const limit = getLevelTimeLimit(lvl, diff);

      runningRef.current = false;
      mazeRef.current = null;
      timeLimitRef.current = limit;
      lastTickSecondRef.current = null;
      setLevelIndex(lvl);
      setGridSize(n);
      setTimeLimit(limit);
      setRemainingSeconds(limit);
      setTimedOut(false);
      setActiveGatePos(null);
      gatePosRef.current = null;

      if (useBuiltInFallback) {
        activateMaze(lvl, day, diff, undefined);
        return;
      }

      setLoadingRiddles(true);
      setRiddleLoadError(null);

      try {
        const res = await fetch("/api/riddles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            difficulty: diff,
            level: lvl + 1,
            count: gateCount,
            excludeAnswers: usedAnswersRef.current,
          }),
        });

        const data = await res.json();
        if (reqId !== levelRequestIdRef.current) return;

        if (!res.ok || !Array.isArray(data?.riddles)) {
          throw new Error(data?.error || "Could not generate riddles for this level.");
        }

        const riddles = data.riddles as Riddle[];
        for (const r of riddles) {
          if (r.answers[0]) {
            usedAnswersRef.current.push(r.answers[0]);
          }
        }
        activateMaze(lvl, day, diff, riddles);
      } catch (err) {
        if (reqId !== levelRequestIdRef.current) return;
        setLoadingRiddles(false);
        setRiddleLoadError(
          err instanceof Error
            ? err.message
            : "Could not generate AI riddles for this level."
        );
      }
    },
    [activateMaze]
  );

  const startGame = useCallback(
    (overrideName?: string, overrideDiff?: Difficulty) => {
      const activeName = (overrideName ?? playerName).trim() || "Wanderer";
      const activeDiff = overrideDiff ?? difficultyRef.current;
      const currentDay = getDayKey();

      setDayKey(currentDay);
      setPlayerName(activeName);
      difficultyRef.current = activeDiff;
      usedRiddlesRef.current = new Set();
      usedAnswersRef.current = [];
      currentLevelRiddlesRef.current = undefined;
      timesRef.current = [];
      t0Ref.current = Date.now();
      penaltyRef.current = 0;
      setPenalty(0);
      setDisplaySeconds(0);
      setToast({ text: "", tone: "mute" });
      setScreen("playing");
      void startLevel(0, currentDay, activeDiff, false);
    },
    [playerName, startLevel]
  );

  // Active timer loop
  useEffect(() => {
    if (screen !== "playing") return;
    const timer = window.setInterval(() => {
      if (runningRef.current) {
        syncHud();
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [screen, syncHud]);

  // Cleanup particle animation on unmount
  useEffect(() => {
    return () => {
      stopParticleLoop();
    };
  }, [stopParticleLoop]);

  // Resize & color scheme redraw
  useEffect(() => {
    const handleResize = () => {
      if (screen === "playing" && mazeRef.current) {
        sizeCanvas();
        drawMaze();
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [screen, sizeCanvas, drawMaze]);

  const finishLevel = useCallback(() => {
    runningRef.current = false;
    const levelDuration = (Date.now() - t0Ref.current) / 1000 + penaltyRef.current;
    timesRef.current.push(Math.round(levelDuration));
    const clearedCount = timesRef.current.length;
    const totalSeconds = timesRef.current.reduce((a, b) => a + b, 0);

    const clearedLevelNumber = levelIndex + 1;
    const { bests, isNewFastestMaze } = recordMazeCompletion(
      difficultyRef.current,
      clearedLevelNumber,
      levelDuration,
      clearedCount,
      totalSeconds
    );
    setPersonalBests(bests);

    setToast({
      text: isNewFastestMaze
        ? `Level ${clearedCount} cleared in ${formatTime(levelDuration)} — New ${DIFFICULTY_SETTINGS[difficultyRef.current].label} Personal Best!`
        : `Level ${clearedCount} cleared in ${formatTime(levelDuration)}!`,
      tone: "good",
    });
    setClearedInRun(clearedCount);
    setRunTotalSeconds(totalSeconds);

    void saveScore(
      playerName,
      clearedCount,
      totalSeconds,
      dayKey,
      uid,
      difficultyRef.current
    );

    t0Ref.current = Date.now();
    penaltyRef.current = 0;
    setPenalty(0);
    setDisplaySeconds(0);
    void startLevel(levelIndex + 1, dayKey, difficultyRef.current, false);
  }, [dayKey, levelIndex, playerName, saveScore, startLevel, uid]);

  const stepTo = useCallback(
    (np: number, fromRiddleSolve = false) => {
      posRef.current = np;
      seenRef.current[np] = true;
      drawMaze();
      if (mazeRef.current && np === mazeRef.current.end) {
        playLevelCompleteSound();
        finishLevel();
      } else if (!fromRiddleSolve) {
        playMoveSound();
      }
    },
    [drawMaze, finishLevel]
  );

  const openGate = useCallback((gatePos: number) => {
    const m = mazeRef.current;
    if (!m) return;
    const gate = m.gates[gatePos];
    if (!gate) return;

    playGateOpenSound();
    gatePosRef.current = gatePos;
    setActiveGatePos(gatePos);
    setRiddleAnswer("");
    if (gate.hint) {
      setRiddleMsg({ text: getHintText(gate.riddle), tone: "good" });
    } else {
      setRiddleMsg({ text: "", tone: "mute" });
    }
    window.setTimeout(() => {
      answerInputRef.current?.focus();
    }, 50);
  }, []);

  const move = useCallback(
    (dir: number) => {
      if (!runningRef.current || gatePosRef.current !== null) return;
      const m = mazeRef.current;
      if (!m) return;

      const n = m.n;
      const pos = posRef.current;
      if (!(m.open[pos] & DIRS[dir][2])) {
        playWallBumpSound();
        spawnWallParticles(pos, dir);
        return;
      }

      const np = (((pos / n) | 0) + DIRS[dir][1]) * n + (pos % n) + DIRS[dir][0];
      const gate = m.gates[np];
      if (gate && !gate.ok) {
        openGate(np);
        return;
      }
      stepTo(np);
    },
    [openGate, spawnWallParticles, stepTo]
  );

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (screen !== "playing") return;
      if (gatePosRef.current !== null) {
        if (e.key === "Escape") {
          gatePosRef.current = null;
          setActiveGatePos(null);
        }
        return;
      }
      const keyMap: Record<string, number> = {
        ArrowUp: 0,
        w: 0,
        W: 0,
        ArrowRight: 1,
        d: 1,
        D: 1,
        ArrowDown: 2,
        s: 2,
        S: 2,
        ArrowLeft: 3,
        a: 3,
        A: 3,
      };
      const dir = keyMap[e.key];
      if (dir !== undefined) {
        e.preventDefault();
        move(dir);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [move, screen]);

  const handleSubmitAnswer = () => {
    const gp = gatePosRef.current;
    const m = mazeRef.current;
    if (gp === null || !m) return;
    const gate = m.gates[gp];
    if (!gate || !riddleAnswer.trim()) return;

    if (isAnswerCorrect(gate.riddle, riddleAnswer)) {
      gate.ok = true;
      gatePosRef.current = null;
      setActiveGatePos(null);
      playRiddleSolvedSound();
      spawnSolveParticles(gp);
      stepTo(gp, true);
    } else {
      playWrongAnswerSound();
      penaltyRef.current += 15;
      syncHud();
      setRiddleMsg({ text: "Not quite. +15s", tone: "bad" });
      setShakeModal(false);
      requestAnimationFrame(() => setShakeModal(true));
    }
  };

  const handleHint = () => {
    const gp = gatePosRef.current;
    const m = mazeRef.current;
    if (gp === null || !m) return;
    const gate = m.gates[gp];
    if (!gate) return;

    if (!gate.hint) {
      gate.hint = true;
      penaltyRef.current += 30;
      syncHud();
    }
    setRiddleMsg({ text: getHintText(gate.riddle), tone: "good" });
  };

  const handleStepBack = () => {
    gatePosRef.current = null;
    setActiveGatePos(null);
  };

  const handleRestartLevel = () => {
    if (loadingRiddles) return;
    gatePosRef.current = null;
    setActiveGatePos(null);
    mazeRef.current = buildMaze(
      levelIndex,
      dayKey,
      difficultyRef.current,
      currentLevelRiddlesRef.current,
      usedRiddlesRef.current
    );
    posRef.current = 0;
    seenRef.current = { 0: true };
    lastTickSecondRef.current = null;
    if (timedOut) {
      t0Ref.current = Date.now();
      penaltyRef.current = 0;
      setTimedOut(false);
    } else {
      penaltyRef.current += 10;
    }
    runningRef.current = true;
    syncHud();
    drawMaze();
  };

  const handleRestartFromLevel1 = () => {
    startGame(playerName, difficultyRef.current);
  };

  const handleMainMenu = () => {
    levelRequestIdRef.current++;
    runningRef.current = false;
    stopParticleLoop();
    gatePosRef.current = null;
    setActiveGatePos(null);
    setTimedOut(false);
    setLoadingRiddles(false);
    setRiddleLoadError(null);
    setToast({ text: "", tone: "mute" });
    setScreen("start");
  };

  const handleToggleMute = () => {
    const next = !muted;
    setMuted(next);
    setSoundMuted(next);
    try {
      localStorage.setItem("lr-muted", String(next));
    } catch {
      // Ignore storage errors
    }
  };

  const handleSelectDifficulty = (nextDiff: Difficulty) => {
    setDifficulty(nextDiff);
    difficultyRef.current = nextDiff;
    try {
      localStorage.setItem("lr-diff", nextDiff);
    } catch {
      // Ignore storage errors
    }
  };

  const handleEnterLabyrinth = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleaned = (nameInput.trim() || "Wanderer").slice(0, 16);
    try {
      localStorage.setItem("lr-name", cleaned);
    } catch {
      // Ignore storage errors
    }
    startGame(cleaned, difficulty);
  };

  const activeGateRiddle =
    activeGatePos !== null && mazeRef.current
      ? mazeRef.current.gates[activeGatePos]?.riddle
      : null;

  const diffMeta = DIFFICULTY_SETTINGS[difficulty];
  const currentBest = personalBests[difficulty];
  const hasAnyPersonalBest = DIFFICULTIES.some((d) => Boolean(personalBests[d]));

  const handleResetPersonalBests = () => {
    clearPersonalBests();
    setPersonalBests({});
  };

  return (
    <main className="mx-auto max-w-[560px] px-4 py-4">
      <h1 className="my-1 text-[1.7rem] font-bold tracking-tight text-[#0a1f44] text-balance">
        🧭 Endless Labyrinth of Riddles
      </h1>
      <p className="mb-4 text-[#5a6b8c] leading-relaxed">
        Endless mazes, new every day, each one bigger and harder than the last with AI-crafted
        riddles tailored to your difficulty. You start at the top-left dot and the exit 🚩 is
        always in the bottom-right corner, visible even through the fog.
      </p>

      {screen === "start" && (
        <form
          onSubmit={handleEnterLabyrinth}
          className="mb-3.5 rounded-2xl border border-[#d3dbec] bg-[#f4f7fc] p-4"
        >
          <label htmlFor="nick" className="block text-sm font-medium text-[#5a6b8c]">
            Your name for the leaderboard
          </label>
          <input
            id="nick"
            maxLength={16}
            placeholder="Wanderer"
            autoComplete="nickname"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            className="my-2 w-full rounded-[10px] border border-[#d3dbec] bg-white px-3 py-2.5 text-[#0a1f44] outline-none focus:border-[#1f5fd6] focus:ring-2 focus:ring-[#1f5fd6]/20"
          />

          <div className="mt-3">
            <span className="block text-sm font-medium text-[#5a6b8c]">
              Difficulty
            </span>
            <div
              role="radiogroup"
              aria-label="Difficulty"
              className="mt-1.5 grid grid-cols-3 gap-1 rounded-[10px] border border-[#d3dbec] bg-white p-1"
            >
              {DIFFICULTIES.map((d) => {
                const active = difficulty === d;
                return (
                  <button
                    key={d}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => handleSelectDifficulty(d)}
                    className={`cursor-pointer whitespace-nowrap shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                      active
                        ? "bg-[#0a2a66] text-white"
                        : "text-[#0a1f44] hover:bg-[#f4f7fc]"
                    }`}
                  >
                    {DIFFICULTY_SETTINGS[d].label}
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-xs text-[#5a6b8c]">{diffMeta.summary}</p>
          </div>

          <ul className="my-3 list-disc space-y-1 pl-5 text-sm text-[#5a6b8c]">
            <li>Move with arrow keys, WASD or the directional pad.</li>
            <li>Each level generates fresh AI riddles scaled to your chosen difficulty.</li>
            <li>Beat the level countdown before 0:00 — a hint costs 30 s, a wrong answer 15 s.</li>
          </ul>
          <button
            type="submit"
            className="mt-1 cursor-pointer whitespace-nowrap shrink-0 rounded-[10px] bg-[#0a2a66] px-[18px] py-2.5 font-bold text-white transition-colors hover:bg-[#1f5fd6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f5fd6]"
          >
            Enter the labyrinth
          </button>
          {lbNote && <div className="mt-2 min-h-[1.4em] text-sm text-[#5a6b8c]">{lbNote}</div>}

          <div className="mt-4 border-t border-[#d3dbec] pt-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-[#0a1f44]">
                Personal Best by difficulty
              </span>
              {hasAnyPersonalBest && (
                <button
                  type="button"
                  onClick={handleResetPersonalBests}
                  className="cursor-pointer text-xs font-medium text-[#5a6b8c] underline-offset-2 hover:text-[#0a1f44] hover:underline"
                >
                  Reset times
                </button>
              )}
            </div>
            <div className="mt-2 grid grid-cols-3 gap-3 text-xs">
              {DIFFICULTIES.map((d) => {
                const record = personalBests[d];
                const isSelected = difficulty === d;
                return (
                  <div
                    key={d}
                    className={`border-t-2 pt-1.5 ${
                      isSelected ? "border-[#0a2a66]" : "border-[#d3dbec]"
                    }`}
                  >
                    <div
                      className={`font-semibold ${
                        isSelected ? "text-[#0a2a66]" : "text-[#5a6b8c]"
                      }`}
                    >
                      {DIFFICULTY_SETTINGS[d].label}
                    </div>
                    {record ? (
                      <div className="mt-0.5 font-mono tabular-nums text-[#0a1f44]">
                        <div>
                          Best {formatTime(record.fastestMazeSeconds)}{" "}
                          <span className="text-[#5a6b8c]">(L{record.fastestMazeLevel})</span>
                        </div>
                        <div className="text-[#5a6b8c]">
                          Run L{record.bestRunLevels} · {formatTime(record.bestRunTotalSeconds)}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-0.5 text-[#5a6b8c]">No clears yet</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </form>
      )}

      {screen === "playing" && (
        <div>
          <div className="mb-2 rounded-xl border border-[#d3dbec] bg-[#f4f7fc] px-3.5 py-2">
            <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[0.86rem] font-semibold tabular-nums text-[#0a1f44]">
              <span>
                Level {levelIndex + 1} · {DIFFICULTY_SETTINGS[difficulty].label} · {gridSize}×{gridSize}
              </span>
              <span
                className={
                  remainingSeconds <= 15
                    ? "text-[#c0392b]"
                    : remainingSeconds <= 30
                      ? "text-[#b45309]"
                      : "text-[#0a2a66]"
                }
              >
                ⏱ {formatTime(Math.ceil(remainingSeconds))}
                {remainingSeconds <= 15 && remainingSeconds > 0 ? " LOW" : ""}
              </span>
              <span className="text-[#5a6b8c]">
                Speed {formatTime(displaySeconds)} · +{penalty}s
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#dfe6f5]">
              <div
                className={`h-full transition-[width] duration-200 ${
                  remainingSeconds <= 15
                    ? "bg-[#c0392b]"
                    : remainingSeconds <= 30
                      ? "bg-[#d97706]"
                      : "bg-[#0a2a66]"
                }`}
                style={{
                  width: `${Math.max(0, Math.min(100, (remainingSeconds / Math.max(1, timeLimit)) * 100))}%`,
                }}
              />
            </div>
          </div>

          <div className="relative">
            <canvas
              ref={canvasRef}
              className="block w-full touch-none rounded-xl border-2 border-[#d3dbec] bg-[#0a1f44]"
            />

            {loadingRiddles && (
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-[#0a1f44]/95 p-6 text-center text-white">
                <p className="text-base font-semibold">
                  Forging Level {levelIndex + 1} ({DIFFICULTY_SETTINGS[difficulty].label})…
                </p>
                <p className="mt-1 text-sm text-[#d3dbec]">
                  Generating {getMazeSpecs(levelIndex, difficulty).gateCount} new riddles for this maze
                </p>
              </div>
            )}

            {riddleLoadError && !loadingRiddles && (
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-[#f4f7fc] p-6 text-center border-2 border-[#d3dbec]">
                <p className="text-base font-bold text-[#c0392b]">
                  Unable to generate AI riddles
                </p>
                <p className="mt-1.5 max-w-sm text-sm text-[#5a6b8c]">{riddleLoadError}</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => void startLevel(levelIndex, dayKey, difficulty, false)}
                    className="cursor-pointer whitespace-nowrap shrink-0 rounded-[10px] bg-[#0a2a66] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#1f5fd6]"
                  >
                    Retry AI riddles
                  </button>
                  <button
                    type="button"
                    onClick={() => void startLevel(levelIndex, dayKey, difficulty, true)}
                    className="cursor-pointer whitespace-nowrap shrink-0 rounded-[10px] border border-[#d3dbec] bg-white px-4 py-2 text-sm font-bold text-[#0a1f44] transition-colors hover:bg-[#dfe6f5]"
                  >
                    Use built-in riddles
                  </button>
                </div>
              </div>
            )}

            {timedOut && !loadingRiddles && !riddleLoadError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl border-2 border-[#d3dbec] bg-[#f4f7fc]/95 p-6 text-center">
                <p className="text-lg font-bold text-[#c0392b]">⏱ Time’s Up!</p>
                <p className="mt-1.5 max-w-sm text-sm text-[#0a1f44]">
                  The labyrinth clock ran out on Level {levelIndex + 1} ({DIFFICULTY_SETTINGS[difficulty].label}).
                </p>
                <p className="mt-1 font-mono text-xs tabular-nums text-[#5a6b8c]">
                  {clearedInRun > 0
                    ? `Cleared ${clearedInRun} ${clearedInRun === 1 ? "level" : "levels"} · Total speed ${formatTime(runTotalSeconds)}`
                    : "No levels cleared yet in this run"}
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleRestartLevel}
                    className="cursor-pointer whitespace-nowrap shrink-0 rounded-[10px] bg-[#0a2a66] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#1f5fd6]"
                  >
                    ↻ Retry Level {levelIndex + 1}
                  </button>
                  <button
                    type="button"
                    onClick={handleRestartFromLevel1}
                    className="cursor-pointer whitespace-nowrap shrink-0 rounded-[10px] border border-[#d3dbec] bg-white px-4 py-2 text-sm font-bold text-[#0a1f44] transition-colors hover:bg-[#dfe6f5]"
                  >
                    ⟲ Restart from level 1
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-2.5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleRestartLevel}
              disabled={loadingRiddles}
              className="cursor-pointer whitespace-nowrap shrink-0 rounded-[10px] border border-[#d3dbec] bg-[#f4f7fc] px-4 py-2 text-sm font-bold text-[#0a1f44] transition-colors hover:bg-[#dfe6f5] disabled:opacity-50"
            >
              ↻ Restart this level
            </button>
            <button
              type="button"
              onClick={handleRestartFromLevel1}
              className="cursor-pointer whitespace-nowrap shrink-0 rounded-[10px] border border-[#d3dbec] bg-[#f4f7fc] px-4 py-2 text-sm font-bold text-[#0a1f44] transition-colors hover:bg-[#dfe6f5]"
            >
              ⟲ Restart from level 1
            </button>
            <button
              type="button"
              onClick={handleMainMenu}
              className="cursor-pointer whitespace-nowrap shrink-0 rounded-[10px] border border-[#d3dbec] bg-[#f4f7fc] px-4 py-2 text-sm font-bold text-[#0a1f44] transition-colors hover:bg-[#dfe6f5]"
            >
              🏠 Main menu
            </button>
            <button
              type="button"
              onClick={handleToggleMute}
              aria-pressed={muted}
              className="cursor-pointer whitespace-nowrap shrink-0 rounded-[10px] border border-[#d3dbec] bg-[#f4f7fc] px-4 py-2 text-sm font-bold text-[#0a1f44] transition-colors hover:bg-[#dfe6f5]"
            >
              {muted ? "🔇 Muted" : "🔊 Sound"}
            </button>
          </div>

          <div
            className={`mt-2 min-h-[1.4em] text-[0.9rem] ${
              toast.tone === "good"
                ? "text-[#1b7f4c]"
                : toast.tone === "bad"
                  ? "text-[#c0392b]"
                  : "text-[#5a6b8c]"
            }`}
          >
            {toast.text}
          </div>

          <p className="mt-2 text-sm text-[#5a6b8c]">
            Start: top-left · Exit 🚩: bottom-right ·{" "}
            <span className="font-mono tabular-nums">
              Personal Best ({DIFFICULTY_SETTINGS[difficulty].label}):{" "}
              {currentBest
                ? `${formatTime(currentBest.fastestMazeSeconds)} (L${currentBest.fastestMazeLevel})`
                : "—"}
            </span>
          </p>

          <div className="my-3.5 grid grid-cols-[repeat(3,64px)] grid-rows-[repeat(2,52px)] justify-center gap-1.5">
            <span />
            <button
              type="button"
              aria-label="Up"
              onClick={() => move(0)}
              className="cursor-pointer rounded-xl border border-[#d3dbec] bg-[#f4f7fc] text-[1.3rem] text-[#0a1f44] transition-colors hover:bg-[#dfe6f5] active:scale-95"
            >
              ↑
            </button>
            <span />
            <button
              type="button"
              aria-label="Left"
              onClick={() => move(3)}
              className="cursor-pointer rounded-xl border border-[#d3dbec] bg-[#f4f7fc] text-[1.3rem] text-[#0a1f44] transition-colors hover:bg-[#dfe6f5] active:scale-95"
            >
              ←
            </button>
            <button
              type="button"
              aria-label="Down"
              onClick={() => move(2)}
              className="cursor-pointer rounded-xl border border-[#d3dbec] bg-[#f4f7fc] text-[1.3rem] text-[#0a1f44] transition-colors hover:bg-[#dfe6f5] active:scale-95"
            >
              ↓
            </button>
            <button
              type="button"
              aria-label="Right"
              onClick={() => move(1)}
              className="cursor-pointer rounded-xl border border-[#d3dbec] bg-[#f4f7fc] text-[1.3rem] text-[#0a1f44] transition-colors hover:bg-[#dfe6f5] active:scale-95"
            >
              →
            </button>
          </div>
        </div>
      )}

      <div className="mb-3.5 rounded-2xl border border-[#d3dbec] bg-[#f4f7fc] p-4">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <strong className="text-[#0a1f44]">Today’s leaderboard</strong>
          <span className="text-sm text-[#5a6b8c]">(most levels, then lowest time)</span>
        </div>
        <ol className="my-1.5 list-decimal space-y-0.5 pl-[22px] font-mono text-sm tabular-nums">
          {leaderboard.length === 0 ? (
            <li className="font-sans text-[#5a6b8c]">No scores yet. Be the first!</li>
          ) : (
            leaderboard.map((entry) => {
              const entryDiff =
                entry.difficulty === "easy" || entry.difficulty === "hard"
                  ? DIFFICULTY_SETTINGS[entry.difficulty].label
                  : entry.difficulty === "medium"
                    ? DIFFICULTY_SETTINGS.medium.label
                    : null;
              return (
                <li
                  key={entry.id}
                  className={
                    entry.id === uid ? "font-bold text-[#0a2a66]" : "text-[#0a1f44]"
                  }
                >
                  <span className="font-sans">{entry.name}</span> — Level {entry.levels} ·{" "}
                  {formatTime(entry.total)}
                  {entryDiff ? ` · ${entryDiff}` : ""}
                </li>
              );
            })
          )}
        </ol>
      </div>

      {activeGateRiddle && (
        <div
          className="fixed inset-0 z-10 grid place-items-center bg-[#0a0814]/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="riddle-question"
        >
          <div
            className={`w-full max-w-[460px] rounded-2xl border border-[#d3dbec] bg-[#f4f7fc] p-5 ${
              shakeModal ? "animate-modal-shake" : ""
            }`}
            onAnimationEnd={() => setShakeModal(false)}
          >
            <div className="flex items-center justify-between text-sm text-[#5a6b8c]">
              <span>🔒 The gate speaks:</span>
              <span
                className={`font-mono tabular-nums ${
                  remainingSeconds <= 15 ? "font-bold text-[#c0392b]" : ""
                }`}
              >
                Level {levelIndex + 1} · ⏱ {formatTime(Math.ceil(remainingSeconds))}
              </span>
            </div>
            <p id="riddle-question" className="my-3 text-[1.15rem] italic text-[#0a1f44]">
              {activeGateRiddle.question}
            </p>
            <input
              ref={answerInputRef}
              value={riddleAnswer}
              onChange={(e) => setRiddleAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmitAnswer();
                }
              }}
              placeholder="Your answer"
              autoComplete="off"
              className="my-2 w-full rounded-[10px] border border-[#d3dbec] bg-white px-3 py-2.5 text-[#0a1f44] outline-none focus:border-[#1f5fd6] focus:ring-2 focus:ring-[#1f5fd6]/20"
            />
            <div
              className={`min-h-[1.4em] text-[0.9rem] ${
                riddleMsg.tone === "bad"
                  ? "text-[#c0392b]"
                  : riddleMsg.tone === "good"
                    ? "text-[#1b7f4c]"
                    : "text-[#5a6b8c]"
              }`}
            >
              {riddleMsg.text}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSubmitAnswer}
                className="cursor-pointer whitespace-nowrap shrink-0 rounded-[10px] bg-[#0a2a66] px-[18px] py-2.5 font-bold text-white transition-colors hover:bg-[#1f5fd6]"
              >
                Answer
              </button>
              <button
                type="button"
                onClick={handleHint}
                className="cursor-pointer whitespace-nowrap shrink-0 rounded-[10px] border border-[#d3dbec] bg-[#f4f7fc] px-[18px] py-2.5 font-bold text-[#0a1f44] transition-colors hover:bg-[#dfe6f5]"
              >
                Hint (+30s)
              </button>
              <button
                type="button"
                onClick={handleStepBack}
                className="cursor-pointer whitespace-nowrap shrink-0 rounded-[10px] border border-[#d3dbec] bg-[#f4f7fc] px-[18px] py-2.5 font-bold text-[#0a1f44] transition-colors hover:bg-[#dfe6f5]"
              >
                Step back
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
