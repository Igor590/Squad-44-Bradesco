import React, { useState, useMemo } from "react";
import {
  FileText,
  CheckCircle2,
  Eye,
  Download,
  ArrowLeft,
  Calendar,
  Percent,
  Wallet,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { brl } from "../api";

// Dados demonstrativos caso o back-end ainda não tenha propostas aprovadas
const CONTRATOS_EXEMPLO = [
  {
    idContrato: "CTR-2026-00841",
    protocolo: "PROT-2026-841",
    bemDescricao: "Honda Civic 2.0 Flex 2023",
    tipoBem: "Veículo",
    valorBem: 95000,
    valorEntrada: 25000,
    valorFinanciado: 70000,
    prazoMeses: 36,
    parcelasPagas: 4,
    taxaMensal: 1.15,
    valorParcela: 2394.82,
    totalPagar: 86213.52,
    dataAssinatura: "15/07/2026",
    primeiroVencimento: "15/08/2026",
    statusContrato: "ATIVO",
  },
];

export default function MeusFinanciamentosView({
  propostas = [],
  currentUser,
  onIrParaParcelas,
}) {
  const [contratoSelecionado, setContratoSelecionado] = useState(null);
  const [exibirTermoContrato, setExibirTermoContrato] = useState(false);
  const [mensagemDownload, setMensagemDownload] = useState("");

  // Converte propostas aprovadas vindas do back-end em contratos ativos (ou usa exemplo)
  const financiamentos = useMemo(() => {
    const aprovadas = propostas.filter(
      (p) =>
        p.status === "APROVADA" ||
        p.status === "APROVADO" ||
        p.decisao === "APROVADA"
    );

    if (aprovadas.length === 0) return CONTRATOS_EXEMPLO;

    return aprovadas.map((p, index) => {
      const valorBem = Number(p.valorBem || p.valorTotal || 12500);
      const valorEntrada = Number(p.valorEntrada || p.entrada || 2500);
      const valorFinanciado = Number(
        p.valorFinanciado || valorBem - valorEntrada
      );
      const prazoMeses = Number(p.prazoMeses || p.parcelas || 12);
      const taxaMensal = Number(p.taxaMensal || p.taxaJuros || 1.0);
      const valorParcela = Number(p.valorParcela || 888.49);
      const totalPagar = Number(
        p.totalComEntrada || valorEntrada + valorParcela * prazoMeses
      );

      return {
        idContrato: `CTR-2026-00${p.idProposta || index + 101}`,
        protocolo: p.protocolo || `PROT-${p.idProposta || index + 101}`,
        bemDescricao: p.descricaoBem || p.bem?.descricao || "Bem Financiado",
        tipoBem: p.tipoBem || p.bem?.tipo || "Veículo",
        valorBem,
        valorEntrada,
        valorFinanciado,
        prazoMeses,
        parcelasPagas: 0,
        taxaMensal,
        valorParcela,
        totalPagar,
        dataAssinatura: p.dataCriacao || "14/11/2026",
        primeiroVencimento: "14/12/2026",
        statusContrato: "ATIVO",
      };
    });
  }, [propostas]);

  const handleBaixarContrato = (contrato) => {
    const textoContrato = [
      "BANCO BRADESCO S.A. - CONTRATO DE FINANCIAMENTO (CDC)",
      `Número do Contrato: ${contrato.idContrato}`,
      `Protocolo de Origem: ${contrato.protocolo}`,
      `Cliente: ${currentUser?.name || "Cliente Bradesco Prime"} | CPF: ${currentUser?.identifier || "000.000.000-00"}`,
      "------------------------------------------------------------",
      `Bem Objeto de Garantia: ${contrato.bemDescricao} (${contrato.tipoBem})`,
      `Valor do Bem: ${brl(contrato.valorBem)}`,
      `Valor de Entrada: ${brl(contrato.valorEntrada)}`,
      `Valor Financiado: ${brl(contrato.valorFinanciado)}`,
      `Prazo: ${contrato.prazoMeses} parcelas mensais de ${brl(contrato.valorParcela)}`,
      `Taxa de Juros: ${contrato.taxaMensal}% a.m. (Sistema Tabela Price)`,
      `Valor Total da Operação: ${brl(contrato.totalPagar)}`,
      `Data de Emissão: ${contrato.dataAssinatura}`,
      "------------------------------------------------------------",
      "Documento gerado eletronicamente - Squad 44 Residência GrowUp.",
    ].join("\n");

    const blob = new Blob([textoContrato], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${contrato.idContrato}.txt`;
    link.click();
    URL.revokeObjectURL(url);

    setMensagemDownload(
      `Via do contrato ${contrato.idContrato} baixada com sucesso!`
    );
    setTimeout(() => setMensagemDownload(""), 4000);
  };

  // MODO 2: DETALHES DO FINANCIAMENTO + VISUALIZAÇÃO DO CONTRATO
  if (contratoSelecionado) {
    const progresso = Math.round(
      (contratoSelecionado.parcelasPagas / contratoSelecionado.prazoMeses) *
        100
    );

    return (
      <div className="auth-form">
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
              setExibirTermoContrato(false);
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
            ● Contrato {contratoSelecionado.statusContrato}
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
          <div><strong>Categoria do Bem:</strong> {contratoSelecionado.tipoBem}</div>
          <div><strong>Valor Total do Bem:</strong> {brl(contratoSelecionado.valorBem)}</div>
          <div><strong>Entrada Paga:</strong> {brl(contratoSelecionado.valorEntrada)}</div>
          <div><strong>Total da Operação:</strong> {brl(contratoSelecionado.totalPagar)}</div>
          <div><strong>Assinatura do Contrato:</strong> {contratoSelecionado.dataAssinatura}</div>
          <div><strong>1º Vencimento:</strong> {contratoSelecionado.primeiroVencimento}</div>
        </div>

        {/* Botões de Ação (Contrato e Parcelas) */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
          <button
            type="button"
            className="btn-primary-bradesco"
            style={{ width: "auto", padding: "0.75rem 1.25rem" }}
            onClick={() => setExibirTermoContrato(!exibirTermoContrato)}
          >
            <FileText size={16} style={{ marginRight: "0.4rem" }} />
            {exibirTermoContrato ? "Ocultar Minuta do Contrato" : "Visualizar Contrato"}
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
            <span>Baixar Via do Contrato</span>
          </button>

          {onIrParaParcelas && (
            <button
              type="button"
              className="tab-nav-btn"
              style={{
                border: "1px solid var(--bradesco-red)",
                color: "var(--bradesco-red)",
                padding: "0.75rem 1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
              onClick={() => onIrParaParcelas(contratoSelecionado)}
            >
              <Calendar size={16} />
              <span>Gerenciar Parcelas e Pagamentos</span>
            </button>
          )}
        </div>

        {/* Visualizador Formal do Contrato */}
        {exibirTermoContrato && (
          <div
            style={{
              padding: "1.25rem",
              borderRadius: "12px",
              border: "1px solid var(--card-border)",
              backgroundColor: "var(--bg-card-secondary)",
              fontSize: "0.84rem",
              lineHeight: 1.6,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <ShieldCheck size={18} style={{ color: "var(--bradesco-red)" }} />
              <strong>INSTRUMENTO PARTICULAR DE CRÉDITO DIRETO AO CONSUMIDOR (CDC)</strong>
            </div>
            <p style={{ marginBottom: "0.5rem" }}>
              <strong>CONTRATO Nº:</strong> {contratoSelecionado.idContrato} |{" "}
              <strong>DATA:</strong> {contratoSelecionado.dataAssinatura}
            </p>
            <p style={{ marginBottom: "0.5rem" }}>
              <strong>1. PARTES:</strong> De um lado, <strong>BANCO BRADESCO S.A.</strong> (Credor), e de outro lado,{" "}
              <strong>{currentUser?.name || "Titular da Conta"}</strong>, inscrito no CPF sob nº{" "}
              <strong>{currentUser?.identifier || "000.000.000-00"}</strong> (Financiado).
            </p>
            <p style={{ marginBottom: "0.5rem" }}>
              <strong>2. OBJETO E GARANTIA:</strong> Alienação fiduciária do bem{" "}
              <strong>{contratoSelecionado.bemDescricao}</strong> ({contratoSelecionado.tipoBem}), avaliado em{" "}
              {brl(contratoSelecionado.valorBem)}, com entrada de {brl(contratoSelecionado.valorEntrada)}.
            </p>
            <p style={{ marginBottom: "0.5rem" }}>
              <strong>3. CONDIÇÕES FINANCEIRAS:</strong> Valor líquido financiado de{" "}
              <strong>{brl(contratoSelecionado.valorFinanciado)}</strong>, amortizado pelo Sistema Francês (Tabela Price) em{" "}
              <strong>{contratoSelecionado.prazoMeses} prestações mensais</strong> de{" "}
              <strong>{brl(contratoSelecionado.valorParcela)}</strong>, incidindo juros remuneratórios de{" "}
              <strong>{contratoSelecionado.taxaMensal}% ao mês</strong>.
            </p>
            <p style={{ opacity: 0.8, fontSize: "0.78rem", marginTop: "0.75rem" }}>
              Assinado digitalmente mediante autenticação segura no Portal de Financiamentos Bradesco.
            </p>
          </div>
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
          Consulte seus contratos ativos, visualize os detalhes da operação e baixe a via formal.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
        {financiamentos.map((item) => (
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
                  {item.idContrato} • {item.tipoBem}
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
                onClick={() => setContratoSelecionado(item)}
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