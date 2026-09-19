import rawQuestions from "@/data/questions.json";
import type { Difficulty, Encoding, PromptDef } from "@/lib/types";

type RawQuestion = {
  id: string;
  category: string;
  difficulty: string;
  prompt: string;
  answer: string;
  accepted_answers: string[];
};

export function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase().replace(/^0b/i, "").replace(/\s+/g, "");
}

function asDifficulty(value: string): Difficulty {
  if (value === "easy" || value === "hard") return value;
  return "medium";
}

function asCategory(value: string): Encoding {
  if (value === "hex" || value === "ascii") return value;
  return "binary";
}

function isPlayable(question: RawQuestion): boolean {
  const answer = question.answer.trim();
  if (/^[A-Za-z]{3,}$/.test(answer)) return false;
  return true;
}

function matchValuesFor(question: RawQuestion): number[] {
  const values = new Set<number>();
  const answers = [question.answer, ...question.accepted_answers].map((item) =>
    item.trim(),
  );
  const hexPaired = answers.some((item) => /^0x/i.test(item));

  for (const raw of answers) {
    if (/^0b[01]+$/i.test(raw) || /^[01]{4,}$/.test(raw)) {
      values.add(parseInt(raw.replace(/^0b/i, ""), 2));
      continue;
    }
    if (/^0x[0-9a-f]+$/i.test(raw)) {
      values.add(parseInt(raw.slice(2), 16));
      continue;
    }
    if (/^[A-Za-z]$/.test(raw)) {
      if (question.category === "hex" && /[A-F]/i.test(raw)) {
        values.add(parseInt(raw, 16));
      } else {
        const upper = raw.toUpperCase();
        values.add(upper.charCodeAt(0));
        if (question.category === "binary") {
          values.add(upper.charCodeAt(0) - 64);
        }
      }
      continue;
    }
    if (/^\d+$/.test(raw)) {
      if (hexPaired) continue;
      values.add(Number(raw));
      continue;
    }
    if (question.category === "hex" && /^[0-9A-F]{1,4}$/i.test(raw)) {
      values.add(parseInt(raw, 16));
    }
  }
  return [...values];
}

function toPrompt(question: RawQuestion): PromptDef {
  const acceptedAnswers = [
    ...new Set([question.answer, ...question.accepted_answers]),
  ];
  return {
    id: question.id,
    text: question.prompt,
    answer: question.answer,
    acceptedAnswers,
    category: asCategory(question.category),
    difficulty: asDifficulty(question.difficulty),
    matchValues: matchValuesFor(question),
    matchGlyphs: acceptedAnswers.map(normalizeAnswer),
    hint: `${asDifficulty(question.difficulty)} ${question.category}`,
  };
}

export const PROMPTS: PromptDef[] = (rawQuestions as RawQuestion[])
  .filter(isPlayable)
  .map(toPrompt);
