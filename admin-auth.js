import {
  authSignIn,
  authGetSession,
  authSignOut,
  restRpc,
  hasSupabaseConfig
} from "./supabase-rest.js";

export const ADMIN_EMAIL = "admin@realyze.com";

export function friendlyAuthError(error) {
  const message =
    error?.message || String(error || "");

  if (
    /invalid login credentials/i.test(message) ||
    /invalid.*credentials/i.test(message)
  ) {
    return "Sai email hoặc mật khẩu.";
  }

  if (/email not confirmed/i.test(message)) {
    return "Email chưa được xác nhận trong Supabase Authentication.";
  }

  if (
    /failed to fetch/i.test(message) ||
    /network/i.test(message)
  ) {
    return (
      "Không kết nối được tới Supabase API. " +
      "Kiểm tra Project URL, anon key và hosting."
    );
  }

  return message;
}

export function authErrorCode(error) {
  const message =
    error?.message || String(error || "");

  if (
    /invalid login credentials/i.test(message) ||
    /invalid.*credentials/i.test(message)
  ) {
    return "invalid_credentials";
  }

  if (/email not confirmed/i.test(message)) {
    return "email_not_confirmed";
  }

  if (
    /failed to fetch/i.test(message) ||
    /network/i.test(message)
  ) {
    return "network";
  }

  return "other";
}

export async function loginAdmin(email, password) {
  if (location.protocol === "file:") {
    return {
      ok: false,
      code: "file_protocol",
      error:
        "Bạn đang mở web bằng file://. " +
        "Hãy chạy qua localhost hoặc hosting."
    };
  }

  if (!hasSupabaseConfig()) {
    return {
      ok: false,
      code: "not_configured",
      error:
        "Supabase chưa được cấu hình trong supabase-config.js."
    };
  }

  const normalizedEmail =
    email.trim().toLowerCase();

  try {
    const session = await authSignIn(
      normalizedEmail,
      password
    );

    const user = session?.user;

    if (!session?.access_token || !user) {
      return {
        ok: false,
        code: "other",
        error:
          "Supabase không tạo được phiên đăng nhập."
      };
    }

    const loggedEmail =
      (user.email || "").toLowerCase();

    if (loggedEmail !== ADMIN_EMAIL) {
      await authSignOut();

      return {
        ok: false,
        code: "not_admin",
        error:
          `Tài khoản ${loggedEmail || normalizedEmail} ` +
          "không được phép vào Admin."
      };
    }

    return {
      ok: true,
      code: "success",
      session,
      user
    };

  } catch (error) {
    return {
      ok: false,
      code: authErrorCode(error),
      error: friendlyAuthError(error)
    };
  }
}

export async function getAdminSession({
  redirect = true
} = {}) {
  if (!hasSupabaseConfig()) {
    return {
      ok: false,
      error:
        "Chưa cấu hình Supabase trong supabase-config.js."
    };
  }

  try {
    const session = await authGetSession();

    if (!session?.user) {
      if (redirect) {
        location.href = "admin.html";
      }

      return {
        ok: false,
        error: "Chưa đăng nhập."
      };
    }

    const email =
      (session.user.email || "").toLowerCase();

    if (email !== ADMIN_EMAIL) {
      await authSignOut();

      if (redirect) {
        location.href =
          "admin.html?error=not-admin";
      }

      return {
        ok: false,
        error:
          "Tài khoản này không phải Admin."
      };
    }

    return {
      ok: true,
      session,
      user: session.user
    };

  } catch (error) {
    return {
      ok: false,
      error: friendlyAuthError(error)
    };
  }
}

export async function logoutAdmin() {
  await authSignOut();
  location.href = "admin.html";
}

export async function checkDatabasePermission() {
  try {
    const value = await restRpc(
      "is_site_admin",
      {},
      { authenticated: true }
    );

    return {
      ok: value === true,
      error:
        value === true
          ? ""
          : "User chưa có trong bảng site_admins."
    };

  } catch (error) {
    return {
      ok: false,
      error:
        error?.message || String(error)
    };
  }
}
