import { AppProviders } from "./app/providers";
import { AppRouter } from "./app/router";
import { Alert } from "./components/ui/Alert";

export function App() {
  const apiConfigured = Boolean(import.meta.env.VITE_API_BASE_URL);

  return (
    <AppProviders>
      {apiConfigured ? null : (
        <div className="border-b border-rose-200 bg-rose-50 px-4 py-3">
          <Alert tone="error">
            VITE_API_BASE_URL is missing. Copy frontend/.env.example to frontend/.env and restart
            the dev server.
          </Alert>
        </div>
      )}
      <AppRouter />
    </AppProviders>
  );
}
