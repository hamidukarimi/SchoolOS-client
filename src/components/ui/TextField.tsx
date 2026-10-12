import { forwardRef, type InputHTMLAttributes } from "react";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField({ label, error, hint, id, name, className = "", ...props }, ref) {
    const fieldId = id ?? name;
    const descriptionId = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;

    return (
      <div className="grid gap-1.5">
        <label htmlFor={fieldId} className="text-sm font-medium text-ink">
          {label}
        </label>
        <input
          ref={ref}
          id={fieldId}
          name={name}
          aria-invalid={error ? true : undefined}
          aria-describedby={descriptionId}
          className={`rounded-lg border bg-white px-3 py-2.5 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-pine ${
            error ? "border-rose-600" : "border-line"
          } ${className}`}
          {...props}
        />
        {hint && !error ? (
          <p id={`${fieldId}-hint`} className="text-sm text-slate-600">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p id={`${fieldId}-error`} className="text-sm text-rose-700">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);
