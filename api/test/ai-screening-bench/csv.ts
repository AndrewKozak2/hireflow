/** Minimal RFC 4180 CSV: fields with a comma, quote, CR or LF are quoted, quotes doubled. */

export type CsvValue = string | number | null;

function formatField(value: CsvValue): string {
  if (value === null) return "";
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(header: string[], records: CsvValue[][]): string {
  return (
    [header, ...records]
      .map((record) => record.map(formatField).join(","))
      .join("\r\n") + "\r\n"
  );
}

export function parseCsv(text: string): string[][] {
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let quoted = false;
  let fieldStarted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"' && !fieldStarted) {
      quoted = true;
      fieldStarted = true;
    } else if (char === ",") {
      record.push(field);
      field = "";
      fieldStarted = false;
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      record.push(field);
      records.push(record);
      record = [];
      field = "";
      fieldStarted = false;
    } else {
      field += char;
      fieldStarted = true;
    }
  }

  if (quoted) {
    throw new Error("CSV ends inside a quoted field");
  }
  if (fieldStarted || record.length > 0) {
    record.push(field);
    records.push(record);
  }
  return records;
}
