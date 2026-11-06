import React from "react";

/**
 * Componente oficial do Logo Vertical com Descritivo do Bradesco
 * Baseado no Brandbook Bradesco (Páginas 4, 6, 10, 24 e 25):
 * - Símbolo com arcos da árvore e pilares com corte a 30°
 * - Tipografia 'bradesco' em caixa baixa (Bradesco Sans)
 * - Descritivo em caixa baixa abaixo da marca (ex: 'acadêmico', 'prime', 'universitário')
 * - Assinatura opcional 'Você primeiro.' abaixo do logotipo
 * - Suporte a cores institucionais (Vermelho #CC092F, Vermelho Escuro #900F15, Branco Negativo #FFFFFF)
 */
export function BradescoLogo({
  descritivo = "prime",
  colorScheme = "auto", // 'auto' | 'red' | 'white' | 'darkRed'
  isDarkMode = false,
  showTagline = true,
  size = "md", // 'sm' | 'md' | 'lg'
  withEffect2D = false,
  className = "",
}) {
  // Determina a cor com base no tema e propriedades
  let primaryColor = "#CC092F"; // Vermelho Bradesco (PMS 186)
  let textColor = "#CC092F";
  let descritivoColor = "#737373";

  if (colorScheme === "white" || (colorScheme === "auto" && isDarkMode)) {
    primaryColor = "#FFFFFF";
    textColor = "#FFFFFF";
    descritivoColor = "#D4D4D8";
  } else if (colorScheme === "darkRed") {
    primaryColor = "#900F15";
    textColor = "#900F15";
    descritivoColor = "#900F15";
  } else {
    primaryColor = "#CC092F";
    textColor = "#CC092F";
    descritivoColor = "#595959";
  }

  // Escalas de tamanho
  const dimensions = {
    sm: {
      symbolWidth: 54,
      symbolHeight: 46,
      fontSize: 24,
      descSize: 13,
      tagSize: 10,
      gap: 10,
    },
    md: {
      symbolWidth: 72,
      symbolHeight: 62,
      fontSize: 32,
      descSize: 17,
      tagSize: 12,
      gap: 14,
    },
    lg: {
      symbolWidth: 96,
      symbolHeight: 82,
      fontSize: 42,
      descSize: 22,
      tagSize: 14,
      gap: 18,
    },
  }[size] || {
    symbolWidth: 72,
    symbolHeight: 62,
    fontSize: 32,
    descSize: 17,
    tagSize: 12,
    gap: 14,
  };

  return (
    <div
      className={`bradesco-logo-vertical flex flex-col items-center select-none text-center ${className}`}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: `${dimensions.gap}px`,
      }}
    >
      {/* Símbolo Bradesco com fidelidade ao Brandbook */}
      <div
        className="bradesco-symbol-wrapper"
        style={{
          filter: withEffect2D
            ? "drop-shadow(0 4px 12px rgba(204, 9, 47, 0.35))"
            : "none",
          transition: "all 0.3s ease",
        }}
      >
        <svg
          width={dimensions.symbolWidth}
          height={dimensions.symbolHeight}
          viewBox="0 0 100 86"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Símbolo Bradesco"
          style={{ display: "block", overflow: "visible" }}
        >
          <defs>
            {/* Gradiente sutil para versão com Efeito 2D (Brandbook p.25) */}
            <linearGradient
              id="bradesco2dGrad"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop
                offset="0%"
                stopColor={isDarkMode ? "#FF4D6D" : "#E00B39"}
              />
              <stop
                offset="100%"
                stopColor={isDarkMode ? "#FFFFFF" : "#CC092F"}
              />
            </linearGradient>
            <linearGradient id="trunkGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor={primaryColor} />
              <stop
                offset="100%"
                stopColor={isDarkMode ? "#FF8095" : primaryColor}
              />
            </linearGradient>
          </defs>

          {/* Símbolo Bradesco: Arcos e Tronco */}
          {/* Tronco Esquerdo com corte a 30° */}
          <path
            d="M40 76 V56.5 L46 53 V76 H40 Z"
            fill={withEffect2D ? "url(#trunkGrad)" : primaryColor}
          />

          {/* Tronco Direito com corte a 30° */}
          <path
            d="M49 76 V51.5 L55 48 V76 H49 Z"
            fill={withEffect2D ? "url(#trunkGrad)" : primaryColor}
          />

          {/* Arco Principal Superior (Copa protetora da árvore) */}
          <path
            d="M21 44.5 C 24 25, 48 11.5, 78 20 C 65 19, 44 24, 30 36.5 C 27 39, 23 42, 21 44.5 Z"
            fill={withEffect2D ? "url(#bradesco2dGrad)" : primaryColor}
          />

          {/* Arco Transversal / Conexão (Faixa e esfera celeste) */}
          <path
            d="M27.5 48.5 C 37 36, 58 29.5, 87 40 C 72 35.5, 49 37.5, 33 49 C 30 51, 28 50, 27.5 48.5 Z"
            fill={withEffect2D ? "url(#bradesco2dGrad)" : primaryColor}
          />

          {/* Arco envolvente de acolhimento (Curva inferior de ligação) */}
          <path
            d="M17.5 44 C 20.5 41, 26 39, 31 43 C 24 45, 19 46.5, 17.5 44 Z"
            fill={withEffect2D ? "url(#bradesco2dGrad)" : primaryColor}
          />
        </svg>
      </div>

      {/* Tipografia 'bradesco' + descritivo */}
      <div
        className="bradesco-wordmark-container"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          lineHeight: 1.15,
        }}
      >
        {/* Nome da Marca 'bradesco' em caixa baixa, Bradesco Sans */}
        <span
          style={{
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            fontSize: `${dimensions.fontSize}px`,
            fontWeight: 800,
            letterSpacing: "-0.035em",
            color: textColor,
            transition: "color 0.3s ease",
            textTransform: "lowercase",
          }}
        >
          bradesco
        </span>

        {/* Descritivo do Segmento (Brandbook Página 6 - Versão Secundária Vertical) */}
        {descritivo && (
          <span
            className="bradesco-descritivo"
            style={{
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
              fontSize: `${dimensions.descSize}px`,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              color: descritivoColor,
              marginTop: "1px",
              textTransform: "lowercase",
              transition: "color 0.3s ease",
            }}
          >
            {descritivo}
          </span>
        )}

        {/* Assinatura 'Você primeiro.' (Brandbook Página 24) */}
        {showTagline && (
          <span
            style={{
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
              fontSize: `${dimensions.tagSize}px`,
              fontWeight: 600,
              letterSpacing: "0.01em",
              color: isDarkMode ? "#A1A1AA" : "#8C8C94",
              marginTop: "6px",
            }}
          >
            Você primeiro.
          </span>
        )}
      </div>
    </div>
  );
}
export default BradescoLogo;
