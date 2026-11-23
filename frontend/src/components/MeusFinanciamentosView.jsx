import React, { useEffect, useState } from "react";
import {
  FileText,
  CheckCircle2,
  Eye,
  Download,
  ArrowLeft,
  Calendar,
  Percent,
  Wallet,
  Building2,
} from "lucide-react";
import VisualizadorPdf from "./VisualizadorPdf";
import { api, brl } from "../api";

function formatarData(data) {
  return data?.split("-").reverse().join("/");
}

function dadosDoContrato(contrato) {
  return {
    ...contrato,
    idContrato: contrato.id,
    protocolo: contrato.propostaId,
    valorEntrada: contrato.entrada,
    taxaMensal: contrato.taxaMensalPercentual,
    valorParcela: contrato.parcelaPadrao,
    totalPagar: contrato.totalComEntrada,
    dataReferencia: formatarData(contrato.contratadoEm),
    statusContrato: contrato.status,
  };
}

export default function MeusFinanciamentosView({ onIrParaParcelas }) {
  const [itens, setItens] = useState([]);
  const [contratoSelecionado, setContratoSelecionado] = useState(null);
  const [previaPdf, setPreviaPdf] = useState(null);
  const [abrindoPdf, setAbrindoPdf] = useState(false);
  const [mensagemDownload, setMensagemDownload] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    api("/financiamentos")
      .then((lista) => { if (ativo) setItens(lista.map(dadosDoContrato)); })
      .catch((e) => { if (ativo) setErro(e.message); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, []);

  async function abrirContrato(item) {
    setCarregando(true);
    setErro("");
    try {
      const { contrato, parcelas, saldoPrincipal, totalEmAberto } = await api(`/financiamentos/${item.idContrato}`);
      setContratoSelecionado({
        ...dadosDoContrato(contrato),
        parcelas, saldoPrincipal, totalEmAberto,
        parcelasPagas: parcelas.filter((p) => p.status === "PAGA").length,
        primeiraParcela: parcelas[0],
        ultimaParcela: parcelas.at(-1)?.valor,
      });
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  const handleBaixarContrato = async (contrato) => {
    setErro("");
    try {
      const { gerarContratoPdf } = await import("../pdf/contrato");
      gerarContratoPdf(contrato).save(`Contrato-${contrato.idContrato}.pdf`);
      setMensagemDownload("Contrato em PDF baixado com sucesso!");
    } catch {
      setErro("Não foi possível gerar o PDF. Tente novamente.");
    }
  };

  async function visualizarContrato() {
    setAbrindoPdf(true);
    setErro("");
    try {
      const { gerarContratoPdf } = await import("../pdf/contrato");
      setPreviaPdf(gerarContratoPdf(contratoSelecionado).output("blob"));
    } catch {
      setErro("Não foi possível abrir o contrato. Tente novamente.");
    } finally {
      setAbrindoPdf(false);
    }
  }

  // MODO 2: DETALHES DO FINANCIAMENTO + VISUALIZAÇÃO DO CONTRATO
  if (contratoSelecionado) {
    const progresso = Math.round(
      (contratoSelecionado.parcelasPagas / contratoSelecionado.prazoMeses) *
        100
    );

    return (
      <div className="auth-form">
        {erro && <p className="auth-alert error" role="alert">{erro}</p>}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.75rem",
            marginBottom: "1rem",
          }}
        >
          <button
            type="button"
            className="text-link-btn"
            style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
            onClick={() => {
              setContratoSelecionado(null);
              setPreviaPdf(null);
            }}
          >
            <ArrowLeft size={16} />
            <span>Voltar para Meus Financiamentos</span>
          </button>

          <span
            style={{
              padding: "0.3rem 0.75rem",
              borderRadius: "999px",
              fontSize: "0.78rem",
              fontWeight: 700,
              backgroundColor: "rgba(16, 185, 129, 0.15)",
              color: "#10b981",
            }}
          >
            ● {contratoSelecionado.statusContrato}
          </span>
        </div>

        <h2 style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>
          Detalhes do Financiamento — {contratoSelecionado.bemDescricao}
        </h2>
        <p style={{ fontSize: "0.85rem", opacity: 0.75, marginBottom: "1.25rem" }}>
          Contrato <strong>{contratoSelecionado.idContrato}</strong> • Protocolo{" "}
          {contratoSelecionado.protocolo}
        </p>

        {mensagemDownload && (
          <div className="auth-alert" role="status" style={{ marginBottom: "1rem" }}>
            {mensagemDownload}
          </div>
        )}

        {/* Resumo Financeiro em Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "0.85rem",
            marginBottom: "1.25rem",
          }}
        >
          <div
            style={{
              padding: "0.9rem",
              borderRadius: "12px",
              border: "1px solid var(--card-border)",
              backgroundColor: "var(--bg-card-secondary)",
            }}
          >
            <div style={{ fontSize: "0.75rem", opacity: 0.75, display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <Wallet size={14} /> Valor Financiado
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, marginTop: "0.25rem" }}>
              {brl(contratoSelecionado.valorFinanciado)}
            </div>
          </div>

          <div
            style={{
              padding: "0.9rem",
              borderRadius: "12px",
              border: "1px solid var(--card-border)",
              backgroundColor: "var(--bg-card-secondary)",
            }}
          >
            <div style={{ fontSize: "0.75rem", opacity: 0.75, display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <Calendar size={14} /> Valor da Parcela
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, marginTop: "0.25rem" }}>
              {brl(contratoSelecionado.valorParcela)}
            </div>
          </div>

          <div
            style={{
              padding: "0.9rem",
              borderRadius: "12px",
              border: "1px solid var(--card-border)",
              backgroundColor: "var(--bg-card-secondary)",
            }}
          >
            <div style={{ fontSize: "0.75rem", opacity: 0.75, display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <Percent size={14} /> Taxa / Sistema
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, marginTop: "0.25rem" }}>
              {contratoSelecionado.taxaMensal}% a.m. (Price)
            </div>
          </div>

          <div
            style={{
              padding: "0.9rem",
              borderRadius: "12px",
              border: "1px solid var(--card-border)",
              backgroundColor: "var(--bg-card-secondary)",
            }}
          >
            <div style={{ fontSize: "0.75rem", opacity: 0.75, display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <CheckCircle2 size={14} /> Quitação
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, marginTop: "0.25rem" }}>
              {contratoSelecionado.parcelasPagas}/{contratoSelecionado.prazoMeses} pagas ({progresso}%)
            </div>
          </div>
        </div>

        {/* Ficha Técnica Completa */}
        <div
          style={{
            padding: "1rem",
            borderRadius: "12px",
            border: "1px solid var(--card-border)",
            marginBottom: "1.25rem",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "0.65rem",
            fontSize: "0.86rem",
          }}
        >
          <div><strong>Valor Total do Bem:</strong> {brl(contratoSelecionado.valorBem)}</div>
          <div><strong>Entrada Prevista:</strong> {brl(contratoSelecionado.valorEntrada)}</div>
          <div><strong>Total da Operação:</strong> {brl(contratoSelecionado.totalPagar)}</div>
          <div><strong>Data de Referência:</strong> {contratoSelecionado.dataReferencia}</div>
          <div><strong>CPF:</strong> {contratoSelecionado.clienteCpf}</div>
          <div><strong>Tipo do Bem:</strong> {{ veiculo: "Veículo", imovel: "Imóvel", outro: "Outro" }[contratoSelecionado.bemTipo]}</div>
          <div><strong>Identificação do Bem:</strong> {contratoSelecionado.bemIdentificacao || "Não informada"}</div>
          <div><strong>Último Vencimento:</strong> {formatarData(contratoSelecionado.parcelas.at(-1)?.vencimento)}</div>
          <div><strong>1º Vencimento:</strong> {formatarData(contratoSelecionado.primeiraParcela?.vencimento)}</div>
        </div>

        {/* Botões de Ação (Contrato e Parcelas) */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
          <button
            type="button"
            className="btn-primary-bradesco"
            style={{ width: "auto", padding: "0.75rem 1.25rem" }}
            onClick={visualizarContrato}
            disabled={abrindoPdf}
          >
            <FileText size={16} style={{ marginRight: "0.4rem" }} />
            {abrindoPdf ? "Abrindo contrato…" : "Visualizar Contrato"}
          </button>

          <button
            type="button"
            className="tab-nav-btn"
            style={{
              border: "1px solid var(--card-border)",
              padding: "0.75rem 1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
            onClick={() => handleBaixarContrato(contratoSelecionado)}
          >
            <Download size={16} />
            <span>Baixar Contrato</span>
          </button>

        </div>

        <p>Principal restante: <strong>{brl(contratoSelecionado.saldoPrincipal)}</strong>.
          Total das parcelas em aberto com encargos: <strong>{brl(contratoSelecionado.totalEmAberto)}</strong>.</p>
        <button type="button" className="btn-primary-bradesco"
          onClick={async () => {
            try { await onIrParaParcelas(contratoSelecionado.id); }
            catch (e) { setErro(e.message); }
          }}>
          Consultar parcelas e registrar pagamento
        </button>
        <div style={{ overflowX: "auto" }}>
          <table className="schedule-table">
            <caption>Parcelas do financiamento</caption>
            <thead>
              <tr><th>Nº</th><th>Vencimento</th><th>Valor</th><th>Situação</th></tr>
            </thead>
            <tbody>
              {contratoSelecionado.parcelas.map((parcela) => (
                <tr key={parcela.numero}>
                  <td>{parcela.numero}</td>
                  <td>{formatarData(parcela.vencimento)}</td>
                  <td>{brl(parcela.valor)}</td>
                  <td>{{ PENDENTE: "Pendente", PAGA: "Paga", ATRASADA: "Atrasada" }[parcela.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {previaPdf && (
          <VisualizadorPdf blob={previaPdf}
            nomeArquivo={`Contrato-${contratoSelecionado.idContrato}.pdf`}
            onFechar={() => setPreviaPdf(null)} />
        )}
      </div>
    );
  }

  // MODO 1: LISTA DE MEUS FINANCIAMENTOS
  return (
    <div className="auth-form">
      <div style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>
          Meus Financiamentos e Contratos
        </h2>
        <p style={{ fontSize: "0.85rem", opacity: 0.75 }}>
          Consulte seus contratos e as parcelas de cada financiamento.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
        {carregando && <p role="status">Carregando financiamentos…</p>}
        {erro && <p className="auth-alert error" role="alert">{erro}</p>}
        {!carregando && !erro && itens.length === 0 && <p>Nenhum financiamento contratado.</p>}
        {itens.map((item) => (
          <div
            key={item.idContrato}
            style={{
              padding: "1.1rem",
              borderRadius: "14px",
              border: "1px solid var(--card-border)",
              backgroundColor: "var(--bg-card-secondary)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Building2 size={16} style={{ color: "var(--bradesco-red)" }} />
                <span style={{ fontSize: "0.78rem", fontWeight: 700, opacity: 0.8 }}>
                  {item.idContrato}
                </span>
                <span
                  style={{
                    padding: "0.15rem 0.55rem",
                    borderRadius: "999px",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    backgroundColor: "rgba(16, 185, 129, 0.15)",
                    color: "#10b981",
                  }}
                >
                  {item.statusContrato}
                </span>
              </div>

              <strong style={{ fontSize: "1.05rem" }}>{item.bemDescricao}</strong>

              <div style={{ fontSize: "0.83rem", opacity: 0.8 }}>
                Financiado: <strong>{brl(item.valorFinanciado)}</strong> •{" "}
                {item.prazoMeses}x de <strong>{brl(item.valorParcela)}</strong> • Taxa:{" "}
                {item.taxaMensal}% a.m.
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                className="btn-primary-bradesco"
                style={{ width: "auto", padding: "0.65rem 1rem", fontSize: "0.85rem" }}
                disabled={carregando}
                onClick={() => abrirContrato(item)}
              >
                <Eye size={15} style={{ marginRight: "0.35rem" }} />
                Detalhes e Contrato
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}