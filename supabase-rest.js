import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  isSupabaseConfigured
} from "./supabase-config.js";

const SESSION_KEY = "realyze_supabase_session";

export function hasSupabaseConfig() {
  return Boolean(
    isSupabaseConfigured &&
    SUPABASE_URL &&
    SUPABASE_ANON_KEY
  );
}

function headers(accessToken = null, json = false) {
  const token = accessToken || SUPABASE_ANON_KEY;

  const result = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token}`
  };

  if (json) {
    result["Content-Type"] = "application/json";
  }

  return result;
}

async function parseResponse(response) {
  const raw = await response.text();
  let data = null;

  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = raw;
    }
  }

  if (!response.ok) {
    const message =
      data?.msg ||
      data?.message ||
      data?.error_description ||
      data?.error ||
      `HTTP ${response.status}`;

    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

function saveSession(session) {
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }

  const now = Math.floor(Date.now() / 1000);

  const normalized = {
    ...session,
    expires_at:
      session.expires_at ||
      (session.expires_in
        ? now + Number(session.expires_in)
        : now + 3600)
  };

  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify(normalized)
  );
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function getStoredSession() {
  try {
    return JSON.parse(
      localStorage.getItem(SESSION_KEY) || "null"
    );
  } catch {
    clearSession();
    return null;
  }
}

async function refreshSession(session) {
  if (!session?.refresh_token) {
    clearSession();
    return null;
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
      {
        method: "POST",
        headers: headers(null, true),
        body: JSON.stringify({
          refresh_token: session.refresh_token
        })
      }
    );

    const data = await parseResponse(response);
    saveSession(data);
    return data;

  } catch (error) {
    console.error("Supabase refresh error:", error);
    clearSession();
    return null;
  }
}

export async function authSignIn(email, password) {
  if (!hasSupabaseConfig()) {
    throw new Error(
      "Supabase chưa được cấu hình trong supabase-config.js."
    );
  }

  const response = await fetch(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: headers(null, true),
      body: JSON.stringify({
        email,
        password
      })
    }
  );

  const session = await parseResponse(response);
  saveSession(session);

  return session;
}

export async function authGetSession() {
  if (!hasSupabaseConfig()) return null;

  let session = getStoredSession();

  if (!session?.access_token) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);

  if (
    session.expires_at &&
    Number(session.expires_at) <= now + 30
  ) {
    session = await refreshSession(session);
    if (!session) return null;
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/auth/v1/user`,
      {
        headers: headers(session.access_token)
      }
    );

    const user = await parseResponse(response);

    return {
      ...session,
      user
    };

  } catch (error) {
    if (error.status === 401) {
      const refreshed = await refreshSession(session);

      if (!refreshed) return null;

      const response = await fetch(
        `${SUPABASE_URL}/auth/v1/user`,
        {
          headers: headers(refreshed.access_token)
        }
      );

      const user = await parseResponse(response);

      return {
        ...refreshed,
        user
      };
    }

    throw error;
  }
}

export async function authSignOut() {
  const session = getStoredSession();

  if (session?.access_token && hasSupabaseConfig()) {
    try {
      await fetch(
        `${SUPABASE_URL}/auth/v1/logout`,
        {
          method: "POST",
          headers: headers(session.access_token)
        }
      );
    } catch (error) {
      console.warn("Supabase logout error:", error);
    }
  }

  clearSession();
}

async function requireAccessToken() {
  const session = await authGetSession();

  if (!session?.access_token) {
    throw new Error("Bạn chưa đăng nhập.");
  }

  return session.access_token;
}

function queryString(params = {}) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      search.set(key, String(value));
    }
  }

  const q = search.toString();
  return q ? `?${q}` : "";
}

export async function restSelect(
  table,
  params = {},
  { authenticated = false } = {}
) {
  const token = authenticated
    ? await requireAccessToken()
    : null;

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}${queryString(params)}`,
    {
      headers: headers(token)
    }
  );

  return await parseResponse(response);
}

export async function restInsert(table, payload) {
  const token = await requireAccessToken();

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}`,
    {
      method: "POST",
      headers: {
        ...headers(token, true),
        Prefer: "return=representation"
      },
      body: JSON.stringify(payload)
    }
  );

  return await parseResponse(response);
}

export async function restUpdate(table, id, payload) {
  const token = await requireAccessToken();

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: {
        ...headers(token, true),
        Prefer: "return=representation"
      },
      body: JSON.stringify(payload)
    }
  );

  return await parseResponse(response);
}

export async function restDelete(table, id) {
  const token = await requireAccessToken();

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: {
        ...headers(token),
        Prefer: "return=representation"
      }
    }
  );

  return await parseResponse(response);
}

export async function restRpc(
  functionName,
  payload = {},
  { authenticated = true } = {}
) {
  const token = authenticated
    ? await requireAccessToken()
    : null;

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/rpc/${functionName}`,
    {
      method: "POST",
      headers: headers(token, true),
      body: JSON.stringify(payload)
    }
  );

  return await parseResponse(response);
}

export async function storageUpload(
  bucket,
  path,
  file
) {
  const token = await requireAccessToken();

  const encodedPath = path
    .split("/")
    .map(encodeURIComponent)
    .join("/");

  const response = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(bucket)}/${encodedPath}`,
    {
      method: "POST",
      headers: {
        ...headers(token),
        "Content-Type":
          file.type || "application/octet-stream",
        "x-upsert": "false"
      },
      body: file
    }
  );

  await parseResponse(response);

  return getStoragePublicUrl(bucket, path);
}

export function getStoragePublicUrl(bucket, path) {
  const encodedPath = path
    .split("/")
    .map(encodeURIComponent)
    .join("/");

  return (
    `${SUPABASE_URL}/storage/v1/object/public/` +
    `${encodeURIComponent(bucket)}/${encodedPath}`
  );
}
