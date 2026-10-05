import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from "./supabase-config.js";

const supabase = isSupabaseConfigured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

let currentTab = "news";
let editingId = null;
let cachedItems = [];

const $ = s => document.querySelector(s);
const esc = (s = "") => String(s).replace(/[&<>"']/g, c => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
}[c]));

const loginView = $("#loginView");
const adminApp = $("#adminApp");
const editorModal = $("#editorModal");
const editorFields = $("#editorFields");
const editorForm = $("#editorForm");
const deleteBtn = $("#deleteBtn");

function showError(message) {
  $("#loginError").textContent = message || "";
}

async function isAdmin(userId) {
  if (!supabase || !userId) return { ok: false, error: "Không có Supabase session." };

  // RPC này dùng SECURITY DEFINER ở SQL patch, ổn định hơn việc query trực tiếp
  // bảng site_admins qua RLS.
  const { data, error } = await supabase.rpc("is_site_admin");

  if (error) {
    console.error("Admin check error:", error);
    return {
      ok: false,
      error: `Không kiểm tra được quyền Admin: ${error.message}`
    };
  }

  return {
    ok: data === true,
    error: data === true ? "" : "Tài khoản đã đăng nhập nhưng chưa có quyền quản trị."
  };
}

function friendlyAuthError(error) {
  const message = error?.message || String(error || "");

  if (/invalid login credentials/i.test(message)) {
    return "Sai email hoặc mật khẩu. Nếu bạn vừa tạo user trong Supabase, hãy kiểm tra lại password đã đặt.";
  }

  if (/email not confirmed/i.test(message)) {
    return "Email chưa được xác nhận. Vào Supabase → Authentication → Users và confirm user admin@realyze.com.";
  }

  if (/failed to fetch|network/i.test(message)) {
    return "Không kết nối được Supabase. Kiểm tra Project URL / anon key và kết nối mạng.";
  }

  return message;
}

async function boot() {
  if (location.protocol === "file:") {
    showError(
      "Trang Admin không nên mở bằng file://. Hãy chạy website qua localhost, GitHub Pages hoặc hosting rồi mở /admin.html."
    );
    return;
  }

  if (!isSupabaseConfigured) {
    showError("Chưa cấu hình Supabase. Hãy điền Project URL và anon/publishable key trong supabase-config.js.");
    return;
  }

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    showError(`Không đọc được phiên đăng nhập: ${friendlyAuthError(error)}`);
    return;
  }

  const session = data.session;
  if (!session) return;

  const adminResult = await isAdmin(session.user.id);

  if (adminResult.ok) {
    enterAdmin();
  } else {
    await supabase.auth.signOut();
    showError(adminResult.error);
  }
}

$("#loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  showError("");

  if (location.protocol === "file:") {
    return showError(
      "Bạn đang mở admin.html trực tiếp bằng file://. Hãy chạy web qua localhost hoặc hosting trước."
    );
  }

  if (!supabase) {
    return showError("Supabase chưa được cấu hình trong supabase-config.js.");
  }

  const email = $("#loginEmail").value.trim().toLowerCase();
  const password = $("#loginPassword").value;

  if (!email || !password) {
    return showError("Hãy nhập đủ email và mật khẩu.");
  }

  const submitBtn = $("#loginForm").querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = "Đang đăng nhập...";

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      showError(friendlyAuthError(error));
      return;
    }

    // Xác nhận session/user thật sự đã được tạo.
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      await supabase.auth.signOut();
      showError(
        `Đăng nhập có phản hồi nhưng không lấy được user: ${friendlyAuthError(userError)}`
      );
      return;
    }

    const adminResult = await isAdmin(userData.user.id);

    if (!adminResult.ok) {
      await supabase.auth.signOut();
      showError(
        `${adminResult.error} Email: ${userData.user.email || email}. User ID: ${userData.user.id}`
      );
      return;
    }

    enterAdmin();
  } catch (err) {
    console.error(err);
    showError(friendlyAuthError(err));
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Đăng nhập";
  }
});

