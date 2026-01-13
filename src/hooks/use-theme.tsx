import { useEffect, useLayoutEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "car-guide-theme";

const getStoredTheme = (): Theme | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return null;
};

const getSystemTheme = (): Theme => {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export const useTheme = () => {
  const storedTheme = useMemo(() => getStoredTheme(), []);
  const [theme, setTheme] = useState<Theme>(storedTheme ?? getSystemTheme());
  const [hasStoredPreference, setHasStoredPreference] = useState(
    storedTheme !== null,
  );

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    if (!hasStoredPreference) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [hasStoredPreference, theme]);

  useEffect(() => {
    if (hasStoredPreference) {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      setTheme(mediaQuery.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [hasStoredPreference]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
    setHasStoredPreference(true);
  };

  return {
    theme,
    toggleTheme,
  };
};
