export async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
