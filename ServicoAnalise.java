import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Analise automatica de uma proposta. Uma instancia representa uma analise.
 * Usa idade >= 18 conforme o backlog atualizado.
 * Percentual financiado deve ser uma fracao: 0.90 significa 90%.
 * Dados invalidos geram IllegalArgumentException; reprovar credito e outro caso.
 */
public final class ServicoAnalise {
    private final boolean idadeStatus;
    private final boolean rendaStatus;
    private final boolean percentualStatus;
    private final boolean scoreStatus;

    public ServicoAnalise(int idade, BigDecimal renda, BigDecimal parcela,
                          BigDecimal percentualFinanciado, int score) {
        if (idade < 0) {
            throw new IllegalArgumentException("Idade nao pode ser negativa.");
        }
        if (renda == null || renda.signum() < 0) {
            throw new IllegalArgumentException("Renda e obrigatoria e nao pode ser negativa.");
        }
        if (parcela == null || parcela.signum() <= 0) {
            throw new IllegalArgumentException("Parcela e obrigatoria e deve ser maior que zero.");
        }
        if (percentualFinanciado == null
                || percentualFinanciado.signum() <= 0
                || percentualFinanciado.compareTo(BigDecimal.ONE) > 0) {
            throw new IllegalArgumentException(
                    "Percentual financiado deve estar entre 0 (exclusivo) e 1 (inclusivo). Use 0.90 para 90%.");
        }
        if (score < 0) {
            throw new IllegalArgumentException("Score nao pode ser negativo.");
        }

        // Os resultados sao calculados aqui, nunca recebidos do usuario.
        this.idadeStatus = idade >= 18;
        this.rendaStatus = renda.compareTo(parcela.multiply(new BigDecimal("3"))) > 0;
        this.percentualStatus = percentualFinanciado.compareTo(new BigDecimal("0.90")) <= 0;
        this.scoreStatus = score >= 600;
    }

    public boolean aprovaStatus() {
        return idadeStatus && rendaStatus && percentualStatus && scoreStatus;
    }

    public boolean isIdadeAprovada() { return idadeStatus; }
    public boolean isRendaAprovada() { return rendaStatus; }
    public boolean isPercentualAprovado() { return percentualStatus; }
    public boolean isScoreAprovado() { return scoreStatus; }

    public List<String> getMotivosReprovacao() {
        List<String> motivos = new ArrayList<>();
        if (!idadeStatus) motivos.add("Cliente deve ter pelo menos 18 anos.");
        if (!rendaStatus) motivos.add("Renda deve ser maior que tres vezes o valor da parcela.");
        if (!percentualStatus) motivos.add("Percentual financiado nao pode ultrapassar 90%.");
        if (!scoreStatus) motivos.add("Score deve ser de pelo menos 600.");
        return Collections.unmodifiableList(motivos);
    }

    public void mostraStatus() {
        System.out.println("Idade aprovada: " + idadeStatus);
        System.out.println("Renda aprovada: " + rendaStatus);
        System.out.println("Percentual financiado aprovado: " + percentualStatus);
        System.out.println("Score aprovado: " + scoreStatus);
        System.out.println("Status: " + (aprovaStatus() ? "Aprovado" : "Reprovado"));
        for (String motivo : getMotivosReprovacao()) {
            System.out.println("Motivo: " + motivo);
        }
    }

    // Exemplo executavel. Crie BigDecimal a partir de strings para preservar decimais.
    public static void main(String[] args) {
        ServicoAnalise analise = new ServicoAnalise(
                18, new BigDecimal("3000.01"), new BigDecimal("1000.00"),
                new BigDecimal("0.90"), 600);
        analise.mostraStatus();
    }
}
