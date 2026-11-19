ALTER TABLE financiamentos ADD COLUMN cliente_cpf VARCHAR(11);
ALTER TABLE financiamentos ADD COLUMN bem_tipo VARCHAR(20);
ALTER TABLE financiamentos ADD COLUMN bem_identificacao VARCHAR(80);
ALTER TABLE financiamentos ADD COLUMN identificacao_complementada BOOLEAN NOT NULL DEFAULT FALSE;

-- Contratos existentes recebem os dados disponíveis no cadastro nesta atualização.
UPDATE financiamentos SET
 cliente_cpf = (SELECT c.cpf FROM propostas p JOIN clientes c ON c.id = p.cliente_id
                WHERE p.id = financiamentos.proposta_id),
 bem_tipo = (SELECT b.tipo_bem FROM propostas p JOIN simulacoes s ON s.id = p.simulacao_id
             JOIN bens b ON b.id = s.bem_id WHERE p.id = financiamentos.proposta_id),
 bem_identificacao = (SELECT b.identificacao FROM propostas p JOIN simulacoes s ON s.id = p.simulacao_id
                     JOIN bens b ON b.id = s.bem_id WHERE p.id = financiamentos.proposta_id),
 identificacao_complementada = TRUE;

ALTER TABLE financiamentos ALTER COLUMN cliente_cpf SET NOT NULL;
ALTER TABLE financiamentos ALTER COLUMN bem_tipo SET NOT NULL;
ALTER TABLE financiamentos ALTER COLUMN bem_identificacao SET NOT NULL;
