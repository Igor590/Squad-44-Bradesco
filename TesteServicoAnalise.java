import java.math.BigDecimal;
import java.util.Arrays;

/** Testes da classe real, sem bibliotecas externas. */
public class TesteServicoAnalise {
    private static int testes;
    private static BigDecimal decimal(String valor) {
        return valor == null ? null : new BigDecimal(valor);
    }
    private static ServicoAnalise analisar(int idade, String renda, String parcela,
                                          String percentual, int score) {
        return new ServicoAnalise(idade, decimal(renda), decimal(parcela), decimal(percentual), score);
    }
    private static void verificar(String nome, ServicoAnalise analise, boolean aprovado,
                                  boolean idade, boolean renda, boolean percentual, boolean score) {
        boolean[] obtido = {analise.aprovaStatus(), analise.isIdadeAprovada(),
                analise.isRendaAprovada(), analise.isPercentualAprovado(), analise.isScoreAprovado()};
        boolean[] esperado = {aprovado, idade, renda, percentual, score};
        if (!Arrays.equals(obtido, esperado)) throw new AssertionError(nome);
        int falhas = (idade ? 0 : 1) + (renda ? 0 : 1) + (percentual ? 0 : 1) + (score ? 0 : 1);
        if (analise.getMotivosReprovacao().size() != falhas) throw new AssertionError(nome + ": motivos");
        testes++;
        System.out.println("OK: " + nome);
    }
    private static void invalido(String nome, Runnable acao) {
        try {
            acao.run();
        } catch (IllegalArgumentException e) {
            testes++;
            System.out.println("OK: " + nome);
            return;
        }
        throw new AssertionError("Entrada invalida aceita: " + nome);
    }
    public static void main(String[] args) {
        verificar("Limites: 18 anos, score 600, 90% e renda um centavo acima",
                analisar(18,"3000.01","1000","0.90",600),true,true,true,true,true);
        verificar("17 anos",analisar(17,"3001","1000","0.90",600),false,false,true,true,true);
        verificar("Renda igual a 3 parcelas",analisar(20,"3000","1000","0.90",600),false,true,false,true,true);
        verificar("Renda abaixo do limite",analisar(20,"2999.99","1000","0.90",600),false,true,false,true,true);
        verificar("Score 599",analisar(20,"3001","1000","0.90",599),false,true,true,true,false);
        verificar("Financiamento 90.01%",analisar(20,"3001","1000","0.9001",600),false,true,true,false,true);
        verificar("Financiamento 100%",analisar(20,"3001","1000","1",600),false,true,true,false,true);
        verificar("Todas as regras falham",analisar(17,"1000","1000","0.95",599),false,false,false,false,false);
        verificar("Renda e score zero",analisar(20,"0","1000","0.80",0),false,true,false,true,false);
        verificar("Decimais equivalentes",analisar(18,"3000.0100","1000.00","0.9000",600),true,true,true,true,true);
        invalido("Idade negativa",()->analisar(-1,"3001","1000","0.90",600));
        invalido("Renda negativa",()->analisar(20,"-1","1000","0.90",600));
        invalido("Renda nula",()->analisar(20,null,"1000","0.90",600));
        invalido("Parcela zero",()->analisar(20,"3001","0","0.90",600));
        invalido("Parcela negativa",()->analisar(20,"3001","-1","0.90",600));
        invalido("Parcela nula",()->analisar(20,"3001",null,"0.90",600));
        invalido("Percentual zero",()->analisar(20,"3001","1000","0",600));
        invalido("Percentual negativo",()->analisar(20,"3001","1000","-0.1",600));
        invalido("Percentual informado como 90",()->analisar(20,"3001","1000","90",600));
        invalido("Percentual nulo",()->analisar(20,"3001","1000",null,600));
        invalido("Score negativo",()->analisar(20,"3001","1000","0.90",-1));
        System.out.println("Total: " + testes + " testes passaram.");
    }
}
