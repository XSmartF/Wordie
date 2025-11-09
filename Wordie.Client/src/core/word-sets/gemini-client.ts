import { GoogleGenAI } from "@google/genai";
import type { GeminiPreviewWord, GeminiWordsPayload } from "./types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash";

const genAI = new GoogleGenAI({ apiKey: API_KEY });

const clampLevel = (value?: number) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }
  return Math.max(1, Math.min(10, Math.round(value)));
};

const clampMaxWords = (value?: number) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }
  return Math.max(1, Math.min(100, Math.round(value)));
};

const buildPrompt = (payload: GeminiWordsPayload): string => {
  const defaultLevel = clampLevel(payload.defaultLevel);
  const maxItems = clampMaxWords(payload.maxWords);

  const vocab = (payload.prompt ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");

  const lines: string[] = [
    "Return only valid JSON array.",
    "Each item must be an object with:",
    "Term (string), Definition (string), DefinitionVietnamese (string), Example (string), TypeOfWord (string), Note (string|null), Level (number 1–10).",
    `TypeOfWord options: Noun, Pronoun, Verb, Adjective, Adverb, Preposition, Conjunction, Interjection, GrammarStructure.`,
    `If TypeOfWord='GrammarStructure', include detailed Vietnamese note explaining usage, structure, and examples.`,
    `Example: [{"Term":"vessel","Definition":"a ship","DefinitionVietnamese":"thuyền","Example":"The vessel sailed at dawn.","TypeOfWord":"Noun","Note":null,"Level":2}]`,
  ];

  if (defaultLevel) lines.push(`Default Level: ${defaultLevel}.`);
  if (maxItems) lines.push(`Return max ${maxItems} items.`);
  lines.push("Vocabulary:");
  lines.push(vocab);

  return lines.join("\n");
};



const requestGemini = async (prompt: string) => {
  try {
    const result = await genAI.models.generateContent({
    model: MODEL,
    contents: prompt,
  });
    return (result?.text ?? "").replace(/```json|```/g, "").trim();
  } catch (error) {
    console.error("Gemini request failed", error);
    return "";
  }
};

const normalizeWords = (jsonText: string, payload: GeminiWordsPayload): GeminiPreviewWord[] => {
  const fallbackLevel = clampLevel(payload.defaultLevel) ?? 1;

  try {
    const parsed = JSON.parse(jsonText);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((entry) => {
        if (!entry || typeof entry !== "object") {
          return null;
        }

        const record = entry as Record<string, unknown>;
        const termCandidate =
          typeof record.word === "string"
            ? record.word
            : typeof record.Word === "string"
            ? record.Word
            : typeof record.term === "string"
            ? record.term
            : typeof record.Term === "string"
            ? record.Term
            : null;

        const definitionEnglish =
          typeof record.Definition === "string"
            ? record.Definition
            : typeof record.definition === "string"
            ? record.definition
            : null;

        const definitionVietnamese =
          typeof record.DefinitionVietnamese === "string"
            ? record.DefinitionVietnamese
            : typeof record.definitionVietnamese === "string"
            ? record.definitionVietnamese
            : null;

        const example =
          typeof record.Example === "string"
            ? record.Example
            : typeof record.example === "string"
            ? record.example
            : null;

        const exampleVietnamese =
          typeof record.ExampleVietnamese === "string"
            ? record.ExampleVietnamese
            : typeof record.exampleVietnamese === "string"
            ? record.exampleVietnamese
            : null;

        const typeOfWord =
          typeof record.TypeOfWord === "string"
            ? record.TypeOfWord
            : typeof record.typeOfWord === "string"
            ? record.typeOfWord
            : null;

        const note =
          typeof record.Note === "string"
            ? record.Note
            : typeof record.note === "string"
            ? record.note
            : null;

        const levelCandidate =
          typeof record.Level === "number"
            ? record.Level
            : typeof record.level === "number"
            ? record.level
            : fallbackLevel;

        if (!termCandidate || !definitionEnglish) {
          return null;
        }

        const normalizedLevel = Number.isFinite(levelCandidate)
          ? Math.max(1, Math.min(10, Math.round(levelCandidate)))
          : fallbackLevel;

        const normalized: GeminiPreviewWord = {
          Term: String(termCandidate).trim(),
          Definition: String(definitionEnglish).trim(),
          DefinitionVietnamese: definitionVietnamese ? String(definitionVietnamese).trim() : null,
          Example: example ? String(example).trim() : null,
          TypeOfWord: typeOfWord ? String(typeOfWord).trim() : null,
          Note: note ? String(note).trim() : null,
          Level: normalizedLevel,
        };

        if (typeOfWord === "GrammarStructure" && (!note || note.trim().length < 50)) {
          normalized.Note = `Cấu trúc ngữ pháp: ${normalized.Term}. Cần bổ sung hướng dẫn chi tiết về cách sử dụng, lưu ý và ví dụ cụ thể bằng tiếng Việt.`;
        }

        if (exampleVietnamese) {
          normalized.Note = normalized.Note
            ? `${normalized.Note} | 🇻🇳 ${String(exampleVietnamese).trim()}`
            : `🇻🇳 ${String(exampleVietnamese).trim()}`;
        }

        return normalized;
      })
      .filter((item): item is GeminiPreviewWord => Boolean(item));
  } catch (err) {
    console.error("Failed to parse JSON", jsonText, err);
    return [];
  }
};

export async function getWordMeanings(payload: GeminiWordsPayload = { prompt: "" }): Promise<GeminiPreviewWord[]> {
  const prompt = buildPrompt(payload);
  const rawText = await requestGemini(prompt);
  return normalizeWords(rawText, payload);
}

export const generateGeminiWords = getWordMeanings;
