// eslint-disable-next-line @typescript-eslint/no-require-imports
import pdf = require("pdf-parse");
import * as mammoth from "mammoth";

export type CvTextKind = "pdf" | "docx" | "text";

export const MAX_CV_TEXT_CHARS = 40_000;

const DOCX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const FILE_EXTENSION = /\.[^.\s]+$/;

// Formats that are never a CV we can read (images, .doc, vCards, HTML,
// spreadsheets…): such files are skipped without being downloaded.
const NON_CV_EXTENSIONS = [
  ".doc",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".bmp",
  ".svg",
  ".heic",
  ".ics",
  ".vcf",
  ".htm",
  ".html",
  ".csv",
  ".xml",
  ".json",
  ".eml",
  ".p7s",
  ".rtf",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".odt",
  ".zip",
  ".rar",
  ".7z",
];

const PDF_SIGNATURE = Buffer.from("%PDF-");
// DOCX is a ZIP container; mammoth rejects a ZIP that is not a Word document.
const ZIP_SIGNATURE = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
// Legacy .doc (OLE compound file) — not supported by any parser we use.
const OLE_SIGNATURE = Buffer.from([0xd0, 0xcf, 0x11, 0xe0]);

export function isUnsupportedCvFilename(filename: string): boolean {
  const lowerFilename = filename.toLowerCase();
  return NON_CV_EXTENSIONS.some((ext) => lowerFilename.endsWith(ext));
}

export function detectCvTextKind(file: {
  filename: string;
  contentType?: string | null;
  buffer?: Buffer;
}): CvTextKind | null {
  const filename = file.filename.toLowerCase();
  const contentType = file.contentType?.toLowerCase() ?? "";

  if (contentType === "application/pdf" || filename.endsWith(".pdf")) {
    return "pdf";
  }
  if (contentType === DOCX_MIME_TYPE || filename.endsWith(".docx")) {
    return "docx";
  }
  if (contentType === "text/plain" || filename.endsWith(".txt")) {
    return "text";
  }
  if (isUnsupportedCvFilename(filename) || !file.buffer) {
    return null;
  }

  // Stored CVs often have no usable name ("attachment", a URL segment like
  // "view", "resume.php", "John.Doe"), so fall back to the file's signature.
  const buffer = file.buffer;
  if (startsWith(buffer, PDF_SIGNATURE)) return "pdf";
  if (startsWith(buffer, ZIP_SIGNATURE)) return "docx";
  if (startsWith(buffer, OLE_SIGNATURE)) return null;

  // Text has no signature, so only trust it when the name claims nothing:
  // an unknown extension that decodes as text is more likely HTML or a
  // script's output than a CV.
  if (!FILE_EXTENSION.test(filename) && looksLikeText(buffer)) return "text";

  return null;
}

export async function extractCvText(
  buffer: Buffer,
  kind: CvTextKind,
): Promise<string> {
  let text: string;

  if (kind === "text") {
    text = buffer.toString("utf8");
  } else if (kind === "docx") {
    text = (await mammoth.extractRawText({ buffer })).value;
  } else {
    try {
      text = (await pdf(buffer)).text;
    } catch (error) {
      if (!looksLikeText(buffer)) throw error;
      text = buffer.toString("utf8");
    }
  }

  return text.trim().slice(0, MAX_CV_TEXT_CHARS);
}

function startsWith(buffer: Buffer, signature: Buffer): boolean {
  return (
    buffer.length >= signature.length &&
    buffer.subarray(0, signature.length).equals(signature)
  );
}

function looksLikeText(buffer: Buffer): boolean {
  const text = buffer.toString("utf8");
  if (!text.trim() || text.includes("\u0000")) return false;

  // Binary data decoded as UTF-8 is full of replacement and control chars;
  // Unicode-aware so Cyrillic CVs count as text.
  const suspicious = text.match(/�|[^\P{C}\n\r\t]/gu)?.length ?? 0;
  return suspicious / text.length < 0.05;
}
