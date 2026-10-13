export const MESSAGE_PAGE_SIZE = 20;

export function parseMessagePage(params: URLSearchParams): number {
  const page = Number(params.get("page"));
  return Number.isInteger(page) && page > 0 ? page : 1;
}
