import { useState } from "react";
import { brl } from "../api";
const labels = {
  EM_ANALISE: "Em análise",
  APROVADO: "Aprovado",
  REPROVADO: "Reprovado",
};
export default function AcompanhamentoView({ propostas = [], onRefresh }) {
  const [filter, setFilter] = useState("TODOS");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function refresh() {
    setBusy(true);
    setError("");
    try {
      await onRefresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-form">
      <div className="auth-method-selector">
        {["TODOS", ...Object.keys(labels)].map((key) => (
          <button
            key={key}
            className={"auth-method-btn " + (filter === key ? "active" : "")}
            onClick={() => setFilter(key)}
          >
            {labels[key] || "Todas"}
          </button>
        ))}
      </div>
      <button className="demo-autofill-btn" onClick={refresh} disabled={busy}>
        {busy ? "Atualizando..." : "Atualizar propostas"}
      </button>
      {error && (
        <div className="auth-alert error" role="alert">
          {error}
        </div>
      )}
      {!propostas.filter((p) => filter === "TODOS" || p.status === filter)
        .length && <p>Nenhuma proposta encontrada.</p>}
      {propostas
        .filter((p) => filter === "TODOS" || p.status === filter)
        .map((p) => (
          <article className="success-summary-box" key={p.idProposta}>
            <div className="summary-item">
              <strong>{p.bemDescricao}</strong>
              <span className="key-badge-btn">{labels[p.status]}</span>
            </div>
            <p style={{ overflowWrap: "anywhere" }}>
              Protocolo: {p.idProposta}
            </p>
            <p>
              Solicitada em{" "}
              {new Date(p.dataSolicitacao).toLocaleString("pt-BR")}
            </p>
            <div className="summary-item">
              <span>Financiado</span>
              <strong>{brl(p.resultado.valorFinanciado)}</strong>
            </div>
            <div className="summary-item">
              <span>Prazo / parcela padrão</span>
              <strong>
                {p.resultado.prazoMeses} meses /{" "}
                {brl(p.resultado.parcelaPadrao)}
              </strong>
            </div>
            <div className="summary-item">
              <span>Última parcela</span>
              <strong>{brl(p.resultado.parcelas.at(-1).valor)}</strong>
            </div>
            {p.motivosReprovacao.length > 0 && (
              <div className="auth-alert error">
                <strong>Motivos da reprovação</strong>
                <ul>
                  {p.motivosReprovacao.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            )}
            {p.status === "APROVADO" && (
              <p>
                Aprovada pelas regras de análise. Contrato e pagamentos ainda
                não estão disponíveis nesta etapa.
              </p>
            )}
          </article>
        ))}
      <p className="form-security-footer">
        Propostas salvas no banco. Análise automática com score demonstrativo.
      </p>
    </div>
  );
}
