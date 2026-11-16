import { api, brl } from "./api";
import React, { useState, useEffect } from "react";
import BradescoLogo from "./components/BradescoLogo";
import ThemeToggle from "./components/ThemeToggle";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import BensForm from "./components/BensForm";
import SimulacaoForm from "./components/SimulacaoForm";
import AcompanhamentoView from "./components/AcompanhamentoView";
import MeusFinanciamentosView from "./components/MeusFinanciamentosView";
import ParcelasView from "./components/ParcelasView";
import HistoricoView from "./components/HistoricoView";
import InstitutionalFooter from "./components/InstitutionalFooter";
import {
  ShieldCheck,
  Sparkles,
  UserCheck,
  LogOut,
  ChevronRight,
  CircleCheck,
} from "lucide-react";
import "./App.css";

const PARCELAS_INICIAIS = [
  {
    id: 1,
    numero: 1,
    vencimento: "15/08/2026",
    valorOriginal: 2394.82,
    encargosAtraso: 0,
    status: "PAGA",
    valorTotalPago: 2394.82,
    dataPagamento: "2026-08-14",
    formaPagamento: "Débito em Conta Bradesco",
  },
  {
    id: 2,
    numero: 2,
    vencimento: "15/09/2026",
    valorOriginal: 2394.82,
    encargosAtraso: 0,
    status: "PAGA",
    valorTotalPago: 2394.82,
    dataPagamento: "2026-09-15",
    formaPagamento: "PIX",
  },
  {
    id: 3,
    numero: 3,
    vencimento: "15/10/2026",
    valorOriginal: 2394.82,
    encargosAtraso: 68.45,
    status: "ATRASADA",
    valorTotalPago: 0,
    dataPagamento: null,
    formaPagamento: null,
  },
  {
    id: 4,
    numero: 4,
    vencimento: "15/11/2026",
    valorOriginal: 2394.82,
    encargosAtraso: 0,
    status: "ABERTA",
    valorTotalPago: 0,
    dataPagamento: null,
    formaPagamento: null,
  },
  {
    id: 5,
    numero: 5,
    vencimento: "15/12/2026",
    valorOriginal: 2394.82,
    encargosAtraso: 0,
    status: "ABERTA",
    valorTotalPago: 0,
    dataPagamento: null,
    formaPagamento: null,
  },
  {
    id: 6,
    numero: 6,
    vencimento: "15/01/2027",
    valorOriginal: 2394.82,
    encargosAtraso: 0,
    status: "ABERTA",
    valorTotalPago: 0,
    dataPagamento: null,
    formaPagamento: null,
  },
];

const HISTORICO_INICIAL = [
  {
    idPagamento: "PAG-2026-0001",
    contratoId: "CTR-2026-00841",
    bemDescricao: "Honda Civic 2.0 Flex 2023",
    numeroParcela: 1,
    valorPago: 2394.82,
    formaPagamento: "Débito em Conta Bradesco",
    dataPagamento: "2026-08-14",
    observacao: "Débito automático agendado",
  },
  {
    idPagamento: "PAG-2026-0002",
    contratoId: "CTR-2026-00841",
    bemDescricao: "Honda Civic 2.0 Flex 2023",
    numeroParcela: 2,
    valorPago: 2394.82,
    formaPagamento: "PIX",
    dataPagamento: "2026-09-15",
    observacao: "Quitação via chave PIX Bradesco",
  },
];

