import React, { useContext } from "react";
import { Moon, Sun } from "lucide-react";
import ThemeContext from "../ThemeContext";
import "../styles/ThemeToggle.css";

const ThemeToggle = ({ className = "" }) => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`.trim()}
      onClick={toggleTheme}
      aria-label={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
      <span className="theme-toggle__label">{isDark ? "Claro" : "Oscuro"}</span>
    </button>
  );
};

export default ThemeToggle;