$("#logoutBtn").addEventListener("click", async () => {
  if (supabase) await supabase.auth.signOut();
  location.reload();
});

function enterAdmin() {
  loginView.hidden = true;
  adminApp.hidden = false;
  loadList();
}

document.querySelectorAll(".admin-tab").forEach(btn => {
  btn.addEventListener("click", () => {
    currentTab = btn.dataset.tab;
    editingId = null;
    document.querySelectorAll(".admin-tab").forEach(x => x.classList.toggle("active", x === btn));
    $("#adminSectionTitle").textContent =
      currentTab === "news" ? "News" : currentTab === "music" ? "Music" : "Rule";
    loadList();
  });
});

$("#newItemBtn").addEventListener("click", () => openEditor());
$("#editorClose").addEventListener("click", () => editorModal.close());
$("#cancelEditor").addEventListener("click", () => editorModal.close());

function tableName() {
  return currentTab === "news" ? "site_news" : currentTab === "music" ? "site_songs" : "site_rules";
}

async function loadList() {
  $("#adminList").innerHTML = '<div class="cms-loading">Loading...</div>';

  let query = supabase.from(tableName()).select("*");
  query = currentTab === "rules"
    ? query.order("sort_order", { ascending: true }).order("created_at", { ascending: false })
    : query.order(currentTab === "music" ? "release_date" : "published_at", { ascending: false });

  const { data, error } = await query;
  if (error) {
    $("#adminList").innerHTML = `<div class="cms-admin-warning">${esc(error.message)}</div>`;
    return;
  }

  cachedItems = data || [];
  renderList();
}

function renderList() {
  const host = $("#adminList");
  if (!cachedItems.length) {
    host.innerHTML = '<div class="cms-empty">Chưa có nội dung. Bấm “+ Thêm mới”.</div>';
    return;
  }

  host.innerHTML = cachedItems.map(item => {
    const title = currentTab === "music" ? item.title : item.title_vi || "Untitled";
    const meta = currentTab === "news"
      ? item.published_at || ""
      : currentTab === "music"
      ? `${item.singers || "—"} · ${item.release_date || ""}`
      : `Thứ tự: ${item.sort_order ?? 0}`;

    const img = currentTab !== "rules" && item.image_url
      ? `<img class="admin-row-thumb" src="${esc(item.image_url)}" alt="">`
      : `<div class="admin-row-noimg">${currentTab === "rules" ? "Aa" : "IMG"}</div>`;

    return `
      <article class="admin-row" data-id="${item.id}">
        ${img}
        <div><h3>${esc(title)}</h3><p>${esc(meta)}</p></div>
        <span class="admin-status ${item.is_published ? "" : "off"}">${item.is_published ? "Published" : "Draft"}</span>
      </article>
    `;
  }).join("");

  host.querySelectorAll(".admin-row").forEach(row => {
    row.addEventListener("click", () => openEditor(row.dataset.id));
  });
}

function inputField(label, name, value = "", type = "text", extra = "") {
  return `<div class="admin-field"><label>${label}<input class="admin-input" name="${name}" type="${type}" value="${esc(value ?? "")}" ${extra}></label></div>`;
}

function textareaField(label, name, value = "") {
  return `<div class="admin-field full"><label>${label}<textarea class="admin-textarea" name="${name}">${esc(value ?? "")}</textarea></label></div>`;
}

