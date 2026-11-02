export function decodeUploadedFilename(filename) {
  if (!filename) {
    return filename;
  }

  try {
    const bytes = Uint8Array.from(filename, (char) => char.charCodeAt(0) & 255);
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);

    return decoded || filename;
  } catch {
    return filename;
  }
}
