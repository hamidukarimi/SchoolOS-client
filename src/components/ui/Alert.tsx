import type { ReactNode } from "react";
import type { ParsedApiError } from "../../services/api-error";

type AlertTone = "error" | "success" | "info";

const toneClass: Record<AlertTone, string> = {
  error: "border-rose-200 bg-rose-50 text-rose-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-950",
  info: "border-line bg-mist text-ink",
};

export function Alert({
  tone,
  title,
  children,
}: {
  tone: AlertTone;
  title?: string;
  children?: ReactNode;
}) {
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-lg border px-4 py-3 text-sm ${toneClass[tone]}`}>
      {title ? <p className="font-medium">{title}</p> : null}
      {children ? <div className={title ? "mt-1" : undefined}>{children}</div> : null}
    </div>
  );
}

export function ServerErrorAlert({ error }: { error: ParsedApiError }) {
  return (
    <Alert tone="error" title={error.message}>
      {error.errors.length > 0 ? (
        <ul className="list-disc pl-5">
          {error.errors.map((item, index) => (
            <li key={`${item}-${index}`}>{item}</li>
          ))}
        </ul>
      ) : null}
    </Alert>
  );
}