function richField(label, name, html = "") {
  return `
    <div class="admin-field full">
      <label>${label}</label>
      <div class="rich-toolbar" data-for="${name}">
        <button type="button" data-cmd="formatBlock" data-value="h1">H1</button>
        <button type="button" data-cmd="formatBlock" data-value="h2">H2</button>
        <button type="button" data-cmd="formatBlock" data-value="h3">H3</button>
        <button type="button" data-cmd="formatBlock" data-value="p">P</button>
        <button type="button" data-cmd="bold"><b>B</b></button>
        <button type="button" data-cmd="italic"><i>I</i></button>
        <button type="button" data-cmd="insertUnorderedList">• List</button>
        <button type="button" data-cmd="insertOrderedList">1. List</button>
        <button type="button" data-cmd="formatBlock" data-value="blockquote">❝</button>
      </div>
      <div class="rich-editor" contenteditable="true" data-rich-name="${name}">${html || ""}</div>
    </div>`;
}

function imageUploadField(current = "") {
  return `
    <div class="admin-field full">
      <label>Ảnh
        <input class="admin-input" id="imageFile" type="file" accept="image/*">
      </label>
      <input type="hidden" name="image_url" value="${esc(current || "")}">
      ${current ? `<img class="admin-image-preview" id="imagePreview" src="${esc(current)}" alt="">` : `<img class="admin-image-preview" id="imagePreview" hidden alt="">`}
    </div>`;
}

function publishedField(value = true) {
  return `<div class="admin-field full"><label class="admin-check"><input name="is_published" type="checkbox" ${value ? "checked" : ""}> Hiển thị công khai</label></div>`;
}

function buildEditor(item = {}) {
  const editing = !!editingId;
  let html = `<h2 class="admin-editor-title">${editing ? "Chỉnh sửa" : "Thêm mới"} ${currentTab === "news" ? "News" : currentTab === "music" ? "Music" : "Rule"}</h2>`;

  if (currentTab === "news") {
    html += `<div class="admin-fields-grid">
      ${inputField("Tiêu đề (VI)", "title_vi", item.title_vi)}
      ${inputField("Ngày đăng", "published_at", item.published_at || new Date().toISOString().slice(0,10), "date")}
      ${inputField("Title (EN)", "title_en", item.title_en)}
      ${inputField("タイトル (JP)", "title_ja", item.title_ja)}
      ${imageUploadField(item.image_url)}
      ${richField("Nội dung (VI)", "body_vi", item.body_vi)}
      ${richField("Content (EN)", "body_en", item.body_en)}
      ${richField("内容 (JP)", "body_ja", item.body_ja)}
      ${publishedField(item.is_published !== false)}
    </div>`;
  } else if (currentTab === "music") {
    html += `<div class="admin-fields-grid">
      ${inputField("Tên bài hát", "title", item.title)}
      ${inputField("Người hát", "singers", item.singers)}
      ${inputField("Ngày ra mắt", "release_date", item.release_date || new Date().toISOString().slice(0,10), "date")}
      ${inputField("Link bài hát / YouTube", "external_url", item.external_url, "url")}
      ${imageUploadField(item.image_url)}
      ${textareaField("Mô tả (VI)", "description_vi", item.description_vi)}
      ${textareaField("Description (EN)", "description_en", item.description_en)}
      ${textareaField("説明 (JP)", "description_ja", item.description_ja)}
      ${publishedField(item.is_published !== false)}
    </div>`;
  } else {
    html += `<div class="admin-fields-grid">
      ${inputField("Tiêu đề Rule (VI)", "title_vi", item.title_vi)}
      ${inputField("Thứ tự", "sort_order", item.sort_order ?? 0, "number")}
      ${inputField("Rule title (EN)", "title_en", item.title_en)}
      ${inputField("ルールタイトル (JP)", "title_ja", item.title_ja)}
      ${richField("Nội dung Rule (VI)", "body_vi", item.body_vi)}
      ${richField("Rule content (EN)", "body_en", item.body_en)}
      ${richField("ルール内容 (JP)", "body_ja", item.body_ja)}
      ${publishedField(item.is_published !== false)}
    </div>`;
  }

  editorFields.innerHTML = html;
  bindRichToolbar();
  bindImagePreview();
}

