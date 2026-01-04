import { describe, expect, test } from "bun:test";
import { analyzeText, formatStats } from "./text-stats";

describe("analyzeText", () => {
  test("returns error for empty text", () => {
    const result = analyzeText("");
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe("EMPTY_TEXT");
    }
  });

  test("returns error for whitespace-only text", () => {
    const result = analyzeText("   \n\t  ");
    expect(result.isErr()).toBe(true);
  });

  test("counts characters correctly", () => {
    const result = analyzeText("Hello");
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.characters).toBe(5);
      expect(result.value.charactersNoSpaces).toBe(5);
    }
  });

  test("counts characters without spaces", () => {
    const result = analyzeText("Hello World");
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.characters).toBe(11);
      expect(result.value.charactersNoSpaces).toBe(10);
    }
  });

  test("counts words correctly", () => {
    const result = analyzeText("one two three");
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.words).toBe(3);
    }
  });

  test("counts lines correctly", () => {
    const result = analyzeText("line1\nline2\nline3");
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.lines).toBe(3);
    }
  });

  test("counts paragraphs correctly", () => {
    const result = analyzeText(
      "First paragraph.\n\nSecond paragraph.\n\nThird.",
    );
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.paragraphs).toBe(3);
    }
  });

  test("handles single paragraph", () => {
    const result = analyzeText("Just one paragraph here.");
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.paragraphs).toBe(1);
    }
  });
});

describe("formatStats", () => {
  test("formats stats as readable text", () => {
    const stats = {
      characters: 100,
      charactersNoSpaces: 80,
      words: 20,
      lines: 5,
      paragraphs: 2,
    };

    const formatted = formatStats(stats);

    expect(formatted).toContain("Characters: 100");
    expect(formatted).toContain("Characters (no spaces): 80");
    expect(formatted).toContain("Words: 20");
    expect(formatted).toContain("Lines: 5");
    expect(formatted).toContain("Paragraphs: 2");
  });
});
