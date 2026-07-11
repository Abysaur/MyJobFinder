import pdfParse from "pdf-parse";

export async function parsePdf(buffer: Buffer): Promise<string> {
  try {
    const result = await pdfParse(buffer);
    const text = result.text.trim();
    if (!text) throw new Error("empty");
    return text;
  } catch {
    throw new Error("Could not read PDF file.");
  }
}
