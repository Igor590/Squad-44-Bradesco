import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import { finalizarPdf } from "./contrato.js";

const moeda = (valor) => Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function gerarComprovantePdf(pagamento) {
  const pdf = new jsPDF();
  pdf.setProperties({ title: "Comprovante de pagamento - Squad 44", author: "Squad 44" });
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(51, 60, 75);
  pdf.setFontSize(18);
  pdf.text("COMPROVANTE DE PAGAMENTO", 18, 48);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text("Registro no Sistema de Gerenciamento de Financiamentos", 18, 57);
  autoTable(pdf, {
    startY: 68,
    margin: { left: 18, right: 18, top: 45, bottom: 24 },
    theme: "striped",
    head: [["Identificação", "Dados do pagamento"]],
    body: [
      ["Registro", pagamento.idPagamento],
      ["Contrato", pagamento.contratoId],
      ["Bem", pagamento.bemDescricao],
      ["Parcela", String(pagamento.numeroParcela).padStart(2, "0")],
      ["Data do pagamento", pagamento.dataPagamento.split("-").reverse().join("/")],
      ["Forma de pagamento informada", pagamento.formaPagamento],
      ["Valor original", moeda(pagamento.valorOriginal)],
      ["Multa", moeda(pagamento.multa)],
      ["Juros de mora", moeda(pagamento.jurosMora)],
      ["Total pago", moeda(pagamento.valorPago)],
    ],
    styles: { fontSize: 10, cellPadding: 4, overflow: "linebreak" },
    headStyles: { fillColor: [190, 14, 49] },
    columnStyles: { 0: { cellWidth: 65 }, 1: { cellWidth: 109 } },
  });
  let y = pdf.lastAutoTable.finalY + 10;
  const paragrafos = [
    pagamento.observacao ? "Observação: " + pagamento.observacao : "",
    "Este documento comprova o registro do pagamento no projeto acadêmico Squad 44. A forma de pagamento foi informada pelo usuário. O sistema não executa nem confirma transferências bancárias.",
  ].filter(Boolean);
  for (const paragrafo of paragrafos) {
    const linhas = pdf.splitTextToSize(paragrafo, 174);
    for (const linha of linhas) {
      if (y > 268) { pdf.addPage(); y = 48; }
      pdf.text(linha, 18, y);
      y += 5;
    }
    y += 5;
  }
  finalizarPdf(pdf, pagamento.dataPagamento);
  return pdf;
}
