import { api } from "../api";
import React, { useState, useMemo } from "react";
import {
  User,
  Mail,
  Phone,
  FileText,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  ArrowRight,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

export function RegisterForm({ onSuccessRegister }) {
  const [formData, setFormData] = useState({
    nascimento: "",
    renda: "",
    fullName: "",
    cpf: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
    receiveOffers: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Máscaras de formatação
  const formatCPF = (value) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
      .slice(0, 14);
  };

  const formatPhone = (value) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d{4})$/, "$1-$2")
      .slice(0, 15);
  };

  const handleChange = (field, value) => {
    let formattedValue = value;
    if (field === "cpf") formattedValue = formatCPF(value);
    if (field === "phone") formattedValue = formatPhone(value);

    setFormData((prev) => ({ ...prev, [field]: formattedValue }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Cálculo da força da senha
  const passwordCriteria = useMemo(() => {
    const pwd = formData.password;
    return {
      minLength: pwd.length >= 8,
      hasUpper: /[A-Z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    };
  }, [formData.password]);

  const passwordScore = useMemo(() => {
    const { minLength, hasUpper, hasNumber, hasSpecial } = passwordCriteria;
    let score = 0;
    if (minLength) score += 25;
    if (hasUpper) score += 25;
    if (hasNumber) score += 25;
    if (hasSpecial) score += 25;
    return score;
  }, [passwordCriteria]);

  const passwordStrengthLabel = useMemo(() => {
    if (passwordScore === 0)
      return { label: "Digite sua senha", color: "#9CA3AF" };
    if (passwordScore <= 25) return { label: "Fraca", color: "#EF4444" };
    if (passwordScore <= 50) return { label: "Regular", color: "#F59E0B" };
    if (passwordScore <= 75) return { label: "Boa", color: "#3B82F6" };
    return { label: "Forte e Segura", color: "#10B981" };
  }, [passwordScore]);

  // Preenchimento de exemplo para teste rápido
  const handleAutoFill = () => {
    const sampleData = {
      nascimento: "1995-05-20",
      renda: "15000",
      fullName: "Mariana Duarte Souza",
      cpf: "529.982.247-25",
      email: "mariana.duarte@email.com.br",
      phone: "(11) 98765-4321",
      password: "Bradesco#2026",
      confirmPassword: "Bradesco#2026",
      agreeTerms: true,
      receiveOffers: true,
    };
    setFormData(sampleData);
    setErrors({});
  };

  const validate = () => {
    const newErrors = {};
    if (
      !formData.fullName.trim() ||
      formData.fullName.trim().split(" ").length < 2
    ) {
      newErrors.fullName = "Informe seu nome e sobrenome completo.";
    }
    if (formData.cpf.length < 14) {
      newErrors.cpf = "Informe um CPF válido com 11 dígitos.";
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Informe um endereço de e-mail válido.";
    }
    if (formData.phone.length < 14) {
      newErrors.phone = "Informe seu telefone celular com DDD.";
    }
    if (
      !passwordCriteria.minLength ||
      !passwordCriteria.hasNumber ||
      formData.password.length > 64
    ) {
      newErrors.password =
        "A senha precisa ter pelo menos 8 caracteres e números.";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "As senhas digitadas não coincidem.";
    }
    if (!formData.agreeTerms) {
      newErrors.agreeTerms =
        "Confirme que está utilizando o ambiente acadêmico de testes.";
    }
    if (
      !formData.nascimento ||
      formData.nascimento >= new Date().toISOString().slice(0, 10)
    )
      newErrors.nascimento = "Informe uma data de nascimento passada.";
    if (formData.renda === "" || Number(formData.renda) < 0)
      newErrors.renda = "Informe uma renda válida.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading || !validate()) return;
    setIsLoading(true);
    try {
      await api("/auth/cadastro", {
        method: "POST",
        body: { ...formData, renda: formData.renda },
      });
      onSuccessRegister();
    } catch (e) {
      setErrors({ ...e.fields, general: e.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      className="auth-form register-form"
      onSubmit={handleSubmit}
      noValidate
    >
      {errors.general && (
        <div className="auth-alert error" role="alert">
          {errors.general}
        </div>
      )}
      <div className="form-row-account">
        <div className="form-group flex-1">
          <label className="form-label" htmlFor="reg-nascimento">
            Data de nascimento
          </label>
          <input
            id="reg-nascimento"
            className="form-input"
            type="date"
            value={formData.nascimento}
            onChange={(e) => handleChange("nascimento", e.target.value)}
            required
          />
          {errors.nascimento && (
            <span className="field-error-msg">{errors.nascimento}</span>
          )}
        </div>
        <div className="form-group flex-1">
          <label className="form-label" htmlFor="reg-renda">
            Renda mensal (R$)
          </label>
          <input
            id="reg-renda"
            className="form-input"
            type="number"
            min="0"
            step="0.01"
            value={formData.renda}
            onChange={(e) => handleChange("renda", e.target.value)}
            required
          />
          {errors.renda && (
            <span className="field-error-msg">{errors.renda}</span>
          )}
        </div>
      </div>
      <p className="form-security-footer">
        Demonstração acadêmica: score de teste definido pelo servidor, sem
        consulta a birôs de crédito.
      </p>
      {/* Botão de Preenchimento Rápido de Teste */}
      <div className="demo-helper-box mb-3">
        <button
          type="button"
          className="demo-autofill-btn"
          onClick={handleAutoFill}
        >
          <Sparkles size={13} />
          <span>Preencher dados de exemplo</span>
        </button>
      </div>

      {/* Nome Completo */}
      <div className="form-group">
        <label htmlFor="reg-fullname" className="form-label">
          Nome Completo
        </label>
        <div className="input-with-icon">
          <User size={18} className="input-icon" />
          <input
            id="reg-fullname"
            type="text"
            className={`form-input ${errors.fullName ? "has-error" : ""}`}
            placeholder="Ex: Mariana Duarte Souza"
            value={formData.fullName}
            onChange={(e) => handleChange("fullName", e.target.value)}
            required
          />
        </div>
        {errors.fullName && (
          <span className="field-error-msg">{errors.fullName}</span>
        )}
      </div>

      {/* CPF e Celular em Grid */}
      <div className="form-row-account">
        <div className="form-group flex-1">
          <label htmlFor="reg-cpf" className="form-label">
            CPF
          </label>
          <div className="input-with-icon">
            <FileText size={18} className="input-icon" />
            <input
              id="reg-cpf"
              type="text"
              className={`form-input ${errors.cpf ? "has-error" : ""}`}
              placeholder="000.000.000-00"
              value={formData.cpf}
              onChange={(e) => handleChange("cpf", e.target.value)}
              maxLength={14}
              required
            />
          </div>
          {errors.cpf && <span className="field-error-msg">{errors.cpf}</span>}
        </div>

        <div className="form-group flex-1">
          <label htmlFor="reg-phone" className="form-label">
            Celular (DDD)
          </label>
          <div className="input-with-icon">
            <Phone size={18} className="input-icon" />
            <input
              id="reg-phone"
              type="text"
              className={`form-input ${errors.phone ? "has-error" : ""}`}
              placeholder="(11) 90000-0000"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              maxLength={15}
              required
            />
          </div>
          {errors.phone && (
            <span className="field-error-msg">{errors.phone}</span>
          )}
        </div>
      </div>

      {/* E-mail */}
      <div className="form-group">
        <label htmlFor="reg-email" className="form-label">
          E-mail
        </label>
        <div className="input-with-icon">
          <Mail size={18} className="input-icon" />
          <input
            id="reg-email"
            type="email"
            className={`form-input ${errors.email ? "has-error" : ""}`}
            placeholder="seu.email@exemplo.com.br"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            required
          />
        </div>
        {errors.email && (
          <span className="field-error-msg">{errors.email}</span>
        )}
      </div>

      {/* Criar Senha */}
      <div className="form-group">
        <label htmlFor="reg-password" className="form-label">
          Criar Senha de Acesso
        </label>
        <div className="input-with-icon">
          <Lock size={18} className="input-icon" />
          <input
            id="reg-password"
            type={showPassword ? "text" : "password"}
            className={`form-input ${errors.password ? "has-error" : ""}`}
            placeholder="Crie uma senha forte"
            value={formData.password}
            onChange={(e) => handleChange("password", e.target.value)}
            required
          />
          <button
            type="button"
            className="password-toggle-btn"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* Indicador de força de senha */}
        {formData.password && (
          <div className="password-meter-wrapper">
            <div className="meter-header">
              <span>Segurança da senha:</span>
              <strong style={{ color: passwordStrengthLabel.color }}>
                {passwordStrengthLabel.label}
              </strong>
            </div>
            <div className="meter-track">
              <div
                className="meter-fill"
                style={{
                  width: `${passwordScore}%`,
                  backgroundColor: passwordStrengthLabel.color,
                }}
              />
            </div>

            <div className="password-rules-grid">
              <span
                className={`rule-item ${passwordCriteria.minLength ? "valid" : ""}`}
              >
                {passwordCriteria.minLength ? (
                  <Check size={12} />
                ) : (
                  <X size={12} />
                )}{" "}
                Mín. 8 caracteres
              </span>
              <span
                className={`rule-item ${passwordCriteria.hasUpper ? "valid" : ""}`}
              >
                {passwordCriteria.hasUpper ? (
                  <Check size={12} />
                ) : (
                  <X size={12} />
                )}{" "}
                Letra maiúscula
              </span>
              <span
                className={`rule-item ${passwordCriteria.hasNumber ? "valid" : ""}`}
              >
                {passwordCriteria.hasNumber ? (
                  <Check size={12} />
                ) : (
                  <X size={12} />
                )}{" "}
                Número
              </span>
              <span
                className={`rule-item ${passwordCriteria.hasSpecial ? "valid" : ""}`}
              >
                {passwordCriteria.hasSpecial ? (
                  <Check size={12} />
                ) : (
                  <X size={12} />
                )}{" "}
                Símbolo (!@#$)
              </span>
            </div>
          </div>
        )}
        {errors.password && (
          <span className="field-error-msg">{errors.password}</span>
        )}
      </div>

      {/* Confirmar Senha */}
      <div className="form-group">
        <label htmlFor="reg-confirm-password" className="form-label">
          Confirmar Senha
        </label>
        <div className="input-with-icon">
          <Lock size={18} className="input-icon" />
          <input
            id="reg-confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            className={`form-input ${errors.confirmPassword ? "has-error" : ""}`}
            placeholder="Repita sua senha"
            value={formData.confirmPassword}
            onChange={(e) => handleChange("confirmPassword", e.target.value)}
            required
          />
          <button
            type="button"
            className="password-toggle-btn"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label={
              showConfirmPassword ? "Ocultar confirmação" : "Exibir confirmação"
            }
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {formData.confirmPassword &&
          formData.password === formData.confirmPassword && (
            <span className="field-success-msg">
              <Check size={13} /> Senhas idênticas
            </span>
          )}
        {errors.confirmPassword && (
          <span className="field-error-msg">{errors.confirmPassword}</span>
        )}
      </div>

      {/* Termos e Condições */}
      <div className="form-group terms-box">
        <label className="checkbox-custom-label align-top">
          <input
            type="checkbox"
            checked={formData.agreeTerms}
            onChange={(e) => handleChange("agreeTerms", e.target.checked)}
            className="checkbox-native"
          />
          <span className="checkbox-box">
            {formData.agreeTerms && <Check size={13} className="check-svg" />}
          </span>
          <span className="checkbox-text text-sm">
            Entendo que esta é uma demonstração acadêmica e utilizarei dados
            fictícios para os testes.
          </span>
        </label>
        {errors.agreeTerms && (
          <span className="field-error-msg">{errors.agreeTerms}</span>
        )}
      </div>

      {/* Botão de Envio de Cadastro: "Criar conta" */}
      <button
        type="submit"
        className="btn-primary-bradesco"
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="btn-loading-content">
            <span className="spinner-circle" />
            <span>Criando cadastro...</span>
          </span>
        ) : (
          <span className="btn-content">
            <span>Criar conta</span>
            <ArrowRight size={18} className="btn-arrow-icon" />
          </span>
        )}
      </button>

      <div className="form-security-footer">
        <ShieldCheck size={14} className="security-icon" />
        <span>
          Seus dados são protegidos pela LGPD e pelos padrões de segurança
          Bradesco.
        </span>
      </div>
    </form>
  );
}

export default RegisterForm;
