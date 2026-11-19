import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CreditCard,
  X,
  Receipt,
} from "lucide-react";
import { brl } from "../api";

export default function ParcelasView({
  contratoAtivo,
  parcelas = [],
  onRegistrarPagamento,
}) {
  const [parcelaParaPagar, setParcelaParaPagar] = useState(null);
  const [formaPagamento, setFormaPagamento] = useState("PIX");
  const [dataPagamento] = useState(
    () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Recife" })
  );
  const [observacao, setObservacao] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("TODAS");
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState("");
  const [avisoSucesso, setAvisoSucesso] = useState("");

  const parcelasFiltradas = parcelas.filter((p) => {
    if (filtroStatus === "TODAS") return true;
    return filtroStatus === "ABERTA" ? p.status === "PENDENTE" : p.status === filtroStatus;
  });

  const totalPago = parcelas
    .filter((p) => p.status === "PAGA")
    .reduce((acc, p) => acc + p.valorTotalPago, 0);

  const totalEmAberto = parcelas
    .filter((p) => p.status !== "PAGA")
    .reduce((acc, p) => acc + p.totalAtualizado, 0);

  const handleConfirmarPagamento = async (e) => {
    e.preventDefault();
    if (!parcelaParaPagar || busy) return;
    setBusy(true);
    setErro("");

    const valorFinal =
      parcelaParaPagar.totalAtualizado;

    try {
      await onRegistrarPagamento({
        parcelaId: parcelaParaPagar.id,
        numeroParcela: parcelaParaPagar.numero,
        valorPago: valorFinal,
        formaPagamento,
        dataPagamento,
        observacao,
      });

      setAvisoSucesso(
        `Pagamento da Parcela ${parcelaParaPagar.numero}/${parcelas.length} (${brl(valorFinal)}) registrado com sucesso!`
      );
      setParcelaParaPagar(null);
      setObservacao("");
      setTimeout(() => setAvisoSucesso(""), 5000);
    } catch (e) {
      setErro(e.message);
    } finally {
      setBusy(false);
    }
  };

  const renderBadgeStatus = (status) => {
    if (status === "PAGA") {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.3rem",
            padding: "0.2rem 0.6rem",
            borderRadius: "999px",
            fontSize: "0.75rem",
            fontWeight: 700,
            backgroundColor: "rgba(16, 185, 129, 0.15)",
            color: "#10b981",
          }}
        >
          <CheckCircle2 size={13} /> Paga
        </span>
      );
    }
    if (status === "ATRASADA") {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.3rem",
            padding: "0.2rem 0.6rem",
            borderRadius: "999px",
            fontSize: "0.75rem",
            fontWeight: 700,
            backgroundColor: "rgba(239, 68, 68, 0.15)",
            color: "#ef4444",
          }}
        >
          <AlertTriangle size={13} /> Em Atraso
        </span>
      );
    }
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.3rem",
          padding: "0.2rem 0.6rem",
          borderRadius: "999px",
          fontSize: "0.75rem",
          fontWeight: 700,
          backgroundColor: "rgba(245, 158, 11, 0.15)",
          color: "#f59e0b",
        }}
      >
        <Clock size={13} /> Em Aberto
      </span>
    );
  };

  return (
    <div className="auth-form">
      <div style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>
          Parcelas e Registro de Pagamento
        </h2>
        <p style={{ fontSize: "0.85rem", opacity: 0.75 }}>
          Contrato{" "}
          <strong>{contratoAtivo?.id}</strong> — {contratoAtivo?.bemDescricao}
        </p>
      </div>

      {avisoSucesso && (
        <div
          className="auth-alert"
          role="status"
          style={{
            marginBottom: "1rem",
            borderColor: "#10b981",
            color: "#10b981",
          }}
        >
          {avisoSucesso}
        </div>
      )}

      {/* Resumo de Saldos */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "0.85rem",
          marginBottom: "1.25rem",
        }}
      >
        <div
          style={{
            padding: "0.95rem",
            borderRadius: "12px",
            border: "1px solid var(--card-border)",
            backgroundColor: "var(--bg-card-secondary)",
          }}
        >
          <div style={{ fontSize: "0.75rem", opacity: 0.75 }}>Total Já Pago</div>
          <div
            style={{
              fontSize: "1.15rem",
              fontWeight: 700,
              color: "#10b981",
              marginTop: "0.2rem",
            }}
          >
            {brl(totalPago)}
          </div>
        </div>

        <div
          style={{
            padding: "0.95rem",
            borderRadius: "12px",
            border: "1px solid var(--card-border)",
            backgroundColor: "var(--bg-card-secondary)",
          }}
        >
          <div style={{ fontSize: "0.75rem", opacity: 0.75 }}>
            Saldo Devedor em Aberto
          </div>
          <div
            style={{
              fontSize: "1.15rem",
              fontWeight: 700,
              marginTop: "0.2rem",
            }}
          >
            {brl(totalEmAberto)}
          </div>
        </div>
      </div>

      {/* Filtros Rápidos */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          flexWrap: "wrap",
          marginBottom: "1rem",
        }}
      >
        {[
          { id: "TODAS", label: `Todas (${parcelas.length})` },
          {
            id: "ABERTA",
            label: `Em Aberto (${parcelas.filter((p) => p.status === "PENDENTE").length})`,
          },
          {
            id: "ATRASADA",
            label: `Atrasadas (${parcelas.filter((p) => p.status === "ATRASADA").length})`,
          },
          {
            id: "PAGA",
            label: `Pagas (${parcelas.filter((p) => p.status === "PAGA").length})`,
          },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFiltroStatus(f.id)}
            className={`tab-nav-btn ${filtroStatus === f.id ? "active" : ""}`}
            style={{
              padding: "0.45rem 0.9rem",
              fontSize: "0.8rem",
              border: "1px solid var(--card-border)",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista de Parcelas */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
        {parcelasFiltradas.map((p) => {
          const valorCobrado = p.totalAtualizado;
          return (
            <div
              key={p.id}
              style={{
                padding: "0.95rem 1.1rem",
                borderRadius: "12px",
                border: "1px solid var(--card-border)",
                backgroundColor: "var(--bg-card-secondary)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "0.8rem",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <strong>
                    Parcela {String(p.numero).padStart(2, "0")}/
                    {String(parcelas.length).padStart(2, "0")}
                  </strong>
                  {renderBadgeStatus(p.status)}
                </div>

                <div style={{ fontSize: "0.82rem", opacity: 0.8 }}>
                  <Calendar
                    size={13}
                    style={{ verticalAlign: "middle", marginRight: "0.3rem" }}
                  />
                  Vencimento: <strong>{p.vencimento}</strong>
                  {p.dataPagamento && (
                    <>
                      {" "}
                      • Pago em: <strong>{p.dataPagamento}</strong> ({p.formaPagamento})
                    </>
                  )}
                </div>

                {p.encargosAtraso > 0 && p.status !== "PAGA" && (
                  <div style={{ fontSize: "0.78rem", color: "#ef4444" }}>
                    Encargos de atraso (multa + juros): +{brl(p.encargosAtraso)}
                  </div>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                }}
              >
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.72rem", opacity: 0.7 }}>
                    {p.status === "PAGA" ? "Valor Quitado" : "Valor Atualizado"}
                  </div>
                  <strong style={{ fontSize: "1rem" }}>
                    {brl(p.status === "PAGA" ? p.valorTotalPago : valorCobrado)}
                  </strong>
                </div>

                {p.status !== "PAGA" && (
                  <button
                    type="button"
                    className="btn-primary-bradesco"
                    style={{
                      width: "auto",
                      padding: "0.55rem 0.95rem",
                      fontSize: "0.82rem",
                    }}
                    onClick={() => { setErro(""); setParcelaParaPagar(p); }}
                  >
                    <CreditCard size={14} style={{ marginRight: "0.35rem" }} />
                    Registrar Pagamento
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal / Painel de Registro de Pagamento */}
      {parcelaParaPagar && createPortal(
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 999,
          }}
        >
          <div
            className="auth-card-box"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pagamento-titulo"
            style={{
              maxWidth: "460px",
              width: "100%",
              maxHeight: "calc(100dvh - 2rem)",
              overflowY: "auto",
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Receipt size={18} style={{ color: "var(--bradesco-red)" }} />
                <h3 id="pagamento-titulo" style={{ fontSize: "1.1rem", margin: 0 }}>
                  Registrar Pagamento — Parcela{" "}
                  {String(parcelaParaPagar.numero).padStart(2, "0")}
                </h3>
              </div>
              <button
                type="button"
                disabled={busy} onClick={() => setParcelaParaPagar(null)}
                className="text-link-btn"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmarPagamento} className="auth-form">
              {erro && <p className="auth-alert error" role="alert">{erro}</p>}
              <p>Registro acadêmico do pagamento integral da parcela. A data é a de hoje.</p>
              <div
                style={{
                  padding: "0.85rem",
                  borderRadius: "10px",
                  backgroundColor: "var(--bg-card-secondary)",
                  border: "1px solid var(--card-border)",
                  marginBottom: "0.9rem",
                  fontSize: "0.85rem",
                }}
              >
                <div>
                  <strong>Vencimento:</strong> {parcelaParaPagar.vencimento}
                </div>
                <div>
                  <strong>Valor Original:</strong>{" "}
                  {brl(parcelaParaPagar.valorOriginal)}
                </div>
                {parcelaParaPagar.encargosAtraso > 0 && (
                  <div style={{ color: "#ef4444" }}>
                    <strong>Encargos por Atraso:</strong>{" "}
                    {brl(parcelaParaPagar.encargosAtraso)}
                  </div>
                )}
                <div
                  style={{
                    marginTop: "0.4rem",
                    paddingTop: "0.4rem",
                    borderTop: "1px solid var(--card-border)",
                    fontSize: "0.98rem",
                  }}
                >
                  <strong>Total a Pagar:</strong>{" "}
                  {brl(
                    parcelaParaPagar.totalAtualizado
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="forma-pagamento">
                  Meio de Pagamento
                </label>
                <select
                  id="forma-pagamento"
                  className="form-input"
                  value={formaPagamento}
                  onChange={(e) => setFormaPagamento(e.target.value)}
                >
                  <option value="PIX">PIX Instantâneo</option>
                  <option value="Débito em Conta Bradesco">
                    Débito em Conta Bradesco
                  </option>
                  <option value="Boleto">Boleto Bancário</option>
                  <option value="Transferência">TED / Transferência</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="data-pagamento">
                  Data do Pagamento
                </label>
                <input
                  id="data-pagamento"
                  type="date"
                  className="form-input"
                  value={dataPagamento}
                  readOnly
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="obs-pagamento">
                  Observação / Nº Autenticação (opcional)
                </label>
                <input
                  id="obs-pagamento"
                  maxLength={500}
                  type="text"
                  className="form-input"
                  placeholder="Ex: Comprovante via app Bradesco"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  className="tab-nav-btn"
                  style={{ flex: 1, border: "1px solid var(--card-border)" }}
                  disabled={busy} onClick={() => setParcelaParaPagar(null)}
                >
                  Cancelar
                </button>
                <button
                  type="submit" disabled={busy}
                  className="btn-primary-bradesco"
                  style={{ flex: 2 }}
                >
                  {busy ? "Registrando…" : "Confirmar Pagamento"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
