import { useQuery } from "@tanstack/react-query";
import { fetchUnreadNotificationCount, notificationUnreadKey } from "./api";
import { unreadBadgeLabel } from "./display";

export function UnreadCountBadge() {
  const query = useQuery({
    queryKey: notificationUnreadKey(),
    queryFn: fetchUnreadNotificationCount,
    staleTime: 30_000,
  });
  const label = unreadBadgeLabel(query.data);
  if (!label) return null;
  return (
    <span
      className="rounded-full bg-pine px-2 py-0.5 text-xs font-medium text-white"
      aria-label={`${query.data} unread`}
    >
      {label}
    </span>
  );
}
