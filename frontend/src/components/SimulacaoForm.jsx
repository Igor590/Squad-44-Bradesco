import { useState } from "react";
import { api, brl } from "../api";
export default function SimulacaoForm({ bemCadastrado, onSuccessSolicitacao }) {
  const [entrada, setEntrada] = useState(
    bemCadastrado ? (Number(bemCadastrado.valorNumerico) * 0.2).toFixed(2) : "",
  );
  const [prazo, setPrazo] = useState(36);
  const [taxa, setTaxa] = useState("1");
  const [simulation, setSimulation] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  function change(setter, value) {
    setter(value);
    setSimulation(null);
    setError("");
  }
  async function simular(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setSimulation(null);
    try {
      setSimulation(
        await api("/simulacoes", {
          method: "POST",
          body: {
            bemId: bemCadastrado.id,
            entrada,
            prazoMeses: Number(prazo),
            taxaMensalPercentual: taxa,
          },
        }),
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function solicitar() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      onSuccessSolicitacao(
        await api("/propostas", {
          method: "POST",
          body: { simulacaoId: simulation.id },
        }),
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (!bemCadastrado)
    return (
      <div className="auth-form">
        <p>Cadastre ou selecione um bem na primeira aba para simular.</p>
      </div>
    );
  const r = simulation?.resultado;
  return (
    <div className="auth-form">
      <div className="auth-alert">
        <strong>{bemCadastrado.descricao}</strong> •{" "}
        {brl(bemCadastrado.valorNumerico)}
      </div>
      {error && (
        <div className="auth-alert error" role="alert">
          {error}
        </div>
      )}
      <form onSubmit={simular}>
        <fieldset disabled={busy} style={{ border: 0, padding: 0, margin: 0 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="sim-entrada">
              Entrada (R$)
            </label>
            <input
              id="sim-entrada"
              className="form-input"
              type="number"
              min="0"
              step="0.01"
              required
              value={entrada}
              onChange={(e) => change(setEntrada, e.target.value)}
            />
          </div>
          <div className="form-row-account">
            <div className="form-group flex-1">
              <label className="form-label" htmlFor="sim-prazo">
                Prazo em meses
              </label>
              <input
                id="sim-prazo"
                className="form-input"
                type="number"
                min="1"
                max="600"
                step="1"
                required
                value={prazo}
                onChange={(e) => change(setPrazo, e.target.value)}
              />
            </div>
            <div className="form-group flex-1">
              <label className="form-label" htmlFor="sim-taxa">
                Taxa de juros (% ao mês)
              </label>
              <input
                id="sim-taxa"
                className="form-input"
                type="number"
                min="0"
                max="100"
                step="0.000001"
                required
                value={taxa}
                onChange={(e) => change(setTaxa, e.target.value)}
              />
            </div>
          </div>
          <button className="btn-primary-bradesco" disabled={busy}>
            {busy ? "Processando..." : "Calcular financiamento"}
          </button>
        </fieldset>
      </form>
      {r && (
        <>
          <div className="success-summary-box">
            {[
              ["Valor financiado", brl(r.valorFinanciado)],
              [
                "Percentual financiado",
                (Number(r.percentualFinanciado) * 100).toFixed(2) + "%",
              ],
              ["Parcela padrão", brl(r.parcelaPadrao)],
              ["Última parcela", brl(r.parcelas.at(-1).valor)],
              ["Juros totais", brl(r.totalJuros)],
              ["Soma das parcelas", brl(r.totalParcelas)],
              ["Total com entrada", brl(r.totalPago)],
            ].map(([label, value]) => (
              <div className="summary-item" key={label}>
                <span className="summary-label">{label}</span>
                <strong className="summary-value">{value}</strong>
              </div>
            ))}
          </div>
          <details>
            <summary>Ver cronograma de {r.prazoMeses} parcelas</summary>
            <div style={{ overflowX: "auto", maxHeight: 300 }}>
              <table className="schedule-table">
                <thead>
                  <tr>
                    <th>Nº</th>
                    <th>Parcela</th>
                    <th>Juros</th>
                    <th>Amortização</th>
                    <th>Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {r.parcelas.map((p) => (
                    <tr key={p.numero}>
                      <td>{p.numero}</td>
                      <td>{brl(p.valor)}</td>
                      <td>{brl(p.juros)}</td>
                      <td>{brl(p.amortizacao)}</td>
                      <td>{brl(p.saldoDevedor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
          <button
            className="btn-primary-bradesco"
            disabled={busy}
            onClick={solicitar}
          >
            {busy ? "Analisando..." : "Enviar proposta para análise"}
          </button>
        </>
      )}
      <p className="form-security-footer">
        Tabela Price, sem tarifas, seguros ou tributos. Taxa escolhida apenas
        para simulação acadêmica. A última parcela pode variar por
        arredondamento.
      </p>
    </div>
  );
}
