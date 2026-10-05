(function () {
  "use strict";

  const ADMIN_EMAIL = "admin@realyze.com";
  const SESSION_KEY = "realyze_admin_session";
  const URL_KEY = "realyze_supabase_url";
  const ANON_KEY = "realyze_supabase_anon_key";

  function getConfig() {
    return {
      url: (localStorage.getItem(URL_KEY) || "").replace(/\/+$/, ""),
      key: localStorage.getItem(ANON_KEY) || ""
    };
  }

  function saveConfig(url, key) {
    localStorage.setItem(URL_KEY, String(url || "").trim().replace(/\/+$/, ""));
    localStorage.setItem(ANON_KEY, String(key || "").trim());
  }

  function hasConfig() {
    const c = getConfig();
    return /^https:\/\/.+\.supabase\.co$/i.test(c.url) && c.key.length > 20;
  }

  async function tryImportExistingConfig() {
    if (hasConfig()) return true;

    if (location.protocol === "file:") return false;

    try {
      const response = await fetch("./supabase-config.js?admin-config=" + Date.now(), {
        cache: "no-store"
      });
      if (!response.ok) return false;

      const text = await response.text();

      const urlMatch = text.match(
        /SUPABASE_URL\s*=\s*["'`]([^"'`]+)["'`]/
      );
      const keyMatch = text.match(
        /SUPABASE_ANON_KEY\s*=\s*["'`]([^"'`]+)["'`]/
      );

      if (!urlMatch || !keyMatch) return false;
      if (urlMatch[1].includes("YOUR_") || keyMatch[1].includes("YOUR_")) return false;

      saveConfig(urlMatch[1], keyMatch[1]);
      return hasConfig();
    } catch (error) {
      console.warn("Không tự đọc được supabase-config.js:", error);
      return false;
    }
  }

  function apiHeaders(accessToken, json) {
    const c = getConfig();
    const token = accessToken || c.key;

    const h = {
      apikey: c.key,
      Authorization: "Bearer " + token
    };

    if (json) h["Content-Type"] = "application/json";
    return h;
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
        (data && (data.msg || data.message || data.error_description || data.error)) ||
        ("HTTP " + response.status);

      const error = new Error(message);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  function storeSession(session) {
    if (!session) {
      localStorage.removeItem(SESSION_KEY);
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    session.expires_at =
      session.expires_at ||
      (session.expires_in ? now + Number(session.expires_in) : now + 3600);

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  function readSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    } catch {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  }

  async function refreshSession(session) {
    if (!session || !session.refresh_token) {
      storeSession(null);
      return null;
    }

    const c = getConfig();

    try {
      const response = await fetch(
        c.url + "/auth/v1/token?grant_type=refresh_token",
        {
          method: "POST",
          headers: apiHeaders(null, true),
          body: JSON.stringify({
            refresh_token: session.refresh_token
          })
        }
      );

      const data = await parseResponse(response);
      storeSession(data);
      return data;
    } catch (error) {
      storeSession(null);
      return null;
    }
  }

  async function signIn(email, password) {
    if (!hasConfig()) {
      return {
        ok: false,
        code: "not_configured",
        error: "Chưa có Project URL / anon key của Supabase."
      };
    }

    const c = getConfig();

    try {
      const response = await fetch(
        c.url + "/auth/v1/token?grant_type=password",
        {
          method: "POST",
          headers: apiHeaders(null, true),
          body: JSON.stringify({
            email: String(email || "").trim().toLowerCase(),
            password: String(password || "")
          })
        }
      );

      const session = await parseResponse(response);
      const user = session && session.user;

      if (!user || !session.access_token) {
        return {
          ok: false,
          code: "other",
          error: "Supabase không trả về phiên đăng nhập."
        };
      }

      if (String(user.email || "").toLowerCase() !== ADMIN_EMAIL) {
        storeSession(null);
        return {
          ok: false,
          code: "not_admin",
          error: "Tài khoản này không được phép vào Admin."
        };
      }

      storeSession(session);

      return {
        ok: true,
        code: "success",
        session: session,
        user: user
      };
    } catch (error) {
      const message = String(error && error.message || error);

      if (/invalid login credentials/i.test(message)) {
        return {
          ok: false,
          code: "invalid_credentials",
          error: "Sai email hoặc mật khẩu."
        };
      }

      if (/email not confirmed/i.test(message)) {
        return {
          ok: false,
          code: "email_not_confirmed",
          error: "Email chưa được xác nhận trong Supabase."
        };
      }

      if (/failed to fetch|network/i.test(message)) {
        return {
          ok: false,
          code: "network",
          error: "Không kết nối được tới Supabase API."
        };
      }

      return {
        ok: false,
        code: "other",
        error: message
      };
    }
  }

  async function getSession() {
    if (!hasConfig()) return null;

    let session = readSession();
    if (!session || !session.access_token) return null;

    const now = Math.floor(Date.now() / 1000);

    if (session.expires_at && Number(session.expires_at) <= now + 30) {
      session = await refreshSession(session);
      if (!session) return null;
    }

    const c = getConfig();

    try {
      const response = await fetch(c.url + "/auth/v1/user", {
        headers: apiHeaders(session.access_token, false)
      });

      const user = await parseResponse(response);

      return Object.assign({}, session, { user: user });
    } catch (error) {
      if (error.status === 401) {
        const renewed = await refreshSession(session);
        if (!renewed) return null;
        return getSession();
      }
      throw error;
    }
  }

  async function requireAdmin() {
    const session = await getSession();

    if (!session || !session.user) {
      location.href = "admin.html";
      return null;
    }

    if (String(session.user.email || "").toLowerCase() !== ADMIN_EMAIL) {
      await signOut();
      location.href = "admin.html";
      return null;
    }

    return session;
  }

  async function signOut() {
    const session = readSession();
    const c = getConfig();

    if (session && session.access_token && hasConfig()) {
      try {
        await fetch(c.url + "/auth/v1/logout", {
          method: "POST",
          headers: apiHeaders(session.access_token, false)
        });
      } catch {}
    }

    storeSession(null);
  }

  async function token() {
    const session = await getSession();
    if (!session || !session.access_token) {
      throw new Error("Bạn chưa đăng nhập.");
    }
    return session.access_token;
  }

  function makeQuery(params) {
    const search = new URLSearchParams();

    Object.keys(params || {}).forEach(function (key) {
      const value = params[key];
      if (value !== undefined && value !== null && value !== "") {
        search.set(key, String(value));
      }
    });

    const q = search.toString();
    return q ? "?" + q : "";
  }

  async function select(table, params) {
    const c = getConfig();
    const accessToken = await token();

    const response = await fetch(
      c.url + "/rest/v1/" + table + makeQuery(params || {}),
      {
        headers: apiHeaders(accessToken, false)
      }
    );

    return parseResponse(response);
  }

  async function insert(table, payload) {
    const c = getConfig();
    const accessToken = await token();

    const response = await fetch(c.url + "/rest/v1/" + table, {
      method: "POST",
      headers: Object.assign(
        apiHeaders(accessToken, true),
        { Prefer: "return=representation" }
      ),
      body: JSON.stringify(payload)
    });

    return parseResponse(response);
  }

  async function update(table, id, payload) {
    const c = getConfig();
    const accessToken = await token();

    const response = await fetch(
      c.url + "/rest/v1/" + table + "?id=eq." + encodeURIComponent(id),
      {
        method: "PATCH",
        headers: Object.assign(
          apiHeaders(accessToken, true),
          { Prefer: "return=representation" }
        ),
        body: JSON.stringify(payload)
      }
    );

    return parseResponse(response);
  }

  async function remove(table, id) {
    const c = getConfig();
    const accessToken = await token();

    const response = await fetch(
      c.url + "/rest/v1/" + table + "?id=eq." + encodeURIComponent(id),
      {
        method: "DELETE",
        headers: Object.assign(
          apiHeaders(accessToken, false),
          { Prefer: "return=representation" }
        )
      }
    );

    return parseResponse(response);
  }

  async function rpc(name, payload) {
    const c = getConfig();
    const accessToken = await token();

    const response = await fetch(
      c.url + "/rest/v1/rpc/" + name,
      {
        method: "POST",
        headers: apiHeaders(accessToken, true),
        body: JSON.stringify(payload || {})
      }
    );

    return parseResponse(response);
  }

  async function checkAdminPermission() {
    try {
      const result = await rpc("is_site_admin", {});
      return {
        ok: result === true,
        error: result === true ? "" : "User chưa có trong site_admins."
      };
    } catch (error) {
      return {
        ok: false,
        error: error.message || String(error)
      };
    }
  }

  async function upload(bucket, path, file) {
    const c = getConfig();
    const accessToken = await token();

    const encodedPath = String(path)
      .split("/")
      .map(encodeURIComponent)
      .join("/");

    const response = await fetch(
      c.url +
        "/storage/v1/object/" +
        encodeURIComponent(bucket) +
        "/" +
        encodedPath,
      {
        method: "POST",
        headers: Object.assign(
          apiHeaders(accessToken, false),
          {
            "Content-Type": file.type || "application/octet-stream",
            "x-upsert": "false"
          }
        ),
        body: file
      }
    );

    await parseResponse(response);

    return (
      c.url +
      "/storage/v1/object/public/" +
      encodeURIComponent(bucket) +
      "/" +
      encodedPath
    );
  }

  window.RealyzeAdmin = {
    ADMIN_EMAIL,
    getConfig,
    saveConfig,
    hasConfig,
    tryImportExistingConfig,
    signIn,
    getSession,
    requireAdmin,
    signOut,
    select,
    insert,
    update,
    remove,
    rpc,
    checkAdminPermission,
    upload
  };
})();
