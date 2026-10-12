/**
 * Ends a server session, then always clears local auth state.
 * Logout must not leave an access token behind when the request fails.
 */
export async function endSession(
  request: () => Promise<unknown>,
  clear: () => void,
): Promise<void> {
  try {
    await request();
  } catch {
    // The browser session still has to end if the network call fails.
  } finally {
    clear();
  }
}