export function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("bradesco_theme");
    if (saved) return saved === "dark";
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  });

  const [currentUser, setCurrentUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [notice, setNotice] = useState("");
  const [registrationSucceeded, setRegistrationSucceeded] = useState(false);
  const [bens, setBens] = useState([]);
  // Aba do formulário público inicial (Login/Cadastro)
  const [publicTab, setPublicTab] = useState("login");

  // Aba interna do perfil logado ('bens' | 'simulacao' | 'acompanhamento' | 'contratos' | 'parcelas' | 'historico')
  const [internalTab, setInternalTab] = useState("bens");

  const with2DEffect = true;

  // Dados armazenados durante a sessão do utilizador
  const [cadastradoBem, setCadastradoBem] = useState(null);
  const [propostas, setPropostas] = useState([]);

  // Estados das novas funcionalidades (Contratos, Parcelas e Histórico)
  const [parcelas, setParcelas] = useState(PARCELAS_INICIAIS);
  const [historicoPagamentos, setHistoricoPagamentos] =
    useState(HISTORICO_INICIAL);

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.setAttribute("data-theme", "dark");
      localStorage.setItem("bradesco_theme", "dark");
    } else {
      root.setAttribute("data-theme", "light");
      localStorage.setItem("bradesco_theme", "light");
    }
  }, [isDarkMode]);

  async function carregarDados() {
    const [assets, proposals] = await Promise.all([
      api("/bens"),
      api("/propostas"),
    ]);
    setBens(assets);
    setCadastradoBem(
      assets.length
        ? { ...assets[0], valorFormatado: brl(assets[0].valorNumerico) }
        : null,
    );
    setPropostas(proposals);
  }

  useEffect(() => {
    let active = true;
    api("/auth/me")
      .then(async (user) => {
        if (!active) return;
        setCurrentUser(user);
        try {
          await carregarDados();
        } catch (e) {
          if (active) setNotice(e.message);
        }
      })
      .catch((e) => {
        if (active && e.status !== 401) setNotice(e.message);
      })
      .finally(() => {
        if (active) setInitializing(false);
      });
    const expired = () => {
      setCurrentUser(null);
      setParcelas(PARCELAS_INICIAIS);
      setHistoricoPagamentos(HISTORICO_INICIAL);
      setBens([]);
      setPropostas([]);
      setCadastradoBem(null);
      setNotice("Sessão expirada. Entre novamente.");
    };
    window.addEventListener("sessao-expirada", expired);
    return () => {
      active = false;
      window.removeEventListener("sessao-expirada", expired);
    };
  }, []);

  const handleLoginSuccess = async (user) => {
    setRegistrationSucceeded(false);
    setCurrentUser(user);
    setNotice("");
    setInternalTab("bens");
    try {
      await carregarDados();
    } catch (e) {
      setNotice(e.message);
    }
  };

  const handleRegisterSuccess = () => {
    setPublicTab("login");
    setNotice("");
    setRegistrationSucceeded(true);
  };

  const handleLogout = async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch (e) {
      setNotice(e.message);
      return;
    }
    setCurrentUser(null);
    setParcelas(PARCELAS_INICIAIS);
    setHistoricoPagamentos(HISTORICO_INICIAL);
    setCadastradoBem(null);
    setBens([]);
    setPropostas([]);
    setPublicTab("login");
    setNotice("");
  };

  const handleCadastroBemSuccess = (bem) => {
    setBens((prev) => [...prev, bem]);
    setCadastradoBem({ ...bem, valorFormatado: brl(bem.valorNumerico) });
    setInternalTab("simulacao");
  };

  const handleSolicitacaoSuccess = (proposta) => {
    setPropostas((prev) => [
      proposta,
      ...prev.filter((p) => p.idProposta !== proposta.idProposta),
    ]);
    setInternalTab("acompanhamento");
  };

  const handleRegistrarPagamento = ({
    parcelaId,
    numeroParcela,
    contratoId,
    bemDescricao,
    valorPago,
    formaPagamento,
    dataPagamento,
    observacao,
  }) => {
    setParcelas((prev) =>
      prev.map((p) =>
        p.id === parcelaId
          ? {
              ...p,
              status: "PAGA",
              valorTotalPago: valorPago,
              dataPagamento,
              formaPagamento,
            }
          : p
      )
    );

    const novoRegistro = {
      idPagamento: `PAG-2026-${String(historicoPagamentos.length + 1).padStart(4, "0")}`,
      contratoId,
      bemDescricao,
      numeroParcela,
      valorPago,
      formaPagamento,
      dataPagamento,
      observacao,
    };

    setHistoricoPagamentos((prev) => [novoRegistro, ...prev]);
  };

  if (initializing)
    return (
      <main className="auth-card-box">
        <p>Conectando ao sistema...</p>
      </main>
    );

  return (
    <div className={`app-root ${isDarkMode ? "theme-dark" : "theme-light"}`}>
      {/* HEADER SUPERIOR BRADESCO */}
      <header className="app-header">
        <div className="header-inner">
          <div className="header-left">
            <div className="institutional-badge">
              <ShieldCheck size={17} className="security-badge-icon" />
              <span>Projeto acadêmico • Squad 44</span>
            </div>
          </div>
          <div className="header-right">
            <ThemeToggle
              isDarkMode={isDarkMode}
              onToggle={() => setIsDarkMode(!isDarkMode)}
            />
          </div>
        </div>
      </header>

      {/* ÁREA PRINCIPAL */}
      <main
        className={`main-content ${currentUser ? "portal-mode" : "auth-mode"}`}
      >
        {notice && (
          <div className="auth-alert" role="status">
            {notice}
          </div>
        )}
        {!currentUser ? (
          /* VISTA PÚBLICA (LOGIN / CADASTRO): HERO À ESQUERDA + CARD À DIREITA */
          <div className="auth-container">
            {/* LADO ESQUERDO: HERO */}
            <aside className="hero-section">
              <div className="hero-content">
                <div className="hero-badge">
                  <Sparkles size={14} className="badge-sparkle" />
                  <span>Simulador de Financiamentos</span>
                </div>
                <h1 className="hero-title">
                  Realize os seus projetos com as melhores taxas.
                </h1>
                <p className="hero-tagline">
                  <strong className="tagline-highlight">Você primeiro.</strong>{" "}
                  Soluções de financiamento personalizadas com análise em tempo
                  real.
                </p>
                <div className="hero-image-wrapper">
                  <img
                    src="/hero-bradesco.jpg"
                    alt="Financiamento Bradesco"
                    className="hero-image"
                  />
                </div>
              </div>
            </aside>

            {/* LADO DIREITO: CARD PRINCIPAL */}
            <section className="auth-card-section">
              <div className="auth-card-box">
                <div className="auth-card-brand-header">
                  <BradescoLogo
                    descritivo="prime"
                    isDarkMode={isDarkMode}
                    size="md"
                    showTagline={true}
                    withEffect2D={with2DEffect}
                  />
                </div>

                <div className="auth-tabs-nav" role="tablist">
                  <button
                    type="button"
                    className={`tab-nav-btn ${publicTab === "login" ? "active" : ""}`}
                    onClick={() => setPublicTab("login")}
                  >
                    <span>Acessar Conta</span>
                  </button>
                  <button
                    type="button"
                    className={`tab-nav-btn ${publicTab === "register" ? "active" : ""}`}
                    onClick={() => {
                      setRegistrationSucceeded(false);
                      setPublicTab("register");
                    }}
                  >
                    <span>Criar conta</span>
                  </button>
                </div>

                <div className="auth-tab-content">
                  {registrationSucceeded && (
                    <div className="auth-alert registration-alert success" role="status">
                      <CircleCheck size={18} aria-hidden="true" />
                      <strong>Cadastro realizado com sucesso!</strong>
                    </div>
                  )}
                  {publicTab === "login" ? (
                    <LoginForm
                      onSuccessLogin={handleLoginSuccess}
                      activeSegmentName="prime"
                    />
                  ) : (
                    <RegisterForm onSuccessRegister={handleRegisterSuccess} />
                  )}
                </div>
              </div>
            </section>
          </div>
        ) : (
          /* PORTAL AUTENTICADO */
          <div className="portal-full-container">
            {/* Barra Superior do Portal do Cliente */}
            <div className="portal-header-bar">
              <div className="portal-brand-area">
                <BradescoLogo
                  descritivo="prime"
                  isDarkMode={isDarkMode}
                  size="sm"
                  showTagline={false}
                  withEffect2D={with2DEffect}
                />
                <div className="portal-divider" />
                <div
                  className="portal-stepper"
                  aria-label="Etapas do Financiamento"
                >
                  <span
                    className={`stepper-step ${internalTab === "bens" ? "active" : cadastradoBem ? "completed" : ""}`}
                  >
                    <span className="step-num">1</span>
                    <span className="step-text">Cadastro de Bens</span>
                  </span>
                  <ChevronRight size={14} className="stepper-arrow" />
                  <span
                    className={`stepper-step ${internalTab === "simulacao" ? "active" : propostas.length > 0 ? "completed" : ""}`}
                  >
                    <span className="step-num">2</span>
                    <span className="step-text">Simulação</span>
                  </span>
                  <ChevronRight size={14} className="stepper-arrow" />
                  <span
                    className={`stepper-step ${internalTab === "acompanhamento" ? "active" : ""}`}
                  >
                    <span className="step-num">3</span>
                    <span className="step-text">Acompanhamento</span>
                  </span>
                  <ChevronRight size={14} className="stepper-arrow" />
                  <span
                    className={`stepper-step ${internalTab === "contratos" ? "active" : ""}`}
                  >
                    <span className="step-num">4</span>
                    <span className="step-text">Contratos</span>
                  </span>
                  <ChevronRight size={14} className="stepper-arrow" />
                  <span
                    className={`stepper-step ${internalTab === "parcelas" ? "active" : ""}`}
                  >
                    <span className="step-num">5</span>
                    <span className="step-text">Parcelas</span>
                  </span>
                  <ChevronRight size={14} className="stepper-arrow" />
                  <span
                    className={`stepper-step ${internalTab === "historico" ? "active" : ""}`}
                  >
                    <span className="step-num">6</span>
                    <span className="step-text">Histórico</span>
                  </span>
                </div>
              </div>

              {/* Perfil do Usuário e Botão de Logout */}
              <div className="portal-user-meta">
                <div className="user-profile-badge">
                  <div className="user-avatar-circle">
                    <UserCheck size={18} />
                  </div>
                  <div className="user-info-text">
                    <span className="user-name">{currentUser.name}</span>
                    <span className="user-segment">
                      CPF: {currentUser.identifier}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="portal-logout-btn"
                  title="Sair da Conta"
                >
                  <LogOut size={15} />
                  <span>Sair</span>
                </button>
              </div>
            </div>

            {/* Abas de Navegação das Telas Internas */}
            <div className="portal-nav-tabs" role="tablist">
              <button
                type="button"
                className={`portal-tab-btn ${internalTab === "bens" ? "active" : ""}`}
                onClick={() => setInternalTab("bens")}
              >
                <span>1. Cadastro do Bem</span>
              </button>
              <button
                type="button"
                className={`portal-tab-btn ${internalTab === "simulacao" ? "active" : ""}`}
                onClick={() => setInternalTab("simulacao")}
              >
                <span>2. Simulação de Crédito</span>
              </button>
              <button
                type="button"
                className={`portal-tab-btn ${internalTab === "acompanhamento" ? "active" : ""}`}
                onClick={() => setInternalTab("acompanhamento")}
              >
                <span>
                  3. Acompanhamento{" "}
                  {propostas.length > 0 ? `(${propostas.length})` : ""}
                </span>
              </button>
              <button
                type="button"
                className={`portal-tab-btn ${internalTab === "contratos" ? "active" : ""}`}
                onClick={() => setInternalTab("contratos")}
              >
                <span>4. Meus Financiamentos</span>
              </button>
              <button
                type="button"
                className={`portal-tab-btn ${internalTab === "parcelas" ? "active" : ""}`}
                onClick={() => setInternalTab("parcelas")}
              >
                <span>5. Parcelas e Pagamentos</span>
              </button>
              <button
                type="button"
                className={`portal-tab-btn ${internalTab === "historico" ? "active" : ""}`}
                onClick={() => setInternalTab("historico")}
              >
                <span>
                  6. Histórico ({historicoPagamentos.length})
                </span>
              </button>
            </div>

            {/* Card Principal das Telas Internas */}
            <div className="portal-screen-card animate-zoom-in">
              {internalTab === "bens" && (
                <>
                  {bens.length > 0 && (
                    <div className="auth-form">
                      <label className="form-label" htmlFor="bem-existente">
                        Simular com um bem já cadastrado
                      </label>
                      <select
                        id="bem-existente"
                        className="form-input"
                        value={cadastradoBem?.id || ""}
                        onChange={(e) => {
                          const b = bens.find((x) => x.id === e.target.value);
                          setCadastradoBem({
                            ...b,
                            valorFormatado: brl(b.valorNumerico),
                          });
                          setInternalTab("simulacao");
                        }}
                      >
                        {bens.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.descricao} — {brl(b.valorNumerico)}
                          </option>
                        ))}
                      </select>
                      <button
                        className="btn-primary-bradesco"
                        onClick={() => setInternalTab("simulacao")}
                      >
                        Simular com o bem selecionado
                      </button>
                    </div>
                  )}
                  <BensForm onSuccessCadastroBem={handleCadastroBemSuccess} />
                </>
              )}
              {internalTab === "simulacao" && (
                <SimulacaoForm
                  key={cadastradoBem?.id || "sem-bem"}
                  bemCadastrado={cadastradoBem}
                  onSuccessSolicitacao={handleSolicitacaoSuccess}
                />
              )}
              {internalTab === "acompanhamento" && (
                <AcompanhamentoView
                  propostas={propostas}
                  onRefresh={async () => setPropostas(await api("/propostas"))}
                />
              )}
              {["parcelas", "historico"].includes(internalTab) && (
                <p className="auth-alert">
                  Protótipo acadêmico. Parcelas e pagamentos são simulados e
                  voltam ao exemplo ao sair ou recarregar a página.
                </p>
              )}
              {internalTab === "contratos" && (
                <MeusFinanciamentosView key={currentUser.id} />
              )}
              {internalTab === "parcelas" && (
                <ParcelasView
                  parcelas={parcelas}
                  onRegistrarPagamento={handleRegistrarPagamento}
                />
              )}
              {internalTab === "historico" && (
                <HistoricoView
                  historico={historicoPagamentos}
                />
              )}
            </div>
          </div>
        )}
      </main>

      <InstitutionalFooter />
    </div>
  );
}

export default App;