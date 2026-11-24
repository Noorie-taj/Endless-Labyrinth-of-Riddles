import { NextRequest, NextResponse } from "next/server";
import { ThinkingLevel, Type } from "@google/genai";
import { getGeminiClient } from "@/lib/gemini";
import type { Difficulty } from "@/lib/maze";
import type { Riddle } from "@/lib/riddles";

const DIFFICULTY_GUIDANCE: Record<
  Difficulty,
  {
    name: string;
    style: string;
  }
> = {
  easy: {
    name: "Easy",
    style:
      "Simple, playful, and approachable riddles about familiar everyday objects, animals, or nature. Clues should be concrete and direct, with common single-word answers.",
  },
  medium: {
    name: "Standard",
    style:
      "Clever, engaging riddles blending metaphor, wordplay, and lateral thinking. Clues should feel classic and fair, with concise 1-to-2 word answers.",
  },
  hard: {
    name: "Hard",
    style:
      "Cryptic, poetic, multi-layered paradoxes and abstract brain-teasers requiring sharp lateral thinking. Clues should be subtle and atmospheric, yet still resolve to a fair, unambiguous 1-to-2 word answer.",
  },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const difficultyRaw = body?.difficulty;
    const difficulty: Difficulty =
      difficultyRaw === "easy" || difficultyRaw === "hard" ? difficultyRaw : "medium";
    const levelNumber = Math.max(1, Math.min(50, Math.floor(Number(body?.level) || 1)));
    const count = Math.max(1, Math.min(10, Math.floor(Number(body?.count) || 2)));
    const excludeAnswers: string[] = Array.isArray(body?.excludeAnswers)
      ? body.excludeAnswers
          .filter((v: unknown): v is string => typeof v === "string")
          .slice(-40)
      : [];

    const ai = getGeminiClient();
    const guidance = DIFFICULTY_GUIDANCE[difficulty];

    const levelEscalation =
      levelNumber <= 2
        ? "introductory depth for this difficulty"
        : levelNumber <= 5
          ? "moderate depth and tighter misdirection for this difficulty"
          : "deep labyrinth mastery with intricate imagery for this difficulty";

    const exclusionClause =
      excludeAnswers.length > 0
        ? `Do NOT use any of these previously used answers or close variants: ${excludeAnswers.join(", ")}.`
        : "";

    const prompt = [
      `Generate exactly ${count} original, distinct riddles for Level ${levelNumber} of a maze game.`,
      `Difficulty tier: ${guidance.name}.`,
      `Complexity requirement: ${guidance.style}`,
      `Level progression: Aim for ${levelEscalation}.`,
      exclusionClause,
      "Each riddle must:",
      "- Be 1 to 2 sentences long, ending with a clear question (e.g., 'What am I?' or 'What is it?').",
      "- Have a short, unambiguous answer (1 or 2 words) listed first in 'answers', followed by 2–4 natural variations (e.g., with 'a '/'an '/'the ', plural/singular, or an obvious synonym).",
      "- Be completely distinct in topic and answer from the other riddles in this batch.",
    ]
      .filter(Boolean)
      .join("\n");

    const response = await ai.models.generateContent({
      model: "gemini-4-hydrogen",
      contents: prompt,
      config: {
        systemInstruction:
          "You are a master riddle smith crafting fair, memorable, unambiguous riddles for a labyrinth puzzle game. Always return valid JSON matching the schema.",
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: {
                type: Type.STRING,
                description: "The riddle text presented to the player.",
              },
              answers: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description:
                  "Accepted answers, starting with the canonical 1-2 word answer followed by common variations.",
              },
            },
            required: ["question", "answers"],
          },
        },
      },
    });

    const rawText = (response.text ?? "").trim();
    if (!rawText) {
      return NextResponse.json(
        { error: "The riddle generator returned an empty response." },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(rawText);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return NextResponse.json(
        { error: "The riddle generator returned an unexpected format." },
        { status: 502 }
      );
    }

    const riddles: Riddle[] = parsed
      .slice(0, count)
      .map((item, idx) => {
        const question =
          typeof item?.question === "string" ? item.question.trim() : "";
        const answers = Array.isArray(item?.answers)
          ? item.answers
              .filter((a: unknown): a is string => typeof a === "string" && a.trim().length > 0)
              .map((a: string) => a.trim())
          : [];

        return {
          id: `ai-${difficulty}-l${levelNumber}-${Date.now()}-${idx}`,
          question,
          answers,
        };
      })
      .filter((r) => r.question.length > 0 && r.answers.length > 0);

    if (riddles.length < count) {
      return NextResponse.json(
        { error: "Not enough valid riddles were generated. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ riddles });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to generate riddles with Gemini.";
    const status = message.includes("GEMINI_API_KEY") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
