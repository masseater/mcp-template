import { err, ok, type Result } from "neverthrow";

export type TextStats = {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  lines: number;
  paragraphs: number;
};

export type TextStatsError = {
  code: "EMPTY_TEXT";
  message: string;
};

export function analyzeText(text: string): Result<TextStats, TextStatsError> {
  if (text.trim().length === 0) {
    return err({
      code: "EMPTY_TEXT",
      message: "Text cannot be empty",
    });
  }

  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, "").length;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const lines = text.split(/\r?\n/).length;
  const paragraphs = text
    .split(/\r?\n\s*\r?\n/)
    .filter((p) => p.trim().length > 0).length;

  return ok({
    characters,
    charactersNoSpaces,
    words,
    lines,
    paragraphs,
  });
}

export function formatStats(stats: TextStats): string {
  return [
    `Characters: ${stats.characters}`,
    `Characters (no spaces): ${stats.charactersNoSpaces}`,
    `Words: ${stats.words}`,
    `Lines: ${stats.lines}`,
    `Paragraphs: ${stats.paragraphs}`,
  ].join("\n");
}
