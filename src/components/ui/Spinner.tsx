export function Spinner({ label }: { label: string }) {
  return (
    <div role="status" className="flex items-center gap-3 text-sm text-slate-700">
      <span
        aria-hidden="true"
        className="h-4 w-4 animate-spin rounded-full border-2 border-pine border-r-transparent"
      />
      {label}
    </div>
  );
}

export function FullPageSpinner({ label }: { label: string }) {
  return (
    <div className="grid min-h-[50vh] place-items-center px-4">
      <Spinner label={label} />
    </div>
  );
}
