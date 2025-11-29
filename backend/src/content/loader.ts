import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import { marked } from "marked";

export type Locale = "en" | "de";
export type Mode = "NORMAL" | "VET";

export interface RiddleContent {
  title: string;
  body: string;
  solution: string;
}

export class RiddleNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RiddleNotFoundError";
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONTENT_ROOT = path.join(__dirname, "..", "..", "content");

function buildFilePath(day: number, locale: Locale, mode: Mode) {
  const paddedDay = String(day).padStart(2, "0");
  const difficulty = mode === "VET" ? "vet" : "normal";
  return path.join(CONTENT_ROOT, `day${paddedDay}`, `${difficulty}.${locale}.md`);
}

export async function loadRiddle(day: number, locale: Locale, mode: Mode): Promise<RiddleContent> {
  const filePath = buildFilePath(day, locale, mode);

  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = matter(raw);

    if (!parsed.data.title || !parsed.data.solution) {
      throw new Error("Missing required frontmatter fields");
    }

    const htmlBody = marked.parse(parsed.content);

    return {
      title: String(parsed.data.title),
      solution: String(parsed.data.solution),
      body: typeof htmlBody === "string" ? htmlBody : String(htmlBody),
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new RiddleNotFoundError("Riddle not found for given parameters");
    }
    throw error;
  }
}
