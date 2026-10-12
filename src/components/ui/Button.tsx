import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const variantClass: Record<ButtonVariant, string> = {
  primary: "bg-pine text-white hover:bg-pine-dark",
  secondary: "border border-line bg-white text-ink hover:bg-mist",
  ghost: "text-ink hover:bg-mist",
  danger: "bg-rose-700 text-white hover:bg-rose-800",
};

export function buttonClass(variant: ButtonVariant = "primary", className = ""): string {
  return [
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium",
    "transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-60",
    variantClass[variant],
    className,
  ].join(" ");
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  busy?: boolean;
}

export function Button({
  variant = "primary",
  busy = false,
  className = "",
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClass(variant, className)}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      {...props}
    >
      {children}
    </button>
  );
}
