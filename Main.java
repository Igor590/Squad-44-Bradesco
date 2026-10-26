import java.math.BigDecimal;
import java.util.NoSuchElementException;
import java.util.Scanner;

/** Entrada de dados pelo terminal para demonstrar o servico de analise. */
public final class Main {
    public static void main(String[] args) {
        try (Scanner scanner = new Scanner(System.in)) {
            System.out.println("=== ANALISE DE FINANCIAMENTO ===");
            System.out.println("Valores: use virgula ou ponto decimal, sem separador de milhar.");
            do {
                System.out.println();
                int idade = lerInteiro(scanner, "Idade (anos completos): ");
                BigDecimal renda = lerDecimal(scanner, "Renda mensal (R$): ", false, null);
                BigDecimal parcela = lerDecimal(scanner, "Valor da parcela (R$): ", true, null);
                BigDecimal percentual = lerDecimal(scanner,
                        "Percentual financiado (digite 90 para 90%): ", true, new BigDecimal("100"));
                int score = lerInteiro(scanner, "Score: ");

                // A tela recebe 90; o servico espera 0.90. A conversao e exata.
                ServicoAnalise analise = new ServicoAnalise(
                        idade, renda, parcela, percentual.movePointLeft(2), score);

                // Executa os metodos de aprovacao e de exibicao do resultado.
                boolean aprovado = analise.aprovaStatus();
                System.out.println("\n=== RESULTADO DA ANALISE ===");
                analise.mostraStatus();
                System.out.println(aprovado
                        ? "Proposta aprovada pelas quatro regras."
                        : "Proposta reprovada. Confira os motivos acima.");
            } while (novaAnalise(scanner));
            System.out.println("Programa encerrado.");
        } catch (NoSuchElementException e) {
            // EOF: o usuario fechou a entrada antes de terminar o preenchimento.
            System.out.println("\nEntrada encerrada. Programa finalizado.");
        }
    }

    private static int lerInteiro(Scanner scanner, String pergunta) {
        while (true) {
            System.out.print(pergunta);
            String texto = scanner.nextLine().trim();
            if (texto.matches("[0-9]+")) {
                try {
                    return Integer.parseInt(texto);
                } catch (NumberFormatException e) {
                    // Repete o campo quando o valor ultrapassa o limite de int.
                }
            }
            System.out.println("Valor invalido. Digite um numero inteiro nao negativo.");
        }
    }

    private static BigDecimal lerDecimal(Scanner scanner, String pergunta,
                                          boolean exigePositivo, BigDecimal maximo) {
        while (true) {
            System.out.print(pergunta);
            String texto = scanner.nextLine().trim();
            // Evita valores ambiguos como 1.000 (mil ou um) e notacao cientifica.
            if (!texto.matches("[0-9]+([.,][0-9]{1,2})?")) {
                System.out.println("Valor invalido. Exemplo: 3000,50 ou 3000.50, sem R$ e sem milhar.");
                continue;
            }
            BigDecimal valor = new BigDecimal(texto.replace(',', '.'));
            if (exigePositivo && valor.signum() == 0) {
                System.out.println("O valor deve ser maior que zero.");
                continue;
            }
            if (maximo != null && valor.compareTo(maximo) > 0) {
                System.out.println("O valor nao pode ultrapassar " + maximo.toPlainString() + ".");
                continue;
            }
            return valor;
        }
    }

    private static boolean novaAnalise(Scanner scanner) {
        while (true) {
            System.out.print("\nDeseja fazer outra analise? (s/n): ");
            String resposta = scanner.nextLine().trim();
            if (resposta.equalsIgnoreCase("s")) return true;
            if (resposta.equalsIgnoreCase("n")) return false;
            System.out.println("Digite s para continuar ou n para sair.");
        }
    }
}
