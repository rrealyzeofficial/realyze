(function () {
  "use strict";

  const Admin = window.RealyzeAdmin;

  if (!Admin) {
    console.error("Missing admin-runtime.js");
    return;
  }

  const $ = function (selector) {
    return document.querySelector(selector);
  };

  const section =
    document.body.dataset.adminSection;

  let editingId = null;
  let cachedItems = [];

  const editorModal = $("#editorModal");
  const editorFields = $("#editorFields");
  const editorForm = $("#editorForm");
  const deleteBtn = $("#deleteBtn");

  function esc(value) {
    return String(value == null ? "" : value).replace(
      /[&<>"']/g,
      function (char) {
        return {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;"
        }[char];
      }
    );
  }

  function tableName() {
    if (section === "news") return "site_news";
    if (section === "music") return "site_songs";
    if (section === "members") return "site_members";
    if (section === "rules") return "site_rules";
    return "site_about";
  }

  async function initialize() {
    const session =
      await Admin.requireAdmin();

    if (!session) return;

    const permission =
      await Admin.checkAdminPermission();

    if (!permission.ok) {
      const warning =
        $("#permissionWarning");

      warning.hidden = false;
      warning.innerHTML =
        "<b>Đã đăng nhập.</b><br>" +
        "Database từ chối quyền Admin: " +
        esc(permission.error);

      $("#newItemBtn").disabled = true;
      return;
    }

    await loadList();
  }

  $("#logoutBtn").addEventListener(
    "click",
    async function () {
      await Admin.signOut();
      location.href = "admin.html";
    }
  );

  $("#newItemBtn").addEventListener(
    "click",
    function () {
      if (section === "about") {
        const existing = cachedItems[0] || {};
        openEditor(existing.id || "main");
        return;
      }

      openEditor();
    }
  );

  $("#editorClose").addEventListener(
    "click",
    function () {
      editorModal.close();
    }
  );

  $("#cancelEditor").addEventListener(
    "click",
    function () {
      editorModal.close();
    }
  );

  async function loadList() {
    $("#adminList").innerHTML =
      '<div class="cms-loading">Loading...</div>';

    try {
      let params = {
        select: "*"
      };

      if (section === "news") {
        params.order =
          "published_at.desc,created_at.desc";
      } else if (section === "music") {
        params.order =
          "release_date.desc.nullslast,created_at.desc";
      } else if (section === "members") {
        params.order =
          "sort_order.asc,name.asc";
      } else if (section === "rules") {
        params.order =
          "sort_order.asc,created_at.asc";
      } else {
        params.id = "eq.main";
        params.limit = 1;
      }

      cachedItems =
        await Admin.select(
          tableName(),
          params
        );

      renderList();
    } catch (error) {
      $("#adminList").innerHTML =
        '<div class="cms-admin-warning">' +
        esc(error.message || String(error)) +
        "</div>";
    }
  }

  function renderList() {
    const host = $("#adminList");

    if (section === "about") {
      const item = cachedItems[0];

      if (!item) {
        host.innerHTML =
          '<div class="cms-empty">About chưa có dữ liệu.</div>';
        return;
      }

      host.innerHTML =
        '<article class="admin-row" data-id="main">' +
        '<div class="admin-row-noimg">Aa</div>' +
        "<div>" +
        "<h3>" +
        esc(item.page_title_vi || "RƎ:ALYZE") +
        "</h3>" +
        "<p>About</p>" +
        "</div>" +
        '<span class="admin-status">Edit</span>' +
        "</article>";

      host
        .querySelector(".admin-row")
        .addEventListener(
          "click",
          function () {
            openEditor("main");
          }
        );

      return;
    }

    if (!cachedItems.length) {
      host.innerHTML =
        '<div class="cms-empty">Chưa có nội dung.</div>';
      return;
    }

    host.innerHTML =
      cachedItems
        .map(function (item) {
          const title =
            section === "music"
              ? item.title
              : section === "members"
              ? item.name
              : item.title_vi || "Untitled";

          const meta =
            section === "news"
              ? item.published_at || ""
              : section === "music"
              ? (
                  (item.singers || "—") +
                  (item.release_date
                    ? " · " + item.release_date
                    : "")
                )
              : section === "members"
              ? (
                  (item.japanese || "—") +
                  (item.romaji
                    ? " · " + item.romaji
                    : "")
                )
              : "Thứ tự: " +
                (item.sort_order == null
                  ? 0
                  : item.sort_order);

          const image =
            section !== "rules" &&
            item.image_url
              ? '<img class="admin-row-thumb" src="' +
                esc(item.image_url) +
                '" alt="">'
              : '<div class="admin-row-noimg">' +
                (section === "rules"
                  ? "Aa"
                  : "IMG") +
                "</div>";

          return (
            '<article class="admin-row" data-id="' +
            item.id +
            '">' +
            image +
            "<div>" +
            "<h3>" +
            esc(title) +
            "</h3>" +
            "<p>" +
            esc(meta) +
            "</p>" +
            "</div>" +
            '<span class="admin-status ' +
            (
              (section === "members"
                ? item.is_active
                : item.is_published)
                ? ""
                : "off"
            ) +
            '">' +
            (
              section === "members"
                ? (
                    item.is_active
                      ? "Visible"
                      : "Hidden"
                  )
                : (
                    item.is_published
                      ? "Published"
                      : "Draft"
                  )
            ) +
            "</span>" +
            "</article>"
          );
        })
        .join("");

    host
      .querySelectorAll(".admin-row")
      .forEach(function (row) {
        row.addEventListener(
          "click",
          function () {
            openEditor(row.dataset.id);
          }
        );
      });
  }

  function inputField(
    label,
    name,
    value,
    type
  ) {
    return (
      '<div class="admin-field">' +
      "<label>" +
      label +
      '<input class="admin-input" name="' +
      name +
      '" type="' +
      (type || "text") +
      '" value="' +
      esc(value || "") +
      '">' +
      "</label>" +
      "</div>"
    );
  }

  function textareaField(
    label,
    name,
    value
  ) {
    return (
      '<div class="admin-field full">' +
      "<label>" +
      label +
      '<textarea class="admin-textarea" name="' +
      name +
      '">' +
      esc(value || "") +
      "</textarea>" +
      "</label>" +
      "</div>"
    );
  }

  function richField(
    label,
    name,
    value
  ) {
    return (
      '<div class="admin-field full">' +
      "<label>" +
      label +
      "</label>" +
      '<div class="rich-toolbar" data-for="' +
      name +
      '">' +
      '<button type="button" data-cmd="formatBlock" data-value="h1">H1</button>' +
      '<button type="button" data-cmd="formatBlock" data-value="h2">H2</button>' +
      '<button type="button" data-cmd="formatBlock" data-value="h3">H3</button>' +
      '<button type="button" data-cmd="formatBlock" data-value="p">P</button>' +
      '<button type="button" data-cmd="bold"><b>B</b></button>' +
      '<button type="button" data-cmd="italic"><i>I</i></button>' +
      '<button type="button" data-cmd="insertUnorderedList">• List</button>' +
      '<button type="button" data-cmd="insertOrderedList">1. List</button>' +
      '<button type="button" data-cmd="formatBlock" data-value="blockquote">❝</button>' +
      "</div>" +
      '<div class="rich-editor" contenteditable="true" data-rich-name="' +
      name +
      '">' +
      (value || "") +
      "</div>" +
      "</div>"
    );
  }

  function imageField(current) {
    return (
      '<div class="admin-field full">' +
      "<label>Ảnh" +
      '<input class="admin-input" id="imageFile" type="file" accept="image/*">' +
      "</label>" +
      '<input type="hidden" name="image_url" value="' +
      esc(current || "") +
      '">' +
      (current
        ? '<img class="admin-image-preview" id="imagePreview" src="' +
          esc(current) +
          '" alt="">'
        : '<img class="admin-image-preview" id="imagePreview" hidden alt="">') +
      "</div>"
    );
  }

  function publishField(value) {
    return (
      '<div class="admin-field full">' +
      '<label class="admin-check">' +
      '<input name="is_published" type="checkbox" ' +
      (value !== false ? "checked" : "") +
      ">" +
      " Hiển thị công khai" +
      "</label>" +
      "</div>"
    );
  }


  function activeField(value) {
    return (
      '<div class="admin-field full">' +
      '<label class="admin-check">' +
      '<input name="is_active" type="checkbox" ' +
      (value !== false ? "checked" : "") +
      ">" +
      " Hiển thị thành viên ngoài website" +
      "</label>" +
      "</div>"
    );
  }



  function translateBar() {
    if (section === "music") {
      return (
        '<div class="admin-translate-bar full">' +
        '<button class="admin-translate-btn" id="autoTranslateBtn" type="button">' +
        'Dịch tự động mô tả VI → EN + JP' +
        '</button>' +
        '<span class="admin-translate-status" id="autoTranslateStatus"></span>' +
        '</div>'
      );
    }

    if (section === "members") {
      return (
        '<div class="admin-translate-bar full">' +
        '<button class="admin-translate-btn" id="autoTranslateBtn" type="button">' +
        'Dịch Quote + Hobby VI → EN + JP' +
        '</button>' +
        '<span class="admin-translate-status" id="autoTranslateStatus"></span>' +
        '</div>'
      );
    }

    return (
      '<div class="admin-translate-bar full">' +
      '<button class="admin-translate-btn" id="autoTranslateBtn" type="button">' +
      'Dịch tự động VI → EN + JP' +
      '</button>' +
      '<span class="admin-translate-status" id="autoTranslateStatus"></span>' +
      '</div>'
    );
  }

  function getPlainField(name) {
    const element =
      editorForm.querySelector(
        '[name="' + name + '"]'
      );

    return element
      ? String(element.value || "")
      : "";
  }

  function setPlainField(name, value) {
    const element =
      editorForm.querySelector(
        '[name="' + name + '"]'
      );

    if (element) {
      element.value =
        value == null ? "" : String(value);
    }
  }

  function getRichField(name) {
    const element =
      editorForm.querySelector(
        '[data-rich-name="' + name + '"]'
      );

    return element
      ? element.innerHTML.trim()
      : "";
  }

  function setRichField(name, value) {
    const element =
      editorForm.querySelector(
        '[data-rich-name="' + name + '"]'
      );

    if (element) {
      element.innerHTML =
        value == null ? "" : String(value);
    }
  }

  function translationMap() {
    if (section === "news") {
      return [
        {
          source: "title_vi",
          en: "title_en",
          ja: "title_ja",
          rich: false
        },
        {
          source: "body_vi",
          en: "body_en",
          ja: "body_ja",
          rich: true
        }
      ];
    }

    if (section === "music") {
      return [
        {
          source: "description_vi",
          en: "description_en",
          ja: "description_ja",
          rich: false
        }
      ];
    }

    if (section === "members") {
      return [
        {
          source: "quote_vi",
          en: "quote_en",
          ja: "quote_ja",
          rich: false
        },
        {
          source: "hobby_vi",
          en: "hobby_en",
          ja: "hobby_ja",
          rich: false
        }
      ];
    }

    if (section === "rules") {
      return [
        {
          source: "title_vi",
          en: "title_en",
          ja: "title_ja",
          rich: false
        },
        {
          source: "body_vi",
          en: "body_en",
          ja: "body_ja",
          rich: true
        }
      ];
    }

    return [
      {
        source: "page_title_vi",
        en: "page_title_en",
        ja: "page_title_ja",
        rich: false
      },
      {
        source: "page_desc_vi",
        en: "page_desc_en",
        ja: "page_desc_ja",
        rich: false
      },
      {
        source: "section1_title_vi",
        en: "section1_title_en",
        ja: "section1_title_ja",
        rich: false
      },
      {
        source: "section1_body_vi",
        en: "section1_body_en",
        ja: "section1_body_ja",
        rich: true
      },
      {
        source: "section2_title_vi",
        en: "section2_title_en",
        ja: "section2_title_ja",
        rich: false
      },
      {
        source: "section2_body_vi",
        en: "section2_body_en",
        ja: "section2_body_ja",
        rich: true
      }
    ];
  }

  function readTranslationSource(entry) {
    return entry.rich
      ? getRichField(entry.source)
      : getPlainField(entry.source);
  }

  function writeTranslation(entry, target, value) {
    const fieldName =
      target === "EN"
        ? entry.en
        : entry.ja;

    if (entry.rich) {
      setRichField(fieldName, value);
    } else {
      setPlainField(fieldName, value);
    }
  }

  async function runAutoTranslate() {
    const button =
      $("#autoTranslateBtn");
    const status =
      $("#autoTranslateStatus");

    if (!button) return;

    const map = translationMap();

    const active = map.filter(function (entry) {
      return readTranslationSource(entry).trim() !== "";
    });

    if (!active.length) {
      if (status) {
        status.textContent =
          "Chưa có nội dung tiếng Việt để dịch.";
      }
      return;
    }

    const sourceTexts =
      active.map(readTranslationSource);

    button.disabled = true;
    button.textContent =
      "Đang dịch...";

    if (status) {
      status.textContent =
        "Đang tạo bản EN và JP...";
    }

    try {
      const results =
        await Promise.all([
          Admin.translateTexts(
            sourceTexts,
            "EN"
          ),
          Admin.translateTexts(
            sourceTexts,
            "JA"
          )
        ]);

      const en = results[0];
      const ja = results[1];

      active.forEach(function (entry, index) {
        writeTranslation(
          entry,
          "EN",
          en[index] || ""
        );

        writeTranslation(
          entry,
          "JA",
          ja[index] || ""
        );
      });

      if (status) {
        status.textContent =
          "✓ Đã điền tiếng Anh và tiếng Nhật.";
      }

    } catch (error) {
      console.error(error);

      if (status) {
        status.textContent =
          "✕ " +
          (error.message ||
            "Không dịch được.");
      }

      alert(
        "Không thể dịch tự động: " +
        (error.message ||
          String(error))
      );

    } finally {
      button.disabled = false;
      button.textContent =
        section === "music"
          ? "Dịch tự động mô tả VI → EN + JP"
          : section === "members"
          ? "Dịch Quote + Hobby VI → EN + JP"
          : "Dịch tự động VI → EN + JP";
    }
  }

  function bindAutoTranslate() {
    const button =
      $("#autoTranslateBtn");

    if (button) {
      button.addEventListener(
        "click",
        runAutoTranslate
      );
    }
  }

  function buildEditor(item) {
    item = item || {};

    let html =
      '<h2 class="admin-editor-title">' +
      (editingId
        ? "Chỉnh sửa"
        : "Thêm mới") +
      "</h2>" +
      '<div class="admin-fields-grid">' +
      translateBar();

    if (section === "news") {
      html +=
        inputField(
          "Tiêu đề (VI)",
          "title_vi",
          item.title_vi
        ) +
        inputField(
          "Ngày đăng",
          "published_at",
          item.published_at ||
            new Date()
              .toISOString()
              .slice(0, 10),
          "date"
        ) +
        inputField(
          "Title (EN)",
          "title_en",
          item.title_en
        ) +
        inputField(
          "タイトル (JP)",
          "title_ja",
          item.title_ja
        ) +
        imageField(item.image_url) +
        richField(
          "Nội dung (VI)",
          "body_vi",
          item.body_vi
        ) +
        richField(
          "Content (EN)",
          "body_en",
          item.body_en
        ) +
        richField(
          "内容 (JP)",
          "body_ja",
          item.body_ja
        ) +
        publishField(item.is_published);
    }

    if (section === "music") {
      html +=
        inputField(
          "Tên bài hát",
          "title",
          item.title
        ) +
        inputField(
          "Người hát",
          "singers",
          item.singers
        ) +
        inputField(
          "Ngày ra mắt",
          "release_date",
          item.release_date,
          "date"
        ) +
        inputField(
          "Link bài hát / YouTube",
          "external_url",
          item.external_url,
          "url"
        ) +
        imageField(item.image_url) +
        textareaField(
          "Mô tả (VI)",
          "description_vi",
          item.description_vi
        ) +
        textareaField(
          "Description (EN)",
          "description_en",
          item.description_en
        ) +
        textareaField(
          "説明 (JP)",
          "description_ja",
          item.description_ja
        ) +
        publishField(item.is_published);
    }

    if (section === "members") {
      html +=
        inputField(
          "Tên",
          "name",
          item.name
        ) +
        inputField(
          "Tên tiếng Nhật",
          "japanese",
          item.japanese
        ) +
        inputField(
          "Romaji",
          "romaji",
          item.romaji
        ) +
        inputField(
          "Ngày sinh",
          "birthday",
          item.birthday
        ) +
        inputField(
          "Màu chủ đạo (#HEX)",
          "color",
          item.color || "#cccccc"
        ) +
        inputField(
          "Thứ tự hiển thị",
          "sort_order",
          item.sort_order == null
            ? 0
            : item.sort_order,
          "number"
        ) +
        imageField(
          item.image_url
        ) +
        textareaField(
          "Quote / Giới thiệu (VI)",
          "quote_vi",
          item.quote_vi
        ) +
        textareaField(
          "Quote / Introduction (EN)",
          "quote_en",
          item.quote_en
        ) +
        textareaField(
          "Quote / 自己紹介 (JP)",
          "quote_ja",
          item.quote_ja
        ) +
        textareaField(
          "Sở thích (VI)",
          "hobby_vi",
          item.hobby_vi
        ) +
        textareaField(
          "Hobby (EN)",
          "hobby_en",
          item.hobby_en
        ) +
        textareaField(
          "趣味 (JP)",
          "hobby_ja",
          item.hobby_ja
        ) +
        inputField(
          "X",
          "x_url",
          item.x_url,
          "url"
        ) +
        inputField(
          "YouTube",
          "youtube_url",
          item.youtube_url,
          "url"
        ) +
        inputField(
          "TikTok",
          "tiktok_url",
          item.tiktok_url,
          "url"
        ) +
        activeField(
          item.is_active
        );
    }

    if (section === "rules") {
      html +=
        inputField(
          "Tiêu đề Rule (VI)",
          "title_vi",
          item.title_vi
        ) +
        inputField(
          "Thứ tự",
          "sort_order",
          item.sort_order == null
            ? 0
            : item.sort_order,
          "number"
        ) +
        inputField(
          "Rule title (EN)",
          "title_en",
          item.title_en
        ) +
        inputField(
          "ルールタイトル (JP)",
          "title_ja",
          item.title_ja
        ) +
        richField(
          "Nội dung Rule (VI)",
          "body_vi",
          item.body_vi
        ) +
        richField(
          "Rule content (EN)",
          "body_en",
          item.body_en
        ) +
        richField(
          "ルール内容 (JP)",
          "body_ja",
          item.body_ja
        ) +
        publishField(item.is_published);
    }

    if (section === "about") {
      html +=
        inputField(
          "Tiêu đề trang (VI)",
          "page_title_vi",
          item.page_title_vi
        ) +
        inputField(
          "Page title (EN)",
          "page_title_en",
          item.page_title_en
        ) +
        inputField(
          "ページタイトル (JP)",
          "page_title_ja",
          item.page_title_ja
        ) +
        textareaField(
          "Mô tả đầu trang (VI)",
          "page_desc_vi",
          item.page_desc_vi
        ) +
        textareaField(
          "Page description (EN)",
          "page_desc_en",
          item.page_desc_en
        ) +
        textareaField(
          "ページ説明 (JP)",
          "page_desc_ja",
          item.page_desc_ja
        ) +
        inputField(
          "Mục 1 - Tiêu đề (VI)",
          "section1_title_vi",
          item.section1_title_vi
        ) +
        inputField(
          "Section 1 title (EN)",
          "section1_title_en",
          item.section1_title_en
        ) +
        inputField(
          "セクション1 (JP)",
          "section1_title_ja",
          item.section1_title_ja
        ) +
        richField(
          "Mục 1 - Nội dung (VI)",
          "section1_body_vi",
          item.section1_body_vi
        ) +
        richField(
          "Section 1 content (EN)",
          "section1_body_en",
          item.section1_body_en
        ) +
        richField(
          "セクション1内容 (JP)",
          "section1_body_ja",
          item.section1_body_ja
        ) +
        inputField(
          "Mục 2 - Tiêu đề (VI)",
          "section2_title_vi",
          item.section2_title_vi
        ) +
        inputField(
          "Section 2 title (EN)",
          "section2_title_en",
          item.section2_title_en
        ) +
        inputField(
          "セクション2 (JP)",
          "section2_title_ja",
          item.section2_title_ja
        ) +
        richField(
          "Mục 2 - Nội dung (VI)",
          "section2_body_vi",
          item.section2_body_vi
        ) +
        richField(
          "Section 2 content (EN)",
          "section2_body_en",
          item.section2_body_en
        ) +
        richField(
          "セクション2内容 (JP)",
          "section2_body_ja",
          item.section2_body_ja
        );
    }

    html += "</div>";

    editorFields.innerHTML = html;

    bindRichToolbar();
    bindImagePreview();
    bindAutoTranslate();
  }

  function bindRichToolbar() {
    document
      .querySelectorAll(
        ".rich-toolbar button"
      )
      .forEach(function (button) {
        button.addEventListener(
          "click",
          function () {
            const toolbar =
              button.closest(
                ".rich-toolbar"
              );

            const editor =
              document.querySelector(
                '[data-rich-name="' +
                toolbar.dataset.for +
                '"]'
              );

            editor.focus();

            if (
              button.dataset.cmd ===
              "formatBlock"
            ) {
              document.execCommand(
                "formatBlock",
                false,
                button.dataset.value
              );
            } else {
              document.execCommand(
                button.dataset.cmd,
                false,
                null
              );
            }
          }
        );
      });
  }

  function bindImagePreview() {
    const input =
      $("#imageFile");

    if (!input) return;

    input.addEventListener(
      "change",
      function () {
        const file =
          input.files &&
          input.files[0];

        if (!file) return;

        const preview =
          $("#imagePreview");

        preview.src =
          URL.createObjectURL(file);

        preview.hidden = false;
      }
    );
  }

  function openEditor(id) {
    editingId = id || null;

    let item = {};

    if (id) {
      item =
        cachedItems.find(function (row) {
          return (
            String(row.id) ===
            String(id)
          );
        }) || {};
    }

    buildEditor(item);

    deleteBtn.hidden =
      !id ||
      section === "about" ||
      section === "members";

    editorModal.showModal();
  }

  function collectRich(name) {
    const element =
      document.querySelector(
        '[data-rich-name="' +
        name +
        '"]'
      );

    return element
      ? element.innerHTML.trim()
      : "";
  }

  async function uploadImageIfNeeded(
    formData
  ) {
    const input =
      $("#imageFile");

    const file =
      input &&
      input.files &&
      input.files[0];

    if (!file) {
      return (
        formData.get("image_url") ||
        ""
      );
    }

    const extension =
      (
        file.name
          .split(".")
          .pop() ||
        "jpg"
      ).toLowerCase();

    const path =
      section +
      "/" +
      crypto.randomUUID() +
      "." +
      extension;

    return await Admin.upload(
      "cms-media",
      path,
      file
    );
  }

  editorForm.addEventListener(
    "submit",
    async function (event) {
      event.preventDefault();

      const formData =
        new FormData(editorForm);

      const submitButton =
        editorForm.querySelector(
          'button[type="submit"]'
        );

      submitButton.disabled = true;
      submitButton.textContent =
        "Đang lưu...";

      try {
        let payload = {};

        if (section === "news") {
          payload = {
            title_vi:
              String(
                formData.get("title_vi") ||
                ""
              ).trim(),
            title_en:
              String(
                formData.get("title_en") ||
                ""
              ).trim() || null,
            title_ja:
              String(
                formData.get("title_ja") ||
                ""
              ).trim() || null,
            body_vi:
              collectRich("body_vi"),
            body_en:
              collectRich("body_en") ||
              null,
            body_ja:
              collectRich("body_ja") ||
              null,
            image_url:
              await uploadImageIfNeeded(
                formData
              ),
            published_at:
              formData.get(
                "published_at"
              ) || null,
            is_published:
              formData.get(
                "is_published"
              ) === "on"
          };
        }

        if (section === "music") {
          payload = {
            title:
              String(
                formData.get("title") ||
                ""
              ).trim(),
            singers:
              String(
                formData.get("singers") ||
                ""
              ).trim(),
            release_date:
              formData.get(
                "release_date"
              ) || null,
            external_url:
              String(
                formData.get(
                  "external_url"
                ) || ""
              ).trim() || null,
            image_url:
              await uploadImageIfNeeded(
                formData
              ),
            description_vi:
              String(
                formData.get(
                  "description_vi"
                ) || ""
              ).trim() || null,
            description_en:
              String(
                formData.get(
                  "description_en"
                ) || ""
              ).trim() || null,
            description_ja:
              String(
                formData.get(
                  "description_ja"
                ) || ""
              ).trim() || null,
            is_published:
              formData.get(
                "is_published"
              ) === "on"
          };
        }


        if (section === "members") {
          payload = {
            name:
              String(
                formData.get("name") ||
                ""
              ).trim(),
            japanese:
              String(
                formData.get("japanese") ||
                ""
              ).trim() || null,
            romaji:
              String(
                formData.get("romaji") ||
                ""
              ).trim() || null,
            birthday:
              String(
                formData.get("birthday") ||
                ""
              ).trim() || null,
            quote_vi:
              String(
                formData.get("quote_vi") ||
                ""
              ).trim() || null,
            quote_en:
              String(
                formData.get("quote_en") ||
                ""
              ).trim() || null,
            quote_ja:
              String(
                formData.get("quote_ja") ||
                ""
              ).trim() || null,
            hobby_vi:
              String(
                formData.get("hobby_vi") ||
                ""
              ).trim() || null,
            hobby_en:
              String(
                formData.get("hobby_en") ||
                ""
              ).trim() || null,
            hobby_ja:
              String(
                formData.get("hobby_ja") ||
                ""
              ).trim() || null,
            color:
              String(
                formData.get("color") ||
                "#cccccc"
              ).trim(),
            image_url:
              await uploadImageIfNeeded(
                formData
              ),
            x_url:
              String(
                formData.get("x_url") ||
                ""
              ).trim() || null,
            youtube_url:
              String(
                formData.get("youtube_url") ||
                ""
              ).trim() || null,
            tiktok_url:
              String(
                formData.get("tiktok_url") ||
                ""
              ).trim() || null,
            sort_order:
              Number(
                formData.get(
                  "sort_order"
                ) || 0
              ),
            is_active:
              formData.get(
                "is_active"
              ) === "on"
          };
        }

        if (section === "rules") {
          payload = {
            title_vi:
              String(
                formData.get("title_vi") ||
                ""
              ).trim(),
            title_en:
              String(
                formData.get("title_en") ||
                ""
              ).trim() || null,
            title_ja:
              String(
                formData.get("title_ja") ||
                ""
              ).trim() || null,
            body_vi:
              collectRich("body_vi"),
            body_en:
              collectRich("body_en") ||
              null,
            body_ja:
              collectRich("body_ja") ||
              null,
            sort_order:
              Number(
                formData.get(
                  "sort_order"
                ) || 0
              ),
            is_published:
              formData.get(
                "is_published"
              ) === "on"
          };
        }

        if (section === "about") {
          payload = {
            id: "main",
            page_title_vi:
              String(
                formData.get(
                  "page_title_vi"
                ) || ""
              ).trim(),
            page_title_en:
              String(
                formData.get(
                  "page_title_en"
                ) || ""
              ).trim() || null,
            page_title_ja:
              String(
                formData.get(
                  "page_title_ja"
                ) || ""
              ).trim() || null,
            page_desc_vi:
              String(
                formData.get(
                  "page_desc_vi"
                ) || ""
              ).trim(),
            page_desc_en:
              String(
                formData.get(
                  "page_desc_en"
                ) || ""
              ).trim() || null,
            page_desc_ja:
              String(
                formData.get(
                  "page_desc_ja"
                ) || ""
              ).trim() || null,
            section1_title_vi:
              String(
                formData.get(
                  "section1_title_vi"
                ) || ""
              ).trim(),
            section1_title_en:
              String(
                formData.get(
                  "section1_title_en"
                ) || ""
              ).trim() || null,
            section1_title_ja:
              String(
                formData.get(
                  "section1_title_ja"
                ) || ""
              ).trim() || null,
            section1_body_vi:
              collectRich(
                "section1_body_vi"
              ),
            section1_body_en:
              collectRich(
                "section1_body_en"
              ) || null,
            section1_body_ja:
              collectRich(
                "section1_body_ja"
              ) || null,
            section2_title_vi:
              String(
                formData.get(
                  "section2_title_vi"
                ) || ""
              ).trim(),
            section2_title_en:
              String(
                formData.get(
                  "section2_title_en"
                ) || ""
              ).trim() || null,
            section2_title_ja:
              String(
                formData.get(
                  "section2_title_ja"
                ) || ""
              ).trim() || null,
            section2_body_vi:
              collectRich(
                "section2_body_vi"
              ),
            section2_body_en:
              collectRich(
                "section2_body_en"
              ) || null,
            section2_body_ja:
              collectRich(
                "section2_body_ja"
              ) || null
          };
        }

        if (
          editingId &&
          !(
            section === "about" &&
            cachedItems.length === 0
          )
        ) {
          await Admin.update(
            tableName(),
            editingId,
            payload
          );
        } else {
          await Admin.insert(
            tableName(),
            payload
          );
        }

        editorModal.close();
        await loadList();

        if (
          window.opener &&
          window.opener
            .RealyzeSiteData
        ) {
          window.opener
            .RealyzeSiteData
            .refresh();
        }
      } catch (error) {
        alert(
          error.message ||
          String(error)
        );
      } finally {
        submitButton.disabled = false;
        submitButton.textContent =
          "Lưu";
      }
    }
  );

  deleteBtn.addEventListener(
    "click",
    async function () {
      if (
        !editingId ||
        section === "about"
      ) {
        return;
      }

      if (
        !confirm(
          "Xóa nội dung này?"
        )
      ) {
        return;
      }

      try {
        await Admin.remove(
          tableName(),
          editingId
        );

        editorModal.close();
        await loadList();
      } catch (error) {
        alert(
          error.message ||
          String(error)
        );
      }
    }
  );

  initialize();
})();
