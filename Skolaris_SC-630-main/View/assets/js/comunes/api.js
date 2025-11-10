const API_BASE = "http://localhost:8000/api";

export async function apiFetch(url, options = {}) {
    const token = localStorage.getItem("token");

    const headers = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    const res = await fetch(`${API_BASE}${url}`, { ...options, headers });

    let data;
    try {
        // Intentamos parsear siempre como JSON
        data = await res.json();
    } catch {
        // Si no es JSON, lo leemos como texto
        data = await res.text();
    }

    if (!res.ok) {
        // Si la respuesta es error, lanzamos excepción con mensaje legible
        const mensaje = typeof data === "string" ? data : data.error || `Error ${res.status}`;
        throw new Error(mensaje);
    }

    return data;
}

export function getToken() {
    return localStorage.getItem("token");
}
