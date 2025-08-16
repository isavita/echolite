/**
 * Safely reads the text from a Response object, returning an empty string on failure.
 * This is useful for parsing error responses that may or may not have a body.
 * @param r The Response object.
 * @returns A promise that resolves to the text content or an empty string.
 */
export async function safeText(r: Response): Promise<string> {
  try {
    return await r.text();
  } catch {
    return "";
  }
}
