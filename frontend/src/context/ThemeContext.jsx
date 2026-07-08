import { createContext, useContext } from "react";

// Dark mode olib tashlandi — sayt doim yorug' (light) rejimda ishlaydi.
// Eski useTheme()/ThemeProvider chaqiruvlari buzilmasligi uchun API saqlanadi,
// lekin theme hech qachon "dark" bo'lmaydi va <html>ga .dark klassi qo'shilmaydi.
const LIGHT = { theme: "light", setTheme: () => {}, toggleTheme: () => {} };

const ThemeContext = createContext(LIGHT);

export function ThemeProvider({ children }) {
  return (
    <ThemeContext.Provider value={LIGHT}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext) ?? LIGHT;
}
