CREATE TABLE financiamentos (
 id UUID PRIMARY KEY,
 proposta_id UUID NOT NULL UNIQUE REFERENCES propostas(id),
 contratado_em DATE NOT NULL,
 cliente_nome VARCHAR(120) NOT NULL,
 bem_descricao VARCHAR(200) NOT NULL,
 status VARCHAR(20) NOT NULL CHECK (status IN ('ATIVO','QUITADO'))
);

CREATE TABLE parcelas_financiamento (
 financiamento_id UUID NOT NULL REFERENCES financiamentos(id),
 numero INTEGER NOT NULL CHECK (numero > 0),
 vencimento DATE NOT NULL,
 valor NUMERIC(14,2) NOT NULL CHECK (valor > 0),
 juros NUMERIC(14,2) NOT NULL CHECK (juros >= 0),
 amortizacao NUMERIC(14,2) NOT NULL CHECK (amortizacao > 0),
 status VARCHAR(20) NOT NULL CHECK (status IN ('PENDENTE','PAGA','ATRASADA')),
 PRIMARY KEY (financiamento_id, numero),
 CHECK (valor = juros + amortizacao)
);
