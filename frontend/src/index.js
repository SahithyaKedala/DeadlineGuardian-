import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Toaster } from "react-hot-toast";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <App />
        <Toaster position="top-right" toastOptions={{
          style: { background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)" }
        }} />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);