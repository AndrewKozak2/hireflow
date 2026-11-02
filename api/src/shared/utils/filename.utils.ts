export function decodeUploadedFilename(filename: string): string {
  const decoded = Buffer.from(filename, "latin1").toString("utf8");

  return decoded.includes("\uFFFD") ? filename : decoded;
}
