import rawQuestions from "@/data/questions.json";
import type { Difficulty, Encoding, PromptDef } from "@/lib/types";

type RawQuestion = {
  id: string;
  category: string;
  difficulty: string;
  prompt: string;
  answer: string;
  accepted_answers: string[];
  explanation?: string;
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

export function formatAnswerGlyph(
  answer: string,
  category: Encoding | "mixed",
): string {
  const raw = answer.trim();
  if (/^[01]{4,}$/.test(raw)) {
    return raw.replace(/(.{4})/g, "$1 ").trim();
  }
  if (category === "hex" && /^0x/i.test(raw)) {
    return `0x${raw.slice(2).toUpperCase()}`;
  }
  if (category === "hex" && /^[0-9A-F]+$/i.test(raw) && /[A-F]/i.test(raw)) {
    return raw.length === 1 ? raw.toUpperCase() : `0x${raw.toUpperCase()}`;
  }
  return raw;
}

export function deriveExplanation(input: {
  prompt: string;
  answer: string;
  category: string;
}): string {
  const text = input.prompt;
  const answer = input.answer.trim();
  const category = input.category;
  const decimalMention = text.match(/decimal (\d+)/i);
  const asciiCode = text.match(/ASCII code (\d+)/i);
  const quotedChar =
    text.match(/character\s+["“]([^"”]+)["”]/i) ||
    text.match(/letter\s+["“]([^"”]+)["”]/i) ||
    text.match(/["“]([^"”]{1,2})["”]/);
  const binInText = text.match(/\b([01]{4,16})\b/);
  const hexInText = text.match(/\b0x([0-9A-Fa-f]+)\b/i);

  if (decimalMention && /^[01]+$/.test(answer)) {
    return `${decimalMention[1]} in decimal = ${answer} in ${answer.length}-bit binary`;
  }
  if (binInText && /^\d+$/.test(answer) && /decimal/i.test(text)) {
    return `${binInText[1]} in binary = ${answer} in decimal`;
  }
  if (asciiCode && /character/i.test(text)) {
    return `ASCII ${asciiCode[1]} = '${answer}'`;
  }
  if (quotedChar && /^\d+$/.test(answer) && /ASCII code/i.test(text)) {
    return `'${quotedChar[1]}' in ASCII = ${answer}`;
  }
  if (quotedChar && /^[01]+$/.test(answer)) {
    return `'${quotedChar[1]}' in ASCII = ${answer} in 8-bit binary`;
  }
  if (quotedChar && /hex/i.test(text)) {
    return `'${quotedChar[1]}' in ASCII = 0x${answer.replace(/^0x/i, "").toUpperCase()}`;
  }
  if (hexInText && /^\d+$/.test(answer)) {
    return `0x${hexInText[1].toUpperCase()} = ${answer} in decimal`;
  }
  if (decimalMention && category === "hex") {
    return `${decimalMention[1]} in decimal = ${formatAnswerGlyph(answer, "hex")}`;
  }
  if (binInText && /^[A-Za-z]$/.test(answer)) {
    return `${binInText[1]} is letter ${answer.toUpperCase()} (A=00001)`;
  }
  return `${answer} is the ${category} reading for this prompt.`;
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
    explanation:
      question.explanation?.trim() ||
      deriveExplanation({
        prompt: question.prompt,
        answer: question.answer,
        category: question.category,
      }),
  };
}

export const PROMPTS: PromptDef[] = (rawQuestions as RawQuestion[])
  .filter(isPlayable)
  .map(toPrompt);
