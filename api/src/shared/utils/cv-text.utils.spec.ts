import * as mammoth from "mammoth";
import {
  detectCvTextKind,
  extractCvText,
  isUnsupportedCvFilename,
  MAX_CV_TEXT_CHARS,
} from "./cv-text.utils";

jest.mock("pdf-parse", () => jest.fn());
jest.mock("mammoth", () => ({ extractRawText: jest.fn() }));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockPdf = require("pdf-parse") as jest.Mock;
const mockExtractRawText = mammoth.extractRawText as jest.Mock;

describe("cv-text utils", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("detectCvTextKind", () => {
    it.each([
      ["cv.pdf", null, "pdf"],
      ["CV.PDF", null, "pdf"],
      ["cv.docx", null, "docx"],
      ["cv.txt", null, "text"],
      ["attachment", "application/pdf", "pdf"],
      [
        "attachment",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "docx",
      ],
    ])(
      "should detect %s (%s) as %s by name or content type",
      (filename, contentType, expected) => {
        expect(detectCvTextKind({ filename, contentType })).toBe(expected);
      },
    );

    it.each([
      ["a PDF", Buffer.from("%PDF-1.7\n..."), "pdf"],
      [
        "a ZIP (DOCX)",
        Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]),
        "docx",
      ],
      ["plain text", Buffer.from("John Doe\nBackend Developer"), "text"],
      [
        "Cyrillic text",
        Buffer.from("Іван Петренко\nBackend-розробник"),
        "text",
      ],
    ])(
      "should detect %s by its bytes when the name has no extension",
      (_label, buffer, expected) => {
        expect(detectCvTextKind({ filename: "attachment", buffer })).toBe(
          expected,
        );
      },
    );

    it.each([
      ["a legacy .doc", Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1])],
      ["binary data", Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0xff, 0xfe])],
    ])("should not detect %s", (_label, buffer) => {
      expect(detectCvTextKind({ filename: "view", buffer })).toBeNull();
    });

    it("should not detect a file with an unsupported extension, whatever its bytes", () => {
      expect(
        detectCvTextKind({
          filename: "logo.png",
          buffer: Buffer.from("%PDF-1.7"),
        }),
      ).toBeNull();
    });

    it.each([
      ["cv.bin", Buffer.from("%PDF-1.7"), "pdf"],
      ["John.Doe", Buffer.from("%PDF-1.7"), "pdf"],
      ["resume.php", Buffer.from([0x50, 0x4b, 0x03, 0x04]), "docx"],
      ["John.Doe", Buffer.from("John Doe\nBackend Developer"), null],
      ["resume.php", Buffer.from("<html><body>Sign in</body></html>"), null],
      ["John.vcard", Buffer.from("BEGIN:VCARD\nFN:John Doe\nEND:VCARD"), null],
      ["Іван.Петренко", Buffer.from("Іван Петренко\nBackend"), null],
    ])(
      "should detect %s with an unknown extension only by a binary signature",
      (filename, buffer, expected) => {
        expect(detectCvTextKind({ filename, buffer })).toBe(expected);
      },
    );

    it("should not detect a nameless file without its bytes", () => {
      expect(detectCvTextKind({ filename: "attachment" })).toBeNull();
    });
  });

  describe("isUnsupportedCvFilename", () => {
    it.each([
      ["logo.PNG", true],
      ["old-cv.doc", true],
      ["invite.ics", true],
      ["contact.vcf", true],
      ["signature.html", true],
      ["notes.csv", true],
      ["cv.docx", false],
      ["cv.pdf", false],
      ["attachment", false],
      ["attachment-2", false],
      ["CV.TXT", false],
      ["cv.final.docx", false],
      ["John.Doe", false],
      ["resume.php", false],
      ["Резюме Іван", false],
    ])("should return %s → %s", (filename, expected) => {
      expect(isUnsupportedCvFilename(filename)).toBe(expected);
    });
  });

  describe("extractCvText", () => {
    it("should extract DOCX text with mammoth", async () => {
      mockExtractRawText.mockResolvedValue({ value: "  DOCX text  " });

      await expect(extractCvText(Buffer.from("PK"), "docx")).resolves.toBe(
        "DOCX text",
      );
      expect(mockPdf).not.toHaveBeenCalled();
    });

    it("should extract PDF text with pdf-parse", async () => {
      mockPdf.mockResolvedValue({ text: "PDF text" });

      await expect(extractCvText(Buffer.from("%PDF-"), "pdf")).resolves.toBe(
        "PDF text",
      );
    });

    it("should fall back to UTF-8 when pdf-parse fails on a text file", async () => {
      mockPdf.mockRejectedValue(new Error("Invalid PDF structure"));

      await expect(
        extractCvText(Buffer.from("Plain CV text"), "pdf"),
      ).resolves.toBe("Plain CV text");
    });

    it("should rethrow when pdf-parse fails on binary data", async () => {
      mockPdf.mockRejectedValue(new Error("Invalid PDF structure"));

      await expect(
        extractCvText(Buffer.from([0x00, 0xff, 0xfe]), "pdf"),
      ).rejects.toThrow("Invalid PDF structure");
    });

    it("should cap the text at MAX_CV_TEXT_CHARS", async () => {
      const text = await extractCvText(
        Buffer.from("a".repeat(MAX_CV_TEXT_CHARS + 100)),
        "text",
      );

      expect(text).toHaveLength(MAX_CV_TEXT_CHARS);
    });
  });
});
