/**
 * Access-token failures from auth middleware and protected handlers.
 * Business 401s, such as a wrong current password, are intentionally absent.
 */
const TOKEN_AUTH_FAILURE_MESSAGES = new Set([
  "Not authorized. No token provided.",
  "Invalid or expired token.",
  "Invalid token payload.",
  "User no longer exists.",
  "Session is no longer valid. Please sign in again.",
  "Unauthorized",
]);

export interface RefreshDecision {
  status: number | undefined;
  url: string | undefined;
  method: string | undefined;
  message: string | undefined;
  alreadyRetried: boolean;
}

export function shouldAttemptRefresh(input: RefreshDecision): boolean {
  if (input.status !== 401 || input.alreadyRetried) return false;
  if (!input.message || !TOKEN_AUTH_FAILURE_MESSAGES.has(input.message)) {
    return false;
  }

  const url = input.url ?? "";
  const method = (input.method ?? "get").toLowerCase();

  if (url.includes("/token") || url.includes("/sessions")) return false;
  if (method === "post" && /\/users\/?$/.test(url)) return false;

  return true;
}

export function singleFlight<T>(task: () => Promise<T>): () => Promise<T> {
  let current: Promise<T> | null = null;

  return () => {
    if (!current) {
      current = task().finally(() => {
        current = null;
      });
    }

    return current;
  };
}
