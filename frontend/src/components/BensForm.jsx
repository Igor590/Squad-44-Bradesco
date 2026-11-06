import { api } from "../api";
import React, { useState } from "react";
import {
  Car,
  Home,
  Package,
  DollarSign,
  FileText,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Check,
  Award,
} from "lucide-react";

export function BensForm({ onSuccessCadastroBem }) {
  const [tipoBem, setTipoBem] = useState("veiculo");
  const [descricao, setDescricao] = useState("");
  const [valorBem, setValorBem] = useState("");
  const [identificacao, setIdentificacao] = useState("");
  const [condicaoBem, setCondicaoBem] = useState("seminovo");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleValorChange = (e) => {
    let raw = e.target.value.replace(/\D/g, "");
    if (!raw) {
      setValorBem("");
      return;
    }
    const valFloat = parseFloat(raw) / 100;
    setValorBem(
      valFloat.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      }),
    );
    setError("");
  };

  const handleAutoFill = () => {
    setTipoBem("veiculo");
    setDescricao("Toyota Corolla Sedan 2.0 Flex 2024");
    setIdentificacao("ABC-1D23");
    setValorBem("R$ 120.000,00");
    setCondicaoBem("seminovo");
    setError("");
  };

  const getNumericValue = () => {
    if (!valorBem) return 0;
    return parseFloat(valorBem.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
  };

  const numericValue = getNumericValue();
  const estimatedFinanciamento = numericValue > 0 ? numericValue * 0.9 : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!descricao.trim()) {
      setError(
        "Por favor, descreva o modelo ou características do bem que deseja financiar.",
      );
      return;
    }
    if (!numericValue || numericValue <= 0) {
      setError("O valor avaliado do bem deve ser maior que R$ 0,00.");
      return;
    }

    setIsLoading(true);

    try {
      const payload = await api("/bens", {
        method: "POST",
        body: {
          tipoBem,
          descricao,
          identificacao,
          condicaoBem,
          valorNumerico: numericValue,
        },
      });
      onSuccessCadastroBem(payload);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getTipoLabel = () => {
    switch (tipoBem) {
      case "veiculo":
        return "Veículo Automotor";
      case "imovel":
        return "Imóvel Residencial / Comercial";
      default:
        return "Equipamento ou Outro Bem";
    }
  };

  return (
    <form className="bens-form-fullscreen" onSubmit={handleSubmit} noValidate>
      {/* Cabeçalho da Tela de Cadastro de Bens */}
      <div className="bens-screen-header">
        <div className="bens-header-text">
          <div className="bens-stage-badge">
            <span className="badge-dot" />
            <span>Etapa 1 de 3 • Identificação da Garantia</span>
          </div>
          <h2 className="bens-title">Cadastro do Bem para Financiamento</h2>
          <p className="bens-subtitle">
            Informe os dados do veículo, imóvel ou equipamento que você deseja
            financiar. O bem será utilizado como referência para o cálculo do
            seu financiamento.
          </p>
        </div>

        <div className="bens-header-actions">
          <button
            type="button"
            className="demo-autofill-btn"
            onClick={handleAutoFill}
            title="Preencher com dados de exemplo de veículo"
          >
            <Sparkles size={14} />
            <span>Preencher bem de exemplo</span>
          </button>
        </div>
      </div>

      {error && (
        <div
          className="auth-alert error animate-shake"
          role="alert"
          style={{ marginBottom: "1.5rem" }}
        >
          <span>{error}</span>
        </div>
      )}

      {/* Grid Principal: Formulário à esquerda e Resumo à direita */}
      <div className="bens-grid-layout">
        {/* COLUNA ESQUERDA: CAMPOS DO FORMULÁRIO */}
        <div className="bens-form-main">
          {/* SEÇÃO 1: TIPO DE BEM */}
          <div className="form-section-block">
            <label className="form-section-title">
              1. Selecione a Categoria do Bem
            </label>
            <div className="bens-type-grid" role="radiogroup">
              {/* Card Veículo */}
              <div
                role="radio"
                aria-checked={tipoBem === "veiculo"}
                tabIndex={0}
                className={`bens-type-card ${tipoBem === "veiculo" ? "active" : ""}`}
                onClick={() => setTipoBem("veiculo")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setTipoBem("veiculo");
                  }
                }}
              >
                <div className="type-card-top">
                  <div className="type-icon-box">
                    <Car size={26} />
                  </div>
                  <div className="type-check-indicator">
                    {tipoBem === "veiculo" && <Check size={14} />}
                  </div>
                </div>
                <div className="type-info">
                  <span className="type-title">Veículo</span>
                  <span className="type-desc">
                    Carros, motos, caminhões e utilitários leves
                  </span>
                </div>
                <div className="type-tag">Financiamento até 90%</div>
              </div>

              {/* Card Imóvel */}
              <div
                role="radio"
                aria-checked={tipoBem === "imovel"}
                tabIndex={0}
                className={`bens-type-card ${tipoBem === "imovel" ? "active" : ""}`}
                onClick={() => setTipoBem("imovel")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setTipoBem("imovel");
                  }
                }}
              >
                <div className="type-card-top">
                  <div className="type-icon-box">
                    <Home size={26} />
                  </div>
                  <div className="type-check-indicator">
                    {tipoBem === "imovel" && <Check size={14} />}
                  </div>
                </div>
                <div className="type-info">
                  <span className="type-title">Imóvel</span>
                  <span className="type-desc">
                    Casas, apartamentos, terrenos ou comercial
                  </span>
                </div>
                <div className="type-tag">Financiamento até 90%</div>
              </div>
              {/* Card Outros Bens */}
              <div
                role="radio"
                aria-checked={tipoBem === "outro"}
                tabIndex={0}
                className={`bens-type-card ${tipoBem === "outro" ? "active" : ""}`}
                onClick={() => setTipoBem("outro")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setTipoBem("outro");
                  }
                }}
              >
                <div className="type-card-top">
                  <div className="type-icon-box">
                    <Package size={26} />
                  </div>
                  <div className="type-check-indicator">
                    {tipoBem === "outro" && <Check size={14} />}
                  </div>
                </div>
                <div className="type-info">
                  <span className="type-title">Outros Bens</span>
                  <span className="type-desc">
                    Máquinas agrícolas, embarcações e equipamentos
                  </span>
                </div>
                <div className="type-tag">Financiamento até 90%</div>
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: DADOS DETALHADOS DO BEM */}
          <div className="form-section-block">
            <label className="form-section-title">
              2. Detalhes e Identificação do Bem
            </label>

            <div className="bens-inputs-grid">
              {/* Descrição / Modelo */}
              <div className="form-group span-full">
                <label htmlFor="bem-descricao" className="form-label">
                  Descrição Completa / Modelo do Bem
                </label>
                <div className="input-with-icon">
                  <FileText size={18} className="input-icon" />
                  <input
                    id="bem-descricao"
                    type="text"
                    className="form-input"
                    placeholder={
                      tipoBem === "veiculo"
                        ? "Ex: Toyota Corolla Altis 2.0 Flex Automático 2024"
                        : tipoBem === "imovel"
                          ? "Ex: Apartamento 3 quartos 85m² - Vila Mariana, São Paulo/SP"
                          : "Ex: Trator Agrícola John Deere 5078E 2023"
                    }
                    value={descricao}
                    onChange={(e) => {
                      setDescricao(e.target.value);
                      setError("");
                    }}
                    required
                  />
                </div>
              </div>

              {/* Identificação Oficial */}
              <div className="form-group">
                <label htmlFor="bem-identificacao" className="form-label">
                  {tipoBem === "veiculo"
                    ? "Placa ou Chassi do Veículo"
                    : tipoBem === "imovel"
                      ? "Matrícula no Cartório de Imóveis"
                      : "Nº de Série ou Nota Fiscal"}
                </label>
                <div className="input-with-icon">
                  <ShieldCheck size={18} className="input-icon" />
                  <input
                    id="bem-identificacao"
                    type="text"
                    className="form-input"
                    placeholder={
                      tipoBem === "veiculo"
                        ? "Ex: ABC-1D23 ou 9BW..."
                        : tipoBem === "imovel"
                          ? "Ex: Matrícula nº 142.890 (2º RI)"
                          : "Ex: SN-849201948"
                    }
                    value={identificacao}
                    onChange={(e) => setIdentificacao(e.target.value)}
                  />
                </div>
              </div>

              {/* Valor Avaliado */}
              <div className="form-group">
                <label htmlFor="bem-valor" className="form-label">
                  Valor de Avaliação / Mercado (R$)
                </label>
                <div className="input-with-icon">
                  <DollarSign size={18} className="input-icon" />
                  <input
                    id="bem-valor"
                    type="text"
                    className="form-input font-semibold"
                    placeholder="R$ 0,00"
                    value={valorBem}
                    onChange={handleValorChange}
                    required
                  />
                </div>
              </div>

              {/* Condição do Bem */}
              <div className="form-group span-full">
                <label className="form-label">Condição do Bem</label>
                <div className="condition-toggle-row">
                  <button
                    type="button"
                    className={`condition-pill ${condicaoBem === "novo" ? "active" : ""}`}
                    onClick={() => setCondicaoBem("novo")}
                  >
                    <span>Novo / 0 Km</span>
                  </button>
                  <button
                    type="button"
                    className={`condition-pill ${condicaoBem === "seminovo" ? "active" : ""}`}
                    onClick={() => setCondicaoBem("seminovo")}
                  >
                    <span>Seminovo / Usado</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Botão de Envio Principal */}
          <div className="bens-actions-row">
            <button
              type="submit"
              className="btn-primary-bradesco bens-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="btn-loading-content">
                  <span className="spinner-circle" />
                  <span>Registrando bem na base Bradesco...</span>
                </span>
              ) : (
                <span className="btn-content">
                  <span>Cadastrar Bem e Avançar para Simulação</span>
                  <ArrowRight size={18} className="btn-arrow-icon" />
                </span>
              )}
            </button>
          </div>
        </div>

        {/* COLUNA DIREITA: PAINEL DE RESUMO E BENEFÍCIOS */}
        <aside className="bens-preview-sidebar">
          <div className="preview-sticky-card">
            <div className="preview-card-header">
              <div className="preview-badge">
                <Award size={15} />
                <span>Resumo da Garantia</span>
              </div>
            </div>

            <div className="preview-bem-highlight">
              <div className="preview-icon-circle">
                {tipoBem === "veiculo" ? (
                  <Car size={28} />
                ) : tipoBem === "imovel" ? (
                  <Home size={28} />
                ) : (
                  <Package size={28} />
                )}
              </div>
              <div className="preview-highlight-info">
                <span className="preview-type-name">{getTipoLabel()}</span>
                <span className="preview-model-name">
                  {descricao || "Aguardando descrição do bem..."}
                </span>
              </div>
            </div>

            <div className="preview-metrics-box">
              <div className="preview-metric-row">
                <span className="metric-label">Identificação:</span>
                <strong className="metric-value">
                  {identificacao || "Aguardando"}
                </strong>
              </div>
              <div className="preview-metric-row">
                <span className="metric-label">Condição:</span>
                <strong className="metric-value">
                  {condicaoBem === "novo" ? "Novo (0 Km)" : "Seminovo / Usado"}
                </strong>
              </div>
              <div className="preview-metric-row">
                <span className="metric-label">Valor Avaliado:</span>
                <strong className="metric-value highlight-red">
                  {valorBem || "R$ 0,00"}
                </strong>
              </div>
              <div className="preview-metric-divider" />
              <div className="preview-metric-row">
                <span className="metric-label">
                  Crédito Estimado (até 90%):
                </span>
                <strong className="metric-value highlight-green">
                  {estimatedFinanciamento > 0
                    ? estimatedFinanciamento.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })
                    : "R$ 0,00"}
                </strong>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </form>
  );
}

export default BensForm;
