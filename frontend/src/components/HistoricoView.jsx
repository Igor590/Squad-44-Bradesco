import React, { useState } from "react";
import {
  History,
  CheckCircle2,
  Download,
  Search,
  Receipt,
  CreditCard,
  Calendar,
} from "lucide-react";
import { brl } from "../api";

export default function HistoricoView({ historico = [], currentUser }) {
  const [busca, setBusca] = useState("");
  const [comprovanteAviso, setComprovanteAviso] = useState("");

  const registrosFiltrados = historico.filter((item) => {
    const termo = busca.toLowerCase();
    return (
      item.contratoId?.toLowerCase().includes(termo) ||
      item.bemDescricao?.toLowerCase().includes(termo) ||
      item.formaPagamento?.toLowerCase().includes(termo) ||
      String(item.numeroParcela).includes(termo)
    );
  });

  const totalQuitado = historico.reduce(
    (acc, item) => acc + Number(item.valorPago || 0),
    0
  );

  const handleBaixarComprovante = (item) => {
    const comprovante = [
      "BANCO BRADESCO S.A. - COMPROVANTE DE PAGAMENTO DE PARCELA",
      `Autenticação: ${item.idPagamento}`,
      `Contrato: ${item.contratoId} | Bem: ${item.bemDescricao}`,
      `Pagador: ${currentUser?.name || "Cliente Bradesco Prime"} | CPF: ${currentUser?.identifier || "000.000.000-00"}`,
      "------------------------------------------------------------",
      `Parcela Quitada: ${String(item.numeroParcela).padStart(2, "0")}`,
      `Valor Pago: ${brl(item.valorPago)}`,
      `Meio de Pagamento: ${item.formaPagamento}`,
      `Data da Quitação: ${item.dataPagamento}`,
      item.observacao ? `Observação: ${item.observacao}` : "",
      "------------------------------------------------------------",
      "Comprovante emitido pelo Portal de Financiamentos - Squad 44.",
    ]
      .filter(Boolean)
      .join("\n");

    const blob = new Blob([comprovante], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Comprovante_${item.contratoId}_P${item.numeroParcela}.txt`;
    link.click();
    URL.revokeObjectURL(url);

    setComprovanteAviso(
      `Comprovante da Parcela ${String(item.numeroParcela).padStart(2, "0")} baixado!`
    );
    setTimeout(() => setComprovanteAviso(""), 4000);
  };

  return (
    <div className="auth-form">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        <div>
          <h2 style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>
            Histórico de Pagamentos
          </h2>
          <p style={{ fontSize: "0.85rem", opacity: 0.75 }}>
            Extrato completo das parcelas quitadas, formas de pagamento e comprovantes.
          </p>
        </div>

        <div
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "12px",
            border: "1px solid var(--card-border)",
            backgroundColor: "var(--bg-card-secondary)",
            textAlign: "right",
          }}
        >
          <div style={{ fontSize: "0.72rem", opacity: 0.75 }}>
            Total Amortizado ({historico.length}{" "}
            {historico.length === 1 ? "pagamento" : "pagamentos"})
          </div>
          <strong style={{ fontSize: "1.1rem", color: "#10b981" }}>
            {brl(totalQuitado)}
          </strong>
        </div>
      </div>

      {comprovanteAviso && (
        <div
          className="auth-alert"
          role="status"
          style={{
            marginBottom: "1rem",
            borderColor: "#10b981",
            color: "#10b981",
          }}
        >
          {comprovanteAviso}
        </div>
      )}

      {/* Barra de Pesquisa */}
      <div className="form-group" style={{ marginBottom: "1rem" }}>
        <div style={{ position: "relative" }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "0.85rem",
              top: "50%",
              transform: "translateY(-50%)",
              opacity: 0.6,
            }}
          />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: "2.4rem" }}
            placeholder="Filtrar por contrato, bem, parcela ou forma de pagamento (ex: PIX)..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </div>

      {/* Lista do Histórico */}
      {registrosFiltrados.length === 0 ? (
        <div
          style={{
            padding: "2rem",
            textAlign: "center",
            borderRadius: "12px",
            border: "1px dashed var(--card-border)",
            opacity: 0.8,
          }}
        >
          <History size={28} style={{ marginBottom: "0.5rem", opacity: 0.6 }} />
          <p style={{ margin: 0, fontSize: "0.9rem" }}>
            Nenhum pagamento encontrado no histórico para este filtro.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {registrosFiltrados.map((item) => (
            <div
              key={item.idPagamento}
              style={{
                padding: "1rem 1.1rem",
                borderRadius: "12px",
                border: "1px solid var(--card-border)",
                backgroundColor: "var(--bg-card-secondary)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "0.85rem",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", flexWrap: "wrap" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      padding: "0.18rem 0.6rem",
                      borderRadius: "999px",
                      fontSize: "0.73rem",
                      fontWeight: 700,
                      backgroundColor: "rgba(16, 185, 129, 0.15)",
                      color: "#10b981",
                    }}
                  >
                    <CheckCircle2 size={12} /> Quitado
                  </span>
                  <strong>
                    Parcela {String(item.numeroParcela).padStart(2, "0")} •{" "}
                    {item.bemDescricao}
                  </strong>
                </div>

                <div style={{ fontSize: "0.82rem", opacity: 0.8 }}>
                  <Receipt size={13} style={{ verticalAlign: "middle", marginRight: "0.3rem" }} />
                  Contrato: <strong>{item.contratoId}</strong> •{" "}
                  <CreditCard size={13} style={{ verticalAlign: "middle", margin: "0 0.25rem 0 0.4rem" }} />
                  {item.formaPagamento} •{" "}
                  <Calendar size={13} style={{ verticalAlign: "middle", margin: "0 0.25rem 0 0.4rem" }} />
                  {item.dataPagamento}
                </div>

                {item.observacao && (
                  <div style={{ fontSize: "0.78rem", opacity: 0.7 }}>
                    Obs.: {item.observacao}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.72rem", opacity: 0.7 }}>Valor Pago</div>
                  <strong style={{ fontSize: "1rem", color: "#10b981" }}>
                    {brl(item.valorPago)}
                  </strong>
                </div>

                <button
                  type="button"
                  className="tab-nav-btn"
                  style={{
                    border: "1px solid var(--card-border)",
                    padding: "0.5rem 0.85rem",
                    fontSize: "0.8rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                  onClick={() => handleBaixarComprovante(item)}
                >
                  <Download size={14} />
                  <span>Comprovante</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}