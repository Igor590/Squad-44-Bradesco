import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

const moeda = (valor) => Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const data = (valor) => valor.split("-").reverse().join("/");

/** Gera o documento com as condições e parcelas recebidas da API. */
export function gerarContratoPdf(contrato) {
  const pdf = new jsPDF();
  const vermelho = [190, 14, 49];
  const cinza = [51, 60, 75];
  const margem = 18;
  let y = 48;
  pdf.setProperties({ title: "Contrato de financiamento - Squad 44", author: "Squad 44" });

  function texto(conteudo, tamanho = 9, negrito = false) {
    pdf.setFont("helvetica", negrito ? "bold" : "normal");
    pdf.setFontSize(tamanho);
    pdf.setTextColor(...cinza);
    const linhas = pdf.splitTextToSize(String(conteudo), 174);
    if (y + linhas.length * tamanho * 0.48 > 268) { pdf.addPage(); y = 45; }
    for (const linha of linhas) {
      if (y > 268) { pdf.addPage(); y = 45; }
      pdf.text(linha, margem, y);
      y += tamanho * 0.48;
    }
    y += 2;
  }

  function secao(titulo) {
    if (y > 245) { pdf.addPage(); y = 45; }
    y += 4;
    texto(titulo, 12, true);
  }

  texto("CONTRATO DE FINANCIAMENTO", 19, true);
  texto("Projeto acadêmico | Residência GrowUp", 10);
  y += 3;
  texto("Contrato " + contrato.idContrato, 9);
  texto("Proposta de origem " + contrato.protocolo, 9);

  secao("Identificação da contratação");
  texto("Cliente: " + contrato.clienteNome);
  texto("CPF: " + contrato.clienteCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"));
  texto("Bem: " + contrato.bemDescricao);
  texto("Tipo do bem: " + ({ veiculo: "Veículo", imovel: "Imóvel", outro: "Outro" }[contrato.bemTipo] || contrato.bemTipo));
  texto("Identificação do bem: " + (contrato.bemIdentificacao || "Não informada"));
  if (contrato.identificacaoComplementada) {
    texto("A identificação foi complementada com os dados disponíveis no cadastro na atualização do sistema.", 8);
  }
  texto("Data da contratação: " + data(contrato.contratadoEm));

  secao("Condições financeiras");
  autoTable(pdf, {
    startY: y,
    margin: { left: margem, right: margem, top: 45, bottom: 24 },
    theme: "striped",
    head: [["Condição", "Valor"]],
    body: [
      ["Valor do bem", moeda(contrato.valorBem)],
      ["Entrada prevista", moeda(contrato.entrada)],
      ["Valor financiado", moeda(contrato.valorFinanciado)],
      ["Prazo", contrato.prazoMeses + " meses"],
      ["Primeiro vencimento", data(contrato.parcelas[0].vencimento)],
      ["Último vencimento", data(contrato.parcelas.at(-1).vencimento)],
      ["Taxa mensal de juros", contrato.taxaMensalPercentual + "% ao mês"],
      ["Parcela padrão / última parcela", moeda(contrato.parcelaPadrao) + " / " + moeda(contrato.parcelas.at(-1).valor)],
      ["Total das parcelas", moeda(contrato.totalParcelas)],
      ["Total com entrada", moeda(contrato.totalComEntrada)],
    ],
    headStyles: { fillColor: vermelho },
    styles: { font: "helvetica", fontSize: 10, cellPadding: 2.5 },
    columnStyles: { 0: { cellWidth: 90 } },
  });
  y = pdf.lastAutoTable.finalY + 8;
  secao("Condições da operação acadêmica");
  texto("O financiamento segue o sistema Price. O valor de cada prestação é composto por juros e amortização do principal. A última prestação considera o ajuste de centavos para encerrar o saldo previsto.");
  texto("Os vencimentos são mensais, a partir do mês seguinte à contratação. Quando o mês não possui o dia da contratação, aplica-se o último dia desse mês.");
  texto("Em caso de atraso, os juros de mora são de 0,033% ao dia sobre o valor original da parcela. A multa única de 2% incide a partir do segundo dia de atraso. Os encargos acumulam até a data do pagamento.");
  texto("Este documento registra as condições do projeto acadêmico Squad 44. A simulação não inclui IOF, seguros ou tarifas. O sistema registra pagamentos informados pelo usuário, sem executar transferências bancárias. O acesso à conta não constitui assinatura digital.");

  if (y > 215) { pdf.addPage(); y = 48; }
  y += 5;
  texto("CRONOGRAMA DE PARCELAS", 17, true);
  texto("Contrato " + contrato.idContrato, 9);
  autoTable(pdf, {
    startY: y + 4,
    margin: { left: margem, right: margem, top: 45, bottom: 24 },
    head: [["Parcela", "Vencimento", "Prestação", "Juros", "Amortização"]],
    body: contrato.parcelas.map((p) => [
      p.numero, data(p.vencimento), moeda(p.valor), moeda(p.juros), moeda(p.amortizacao),
    ]),
    theme: "striped",
    headStyles: { fillColor: vermelho },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" } },
  });

  finalizarPdf(pdf, contrato.contratadoEm);
  return pdf;
}

export function finalizarPdf(pdf, dataReferencia) {
  const margem = 18;
  const vermelho = [190, 14, 49];
  const cinza = [51, 60, 75];
  const paginas = pdf.getNumberOfPages();
  for (let pagina = 1; pagina <= paginas; pagina++) {
    pdf.setPage(pagina);
    pdf.setFillColor(...vermelho);
    pdf.rect(0, 0, 210, 31, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(15);
    pdf.setTextColor(255);
    pdf.text("BRADESCO | SQUAD 44", margem, 16);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text("Sistema de Gerenciamento de Financiamentos", margem, 23);
    pdf.setDrawColor(215);
    pdf.line(margem, 278, 192, 278);
    pdf.setTextColor(...cinza);
    pdf.setFontSize(8);
    pdf.text("BRADESCO | SQUAD 44 | " + data(dataReferencia), margem, 284);
    pdf.text(pagina + " / " + paginas, 192, 284, { align: "right" });
  }
}
