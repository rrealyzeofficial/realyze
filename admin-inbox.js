(function () {
  "use strict";

  const Admin =
    window.RealyzeAdmin;

  if (!Admin) {
    console.error(
      "Missing admin-runtime.js"
    );
    return;
  }

  const list =
    document.getElementById(
      "inboxList"
    );

  const unreadCount =
    document.getElementById(
      "inboxUnreadCount"
    );

  const refreshButton =
    document.getElementById(
      "refreshInboxBtn"
    );

  const warning =
    document.getElementById(
      "permissionWarning"
    );

  const dialog =
    document.getElementById(
      "letterDialog"
    );

  const dialogName =
    document.getElementById(
      "letterDialogName"
    );

  const dialogDate =
    document.getElementById(
      "letterDialogDate"
    );

  const dialogRead =
    document.getElementById(
      "letterDialogRead"
    );

  const dialogContent =
    document.getElementById(
      "letterDialogContent"
    );

  const deleteButton =
    document.getElementById(
      "deleteLetterBtn"
    );

  let letters = [];
  let activeId = null;
  let refreshTimer = null;

  function esc(value) {
    return String(
      value == null ? "" : value
    ).replace(
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

  function formatDate(value) {
    if (!value) return "";

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return new Intl.DateTimeFormat(
      "vi-VN",
      {
        dateStyle: "medium",
        timeStyle: "short"
      }
    ).format(date);
  }

  function preview(value) {
    const cleaned =
      String(value || "")
        .replace(/\s+/g, " ")
        .trim();

    return cleaned.length > 115
      ? cleaned.slice(0, 115) + "…"
      : cleaned;
  }

  function updateUnreadCount() {
    const count =
      letters.filter(
        function (item) {
          return !item.is_read;
        }
      ).length;

    unreadCount.textContent =
      count + " chưa đọc";

    unreadCount.classList.toggle(
      "has-unread",
      count > 0
    );
  }

  function render() {
    updateUnreadCount();

    if (!letters.length) {
      list.innerHTML =
        '<div class="inbox-empty">' +
        '<span>✦</span>' +
        '<strong>Hộp thư đang trống</strong>' +
        "</div>";
      return;
    }

    list.innerHTML =
      letters.map(function (item) {
        return (
          '<button class="inbox-row' +
          (!item.is_read
            ? " unread"
            : "") +
          '" type="button" data-id="' +
          esc(item.id) +
          '">' +

          '<span class="inbox-read-dot"></span>' +

          '<span class="inbox-row-main">' +
          "<strong>" +
          esc(item.sender_name) +
          "</strong>" +
          "<small>" +
          esc(
            preview(
              item.content
            )
          ) +
          "</small>" +
          "</span>" +

          '<time>' +
          esc(
            formatDate(
              item.created_at
            )
          ) +
          "</time>" +

          "<b>→</b>" +
          "</button>"
        );
      }).join("");
  }

  async function loadInbox(
    silent = false
  ) {
    if (!silent) {
      list.innerHTML =
        '<div class="cms-loading">Loading...</div>';
    }

    try {
      letters =
        await Admin.select(
          "site_letters",
          {
            select: "*",
            order:
              "created_at.desc",
            limit: 200
          }
        );

      render();

    } catch (error) {
      console.error(error);

      if (!silent) {
        list.innerHTML =
          '<div class="cms-admin-warning">' +
          esc(
            error.message ||
            String(error)
          ) +
          "</div>";
      }
    }
  }

  function findLetter(id) {
    return letters.find(
      function (item) {
        return (
          String(item.id) ===
          String(id)
        );
      }
    );
  }

  async function openLetter(id) {
    const item =
      findLetter(id);

    if (!item) return;

    activeId = id;

    dialogName.textContent =
      item.sender_name || "—";

    dialogDate.textContent =
      formatDate(
        item.created_at
      );

    dialogRead.textContent =
      item.is_read
        ? "Đã đọc"
        : "Chưa đọc";

    dialogContent.textContent =
      item.content || "";

    if (!dialog.open) {
      dialog.showModal();
    }

    if (!item.is_read) {
      try {
        await Admin.update(
          "site_letters",
          id,
          {
            is_read: true
          }
        );

        item.is_read = true;

        dialogRead.textContent =
          "Đã đọc";

        render();

      } catch (error) {
        console.error(
          "Mark read:",
          error
        );
      }
    }
  }

  list.addEventListener(
    "click",
    function (event) {
      const row =
        event.target.closest(
          ".inbox-row"
        );

      if (!row) return;

      openLetter(
        row.dataset.id
      );
    }
  );

  refreshButton.addEventListener(
    "click",
    function () {
      loadInbox();
    }
  );

  document
    .getElementById(
      "letterClose"
    )
    .addEventListener(
      "click",
      function () {
        dialog.close();
      }
    );

  document
    .getElementById(
      "closeLetterBtn"
    )
    .addEventListener(
      "click",
      function () {
        dialog.close();
      }
    );

  deleteButton.addEventListener(
    "click",
    async function () {
      if (!activeId) return;

      if (
        !confirm(
          "Xóa thư này?"
        )
      ) {
        return;
      }

      deleteButton.disabled = true;

      try {
        await Admin.remove(
          "site_letters",
          activeId
        );

        letters =
          letters.filter(
            function (item) {
              return (
                String(item.id) !==
                String(activeId)
              );
            }
          );

        activeId = null;

        dialog.close();
        render();

      } catch (error) {
        alert(
          error.message ||
          String(error)
        );

      } finally {
        deleteButton.disabled =
          false;
      }
    }
  );

  document
    .getElementById(
      "logoutBtn"
    )
    .addEventListener(
      "click",
      async function () {
        await Admin.signOut();
        location.href =
          "admin.html";
      }
    );

  async function init() {
    const session =
      await Admin.requireAdmin();

    if (!session) return;

    const permission =
      await Admin
        .checkAdminPermission();

    if (!permission.ok) {
      warning.hidden = false;

      warning.textContent =
        "Database từ chối quyền Admin: " +
        permission.error;

      return;
    }

    await loadInbox();

    refreshTimer =
      setInterval(
        function () {
          if (
            document.visibilityState ===
            "visible" &&
            !dialog.open
          ) {
            loadInbox(true);
          }
        },
        30000
      );
  }

  window.addEventListener(
    "beforeunload",
    function () {
      if (refreshTimer) {
        clearInterval(
          refreshTimer
        );
      }
    }
  );

  init();
})();
