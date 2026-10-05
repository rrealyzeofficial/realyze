(function () {
"use strict";

const {
  requireAdmin,
  signOut,
  checkAdminPermission,
  select,
  insert,
  update,
  remove,
  upload
} = window.RealyzeAdmin;

const getAdminSession = async () => {
  const session = await requireAdmin();
  return session
    ? { ok: true, user: session.user, session }
    : { ok: false };
};

const logoutAdmin = async () => {
  await signOut();
  location.href = "admin.html";
};

const $ = s => document.querySelector(s);
const esc = (s = "") => String(s).replace(/[&<>"']/g, c => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
}[c]));

const section = document.body.dataset.adminSection;
let editingId = null;
let cachedItems = [];

const editorModal = $("#editorModal");
const editorFields = $("#editorFields");
const editorForm = $("#editorForm");
const deleteBtn = $("#deleteBtn");

function tableName() {
  return section === "news"
    ? "site_news"
    : section === "music"
    ? "site_songs"
    : "site_rules";
}

async function initialize() {
  const auth = await getAdminSession();
  if (!auth.ok) return;

  const permission = await checkAdminPermission();

  if (!permission.ok) {
    const warning = $("#permissionWarning");
    warning.hidden = false;
    warning.innerHTML = `
      <b>Đã đăng nhập Auth bằng ${esc(auth.user.email || "")}.</b><br>
      Nhưng database từ chối quyền Admin: ${esc(permission.error)}<br>
      Hãy chạy <b>admin-access-fix.sql</b> trong Supabase SQL Editor.
    `;
    $("#newItemBtn").disabled = true;
    $("#adminList").innerHTML =
      '<div class="cms-empty">Chưa thể đọc dữ liệu cho tới khi quyền database được sửa.</div>';
    return;
  }

  loadList();
}

$("#logoutBtn").addEventListener("click", logoutAdmin);
$("#newItemBtn").addEventListener("click", () => openEditor());
$("#editorClose").addEventListener("click", () => editorModal.close());
$("#cancelEditor").addEventListener("click", () => editorModal.close());

async function loadList() {
  $("#adminList").innerHTML = '<div class="cms-loading">Loading...</div>';

  try {
    const order =
      section === "rules"
        ? "sort_order.asc,created_at.desc"
        : section === "music"
        ? "release_date.desc"
        : "published_at.desc";

    cachedItems = await select(
      tableName(),
      { select: "*", order }
    );

    renderList();
  } catch (error) {
    $("#adminList").innerHTML =
      `<div class="cms-admin-warning">${esc(error.message || String(error))}</div>`;
  }
}

function renderList() {
  const host = $("#adminList");

  if (!cachedItems.length) {
    host.innerHTML =
      '<div class="cms-empty">Chưa có nội dung. Bấm “+ Thêm mới”.</div>';
    return;
  }

  host.innerHTML = cachedItems.map(item => {
    const title = section === "music"
      ? item.title
      : item.title_vi || "Untitled";

    const meta = section === "news"
      ? item.published_at || ""
      : section === "music"
      ? `${item.singers || "—"} · ${item.release_date || ""}`
      : `Thứ tự: ${item.sort_order ?? 0}`;

    const image = section !== "rules" && item.image_url
      ? `<img class="admin-row-thumb" src="${esc(item.image_url)}" alt="">`
      : `<div class="admin-row-noimg">${section === "rules" ? "Aa" : "IMG"}</div>`;

    return `
      <article class="admin-row" data-id="${item.id}">
        ${image}
        <div>
          <h3>${esc(title)}</h3>
          <p>${esc(meta)}</p>
        </div>
        <span class="admin-status ${item.is_published ? "" : "off"}">
          ${item.is_published ? "Published" : "Draft"}
        </span>
      </article>
    `;
  }).join("");

  host.querySelectorAll(".admin-row").forEach(row => {
    row.addEventListener("click", () => openEditor(row.dataset.id));
  });
}

function inputField(label, name, value = "", type = "text") {
  return `
    <div class="admin-field">
      <label>${label}
        <input class="admin-input" name="${name}" type="${type}" value="${esc(value ?? "")}">
      </label>
    </div>`;
}

function textareaField(label, name, value = "") {
  return `
    <div class="admin-field full">
      <label>${label}
        <textarea class="admin-textarea" name="${name}">${esc(value ?? "")}</textarea>
      </label>
    </div>`;
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

      <div
        class="rich-editor"
        contenteditable="true"
        data-rich-name="${name}"
      >${html || ""}</div>
    </div>`;
}

function imageUploadField(current = "") {
  return `
    <div class="admin-field full">
      <label>Ảnh
        <input class="admin-input" id="imageFile" type="file" accept="image/*">
      </label>

      <input type="hidden" name="image_url" value="${esc(current || "")}">

      ${
        current
          ? `<img class="admin-image-preview" id="imagePreview" src="${esc(current)}" alt="">`
          : `<img class="admin-image-preview" id="imagePreview" hidden alt="">`
      }
    </div>`;
}

function publishedField(value = true) {
  return `
    <div class="admin-field full">
      <label class="admin-check">
        <input name="is_published" type="checkbox" ${value ? "checked" : ""}>
        Hiển thị công khai
      </label>
    </div>`;
}

function buildEditor(item = {}) {
  const editing = !!editingId;
  let html = `<h2 class="admin-editor-title">${editing ? "Chỉnh sửa" : "Thêm mới"}</h2>`;

  if (section === "news") {
    html += `
      <div class="admin-fields-grid">
        ${inputField("Tiêu đề (VI)", "title_vi", item.title_vi)}
        ${inputField(
          "Ngày đăng",
          "published_at",
          item.published_at || new Date().toISOString().slice(0, 10),
          "date"
        )}

        ${inputField("Title (EN)", "title_en", item.title_en)}
        ${inputField("タイトル (JP)", "title_ja", item.title_ja)}

        ${imageUploadField(item.image_url)}

        ${richField("Nội dung (VI)", "body_vi", item.body_vi)}
        ${richField("Content (EN)", "body_en", item.body_en)}
        ${richField("内容 (JP)", "body_ja", item.body_ja)}

        ${publishedField(item.is_published !== false)}
      </div>`;
  }

  if (section === "music") {
    html += `
      <div class="admin-fields-grid">
        ${inputField("Tên bài hát", "title", item.title)}
        ${inputField("Người hát", "singers", item.singers)}

        ${inputField(
          "Ngày ra mắt",
          "release_date",
          item.release_date || new Date().toISOString().slice(0, 10),
          "date"
        )}

        ${inputField("Link bài hát / YouTube", "external_url", item.external_url, "url")}

        ${imageUploadField(item.image_url)}

        ${textareaField("Mô tả (VI)", "description_vi", item.description_vi)}
        ${textareaField("Description (EN)", "description_en", item.description_en)}
        ${textareaField("説明 (JP)", "description_ja", item.description_ja)}

        ${publishedField(item.is_published !== false)}
      </div>`;
  }

  if (section === "rules") {
    html += `
      <div class="admin-fields-grid">
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
  document.querySelectorAll(".rich-toolbar button").forEach(button => {
    button.addEventListener("click", () => {
      const toolbar = button.closest(".rich-toolbar");
      const editor = document.querySelector(
        `[data-rich-name="${toolbar.dataset.for}"]`
      );

      editor.focus();

      if (button.dataset.cmd === "formatBlock") {
        document.execCommand(
          "formatBlock",
          false,
          button.dataset.value
        );
      } else {
        document.execCommand(button.dataset.cmd, false, null);
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

  const item = id
    ? cachedItems.find(x => String(x.id) === String(id)) || {}
    : {};

  buildEditor(item);

  deleteBtn.hidden = !id;
  editorModal.showModal();
}

async function uploadImageIfNeeded(formData) {
  const file = $("#imageFile")?.files?.[0];

  if (!file) {
    return formData.get("image_url") || "";
  }

  const extension =
    (file.name.split(".").pop() || "jpg").toLowerCase();

  const path =
    `${section}/${crypto.randomUUID()}.${extension}`;

  return await upload("cms-media", path, file);
}

function collectRich(name) {
  return document.querySelector(
    `[data-rich-name="${name}"]`
  )?.innerHTML.trim() || "";
}

editorForm.addEventListener("submit", async event => {
  event.preventDefault();

  const formData = new FormData(editorForm);
  const submitButton =
    editorForm.querySelector('button[type="submit"]');

  submitButton.disabled = true;
  submitButton.textContent = "Đang lưu...";

  try {
    let payload = {};

    if (section === "news") {
      payload = {
        title_vi: formData.get("title_vi")?.trim(),
        title_en: formData.get("title_en")?.trim() || null,
        title_ja: formData.get("title_ja")?.trim() || null,

        body_vi: collectRich("body_vi"),
        body_en: collectRich("body_en") || null,
        body_ja: collectRich("body_ja") || null,

        image_url: await uploadImageIfNeeded(formData),
        published_at: formData.get("published_at"),
        is_published: formData.get("is_published") === "on"
      };
    }

    if (section === "music") {
      payload = {
        title: formData.get("title")?.trim(),
        singers: formData.get("singers")?.trim(),
        release_date: formData.get("release_date"),
        external_url: formData.get("external_url")?.trim() || null,

        image_url: await uploadImageIfNeeded(formData),

        description_vi:
          formData.get("description_vi")?.trim() || null,
        description_en:
          formData.get("description_en")?.trim() || null,
        description_ja:
          formData.get("description_ja")?.trim() || null,

        is_published: formData.get("is_published") === "on"
      };
    }

    if (section === "rules") {
      payload = {
        title_vi: formData.get("title_vi")?.trim(),
        title_en: formData.get("title_en")?.trim() || null,
        title_ja: formData.get("title_ja")?.trim() || null,

        body_vi: collectRich("body_vi"),
        body_en: collectRich("body_en") || null,
        body_ja: collectRich("body_ja") || null,

        sort_order: Number(formData.get("sort_order") || 0),
        is_published: formData.get("is_published") === "on"
      };
    }

    if (editingId) {
      await update(tableName(), editingId, payload);
    } else {
      await insert(tableName(), payload);
    }

    editorModal.close();
    await loadList();

  } catch (error) {
    alert(error.message || String(error));
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Lưu";
  }
});

deleteBtn.addEventListener("click", async () => {
  if (!editingId) return;

  if (!confirm("Xóa nội dung này?")) return;

  const { error } = await supabase
    .from(tableName())
    .delete()
    .eq("id", editingId);

  if (error) {
    alert(error.message);
    return;
  }

  editorModal.close();
  await loadList();
});

initialize();

})();
