import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App";

// One React Query client for the whole app. It caches every forecast by spot id
// so we fetch each one at most once — essential now that the catalog has
// thousands of spots and we load forecasts lazily (featured + on demand).
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 60 * 1000, // forecasts are cached server-side for 1h too
      gcTime: 60 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// BrowserRouter connects the app to the browser URL bar so <Routes> can
// pick which page to show. It must sit above everything that uses routing.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
