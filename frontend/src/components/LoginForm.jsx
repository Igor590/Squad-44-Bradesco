import { useState } from "react";
import { api } from "../api";
export default function LoginForm({ onSuccessLogin }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);
  async function submit(e) {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      const user = await api("/auth/login", {
        method: "POST",
        body: { identifier, password },
      });
      await onSuccessLogin(user);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <form className="auth-form" onSubmit={submit}>
      {error && (
        <div className="auth-alert error" role="alert">
          {error}
        </div>
      )}
      <div className="form-group">
        <label className="form-label" htmlFor="login-identifier">
          CPF ou e-mail
        </label>
        <input
          id="login-identifier"
          className="form-input"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          autoComplete="username"
          maxLength={254}
          required
        />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="login-password">
          Senha
        </label>
        <input
          id="login-password"
          className="form-input"
          type={visible ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          maxLength={64}
          required
        />
      </div>
      <label>
        <input
          type="checkbox"
          checked={visible}
          onChange={(e) => setVisible(e.target.checked)}
        />{" "}
        Mostrar senha
      </label>
      <button className="btn-primary-bradesco" disabled={loading}>
        {loading ? "Entrando..." : "Entrar"}
      </button>
      <p className="form-security-footer">
        Use a conta criada na aba “Criar conta”.
      </p>
    </form>
  );
}
