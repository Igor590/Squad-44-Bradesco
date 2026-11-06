CREATE TABLE clientes (
 id UUID PRIMARY KEY, nome VARCHAR(120) NOT NULL, cpf VARCHAR(11) NOT NULL UNIQUE,
 email VARCHAR(254) NOT NULL UNIQUE, telefone VARCHAR(11) NOT NULL, nascimento DATE NOT NULL,
 renda NUMERIC(14,2) NOT NULL CHECK (renda>=0), senha_hash VARCHAR(100) NOT NULL,
 score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 1000)
);
CREATE TABLE bens (
 id UUID PRIMARY KEY, cliente_id UUID NOT NULL REFERENCES clientes(id),
 tipo_bem VARCHAR(20) NOT NULL CHECK (tipo_bem IN ('veiculo','imovel','outro')),
 descricao VARCHAR(200) NOT NULL, identificacao VARCHAR(80) NOT NULL,
 condicao_bem VARCHAR(20) NOT NULL, valor_numerico NUMERIC(14,2) NOT NULL CHECK (valor_numerico>0)
);
CREATE INDEX idx_bens_cliente ON bens(cliente_id);
CREATE TABLE simulacoes (
 id UUID PRIMARY KEY, cliente_id UUID NOT NULL REFERENCES clientes(id),
 bem_id UUID NOT NULL REFERENCES bens(id), criada_em TIMESTAMP WITH TIME ZONE NOT NULL,
 resultado_json TEXT NOT NULL
);
CREATE INDEX idx_simulacoes_cliente ON simulacoes(cliente_id);
CREATE TABLE propostas (
 id UUID PRIMARY KEY, cliente_id UUID NOT NULL REFERENCES clientes(id),
 simulacao_id UUID NOT NULL UNIQUE REFERENCES simulacoes(id), criada_em TIMESTAMP WITH TIME ZONE NOT NULL,
 status VARCHAR(20) NOT NULL CHECK (status IN ('EM_ANALISE','APROVADO','REPROVADO')),
 motivos_json TEXT NOT NULL, idade_analisada INTEGER NOT NULL,
 renda_analisada NUMERIC(14,2) NOT NULL, score_analisado INTEGER NOT NULL
);
CREATE INDEX idx_propostas_cliente_data ON propostas(cliente_id,criada_em);