function bindRichToolbar() {
  document.querySelectorAll(".rich-toolbar button").forEach(btn => {
    btn.addEventListener("click", () => {
      const toolbar = btn.closest(".rich-toolbar");
      const editor = document.querySelector(`[data-rich-name="${toolbar.dataset.for}"]`);
      editor.focus();
      if (btn.dataset.cmd === "formatBlock") {
        document.execCommand("formatBlock", false, btn.dataset.value);
      } else {
        document.execCommand(btn.dataset.cmd, false, null);
      }
    });
  });
}

function bindImagePreview() {
  const input = $("#imageFile");
  if (!input) return;
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (!file) return;
    const preview = $("#imagePreview");
    preview.src = URL.createObjectURL(file);
    preview.hidden = false;
  });
}

function openEditor(id = null) {
  editingId = id;
  const item = id ? cachedItems.find(x => String(x.id) === String(id)) || {} : {};
  buildEditor(item);
  deleteBtn.hidden = !id;
  editorModal.showModal();
}

async function uploadImageIfNeeded(formData) {
  const file = $("#imageFile")?.files?.[0];
  if (!file) return formData.get("image_url") || "";

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${currentTab}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("cms-media")
    .upload(path, file, { upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from("cms-media").getPublicUrl(path);
  return data.publicUrl;
}

function collectRich(name) {
  return document.querySelector(`[data-rich-name="${name}"]`)?.innerHTML.trim() || "";
}

editorForm.addEventListener("submit", async e => {
  e.preventDefault();
  const fd = new FormData(editorForm);
  const submit = editorForm.querySelector('button[type="submit"]');
  submit.disabled = true;
  submit.textContent = "Đang lưu...";

  try {
    let payload = {};

    if (currentTab === "news") {
      payload = {
        title_vi: fd.get("title_vi")?.trim(),
        title_en: fd.get("title_en")?.trim() || null,
        title_ja: fd.get("title_ja")?.trim() || null,
        body_vi: collectRich("body_vi"),
        body_en: collectRich("body_en") || null,
        body_ja: collectRich("body_ja") || null,
        image_url: await uploadImageIfNeeded(fd),
        published_at: fd.get("published_at"),
        is_published: fd.get("is_published") === "on"
      };
    } else if (currentTab === "music") {
      payload = {
        title: fd.get("title")?.trim(),
        singers: fd.get("singers")?.trim(),
        release_date: fd.get("release_date"),
        external_url: fd.get("external_url")?.trim() || null,
        image_url: await uploadImageIfNeeded(fd),
        description_vi: fd.get("description_vi")?.trim() || null,
        description_en: fd.get("description_en")?.trim() || null,
        description_ja: fd.get("description_ja")?.trim() || null,
        is_published: fd.get("is_published") === "on"
      };
    } else {
      payload = {
        title_vi: fd.get("title_vi")?.trim(),
        title_en: fd.get("title_en")?.trim() || null,
        title_ja: fd.get("title_ja")?.trim() || null,
        body_vi: collectRich("body_vi"),
        body_en: collectRich("body_en") || null,
        body_ja: collectRich("body_ja") || null,
        sort_order: Number(fd.get("sort_order") || 0),
        is_published: fd.get("is_published") === "on"
      };
    }

    const query = editingId
      ? supabase.from(tableName()).update(payload).eq("id", editingId)
      : supabase.from(tableName()).insert(payload);

    const { error } = await query;
    if (error) throw error;

    editorModal.close();
    await loadList();
  } catch (err) {
    alert(err.message || String(err));
  } finally {
    submit.disabled = false;
    submit.textContent = "Lưu";
  }
});

deleteBtn.addEventListener("click", async () => {
  if (!editingId || !confirm("Xóa nội dung này?")) return;
  const { error } = await supabase.from(tableName()).delete().eq("id", editingId);
  if (error) return alert(error.message);
  editorModal.close();
  await loadList();
});

boot();
