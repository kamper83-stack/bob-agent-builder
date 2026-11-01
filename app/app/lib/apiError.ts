/** Turns a failed /api response into a message that is safe to show the user. */
export async function apiErrorMessage(res: Response): Promise<string> {
  try {
    const { detail } = await res.json();
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.map((d: { msg: string }) => d.msg).join("; ");
  } catch {}
  return `Request failed (${res.status})`;
}
