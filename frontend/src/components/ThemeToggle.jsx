import React from "react";
import { Sun, Moon } from "lucide-react";

/**
 * Componente de alternância de tema Claro / Escuro
 * Posicionado no canto superior direito conforme solicitado.
 */
export function ThemeToggle({ isDarkMode, onToggle }) {
  return (
    <div className="theme-toggle-container">
      <button
        type="button"
        id="theme-toggle-btn"
        className={`theme-toggle-pill ${isDarkMode ? "dark-active" : "light-active"}`}
        onClick={onToggle}
        aria-label={isDarkMode ? "Ativar modo claro" : "Ativar modo escuro"}
        title={isDarkMode ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
      >
        {/* Ícone e label do modo claro */}
        <span className={`toggle-option ${!isDarkMode ? "selected" : ""}`}>
          <Sun size={15} strokeWidth={2.2} className="toggle-icon sun-icon" />
          <span className="toggle-text">Claro</span>
        </span>

        {/* Ícone e label do modo escuro */}
        <span className={`toggle-option ${isDarkMode ? "selected" : ""}`}>
          <Moon size={15} strokeWidth={2.2} className="toggle-icon moon-icon" />
          <span className="toggle-text">Escuro</span>
        </span>

        {/* Indicador deslizante (slider pill) */}
        <span className="slider-indicator" aria-hidden="true" />
      </button>
    </div>
  );
}

export default ThemeToggle;
