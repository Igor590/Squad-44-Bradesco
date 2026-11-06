// Sessão em cookie HttpOnly; nenhuma senha ou token de login em localStorage.
export async function api(path, options = {}) {
  const method = options.method || "GET";
  const headers = { "Content-Type": "application/json" };
  try {
    if (!["GET", "HEAD"].includes(method)) {
      const csrfResponse = await fetch("/api/auth/csrf", {
        credentials: "same-origin",
        signal: AbortSignal.timeout(15000),
      });
      if (!csrfResponse.ok)
        throw new Error("Não foi possível iniciar a sessão.");
      const csrf = await csrfResponse.json();
      headers[csrf.headerName] = csrf.token;
    }
    const response = await fetch("/api" + path, {
      method,
      headers,
      credentials: "same-origin",
      signal: AbortSignal.timeout(15000),
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const data = response.status === 204 ? null : await response.json();
    if (!response.ok) {
      const error = new Error(
        data.message || "Não foi possível concluir a operação.",
      );
      error.status = response.status;
      error.fields = data.fields;
      if (
        response.status === 401 &&
        path !== "/auth/login" &&
        path !== "/auth/me"
      )
        window.dispatchEvent(new Event("sessao-expirada"));
      throw error;
    }
    return data;
  } catch (error) {
    if (error.name === "TimeoutError" || error.name === "AbortError")
      throw new Error(
        "O servidor demorou para responder. Confira o acompanhamento antes de repetir uma solicitação.",
      );
    if (error instanceof TypeError || error instanceof SyntaxError)
      throw new Error(
        "Não foi possível conectar ao servidor. Confira se o backend está em execução.",
      );
    throw error;
  }
}
export const brl = (value) =>
  Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
