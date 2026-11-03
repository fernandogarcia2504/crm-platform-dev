// Capa de acceso a la API de la plataforma. Dos espacios de token
// separados: staff (consola de operación) y trainee (portal de cursos).

export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

type Json = Record<string, unknown>;

function authHeaders(tokenKey: string): HeadersInit {
    const token = localStorage.getItem(tokenKey);
    return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options: RequestInit, tokenKey: string): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...authHeaders(tokenKey),
            ...(options.headers || {})
        }
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error((data as Json).message as string || "Error en la solicitud");
    }

    return data as T;
}

// --- staff (consola de operación) ---
export const api = {
    get: <T>(path: string) => request<T>(path, { method: "GET" }, "token"),
    post: <T>(path: string, body?: unknown) =>
        request<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) }, "token"),
    put: <T>(path: string, body?: unknown) =>
        request<T>(path, { method: "PUT", body: JSON.stringify(body ?? {}) }, "token"),
    patch: <T>(path: string, body?: unknown) =>
        request<T>(path, { method: "PATCH", body: JSON.stringify(body ?? {}) }, "token"),
    del: <T>(path: string) => request<T>(path, { method: "DELETE" }, "token")
};

// --- trainee (portal de cursos) ---
export const traineeApi = {
    get: <T>(path: string) => request<T>(path, { method: "GET" }, "traineeToken"),
    post: <T>(path: string, body?: unknown) =>
        request<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) }, "traineeToken")
};
