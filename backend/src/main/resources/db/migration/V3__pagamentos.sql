CREATE TABLE pagamentos (
 id UUID PRIMARY KEY,
 financiamento_id UUID NOT NULL,
 numero_parcela INTEGER NOT NULL,
 valor_original NUMERIC(14,2) NOT NULL CHECK (valor_original > 0),
 multa NUMERIC(14,2) NOT NULL CHECK (multa >= 0),
 juros_mora NUMERIC(14,2) NOT NULL CHECK (juros_mora >= 0),
 valor_pago NUMERIC(14,2) NOT NULL,
 data_pagamento DATE NOT NULL,
 registrado_em TIMESTAMP WITH TIME ZONE NOT NULL,
 forma_pagamento VARCHAR(60) NOT NULL,
 observacao VARCHAR(500) NOT NULL,
 UNIQUE (financiamento_id, numero_parcela),
 FOREIGN KEY (financiamento_id, numero_parcela)
   REFERENCES parcelas_financiamento(financiamento_id, numero),
 CHECK (valor_pago = valor_original + multa + juros_mora)
);
CREATE INDEX idx_pagamentos_data ON pagamentos(data_pagamento, registrado_em);
