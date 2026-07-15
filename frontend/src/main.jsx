import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import OfflineCenter from "./components/OfflineCenter";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { analyticsApi } from "./lib/api";
import { observeWebVitals } from "./lib/performance";
import { installProductAnalytics } from "./lib/productAnalytics";
import "./index.css";

installProductAnalytics();

if ("serviceWorker" in navigator)
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js"));

observeWebVitals((metric) => {
  analyticsApi
    .track({
      name: "web_vital",
      path: metric.path,
      props: { metric: metric.name, value: metric.value, rating: metric.rating },
    })
    .catch(() => {});
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <App />
            <OfflineCenter />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
