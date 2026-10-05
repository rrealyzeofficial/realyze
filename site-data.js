(function () {
  "use strict";

  let configCache = null;

  function currentLang() {
    return localStorage.getItem("realyze-language") || "vi";
  }

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

  function langField(item, base) {
    const lang = currentLang();
    return (
      item[base + "_" + lang] ||
      item[base + "_vi"] ||
      item[base] ||
      ""
    );
  }

  function formatDate(value) {
    if (!value) return "";

    const lang = currentLang();
    const locale =
      lang === "ja"
        ? "ja-JP"
        : lang === "en"
        ? "en-US"
        : "vi-VN";

    const date = new Date(value + "T00:00:00");

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(date);
  }

  function sanitizeRichHTML(html) {
    const template = document.createElement("template");
    template.innerHTML = html || "";

    const allowed = new Set([
      "H1", "H2", "H3", "P", "BR",
      "STRONG", "B", "EM", "I",
      "UL", "OL", "LI",
      "BLOCKQUOTE", "HR", "A"
    ]);

    template.content
      .querySelectorAll("*")
      .forEach(function (element) {
        if (!allowed.has(element.tagName)) {
          element.replaceWith.apply(
            element,
            Array.from(element.childNodes)
          );
          return;
        }

        Array.from(element.attributes).forEach(function (attr) {
          if (
            element.tagName === "A" &&
            ["href", "target", "rel"].includes(attr.name)
          ) {
            return;
          }

          element.removeAttribute(attr.name);
        });

        if (element.tagName === "A") {
          element.setAttribute("target", "_blank");
          element.setAttribute("rel", "noopener noreferrer");
        }
      });

    return template.innerHTML;
  }

  async function loadConfig() {
    if (configCache) return configCache;

    const savedUrl =
      localStorage.getItem("realyze_supabase_url") || "";
    const savedKey =
      localStorage.getItem("realyze_supabase_anon_key") || "";

    if (
      /^https:\/\/.+\.supabase\.co$/i.test(savedUrl) &&
      savedKey.length > 20
    ) {
      configCache = {
        url: savedUrl.replace(/\/+$/, ""),
        key: savedKey
      };
      return configCache;
    }

    if (location.protocol === "file:") {
      return null;
    }

    try {
      const response = await fetch(
        "./supabase-config.js?site=" + Date.now(),
        {
          cache: "no-store"
        }
      );

      if (!response.ok) return null;

      const text = await response.text();

      const urlMatch = text.match(
        /SUPABASE_URL\s*=\s*["'`]([^"'`]+)["'`]/
      );
      const keyMatch = text.match(
        /SUPABASE_ANON_KEY\s*=\s*["'`]([^"'`]+)["'`]/
      );

      if (!urlMatch || !keyMatch) return null;

      if (
        urlMatch[1].includes("YOUR_") ||
        keyMatch[1].includes("YOUR_")
      ) {
        return null;
      }

      configCache = {
        url: urlMatch[1].replace(/\/+$/, ""),
        key: keyMatch[1]
      };

      return configCache;
    } catch (error) {
      console.error("Cannot read Supabase config:", error);
      return null;
    }
  }

  function queryString(params) {
    const search = new URLSearchParams();

    Object.keys(params || {}).forEach(function (key) {
      const value = params[key];

      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        search.set(key, String(value));
      }
    });

    const query = search.toString();
    return query ? "?" + query : "";
  }

  async function select(table, params) {
    const config = await loadConfig();

    if (!config) {
      throw new Error("Supabase config unavailable.");
    }

    const response = await fetch(
      config.url +
        "/rest/v1/" +
        table +
        queryString(params || {}),
      {
        cache: "no-store",
        headers: {
          apikey: config.key,
          Authorization: "Bearer " + config.key,
          "Cache-Control": "no-cache"
        }
      }
    );

    const text = await response.text();

    let data = [];
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = [];
      }
    }

    if (!response.ok) {
      console.error(
        "Supabase public query failed:",
        response.status,
        data
      );
      throw new Error("Public query failed.");
    }

    return data;
  }

  function emptyText(type) {
    const lang = currentLang();

    const table = {
      news: {
        vi: "Chưa có tin mới.",
        en: "No news yet.",
        ja: "ニュースはまだありません。"
      },
      music: {
        vi: "Chưa có bài hát.",
        en: "No music yet.",
        ja: "楽曲はまだありません。"
      },
      rule: {
        vi: "Chưa có nội dung.",
        en: "No content yet.",
        ja: "コンテンツはまだありません。"
      }
    };

    return table[type][lang] || table[type].vi;
  }

  async function renderNewsList() {
    const host = document.getElementById("dynamicNewsList");
    if (!host) return;

    try {
      const rows = await select("site_news", {
        select: "*",
        is_published: "eq.true",
        order: "published_at.desc,created_at.desc",
        limit: 8
      });

      if (!rows.length) {
        host.innerHTML =
          '<div class="cms-empty">' +
          esc(emptyText("news")) +
          "</div>";
        return;
      }

      host.innerHTML = rows
        .map(function (item) {
          return (
            '<a class="news-item" href="news-detail.html?id=' +
            encodeURIComponent(item.id) +
            '">' +
            "<time>" +
            esc(formatDate(item.published_at)) +
            "</time>" +
            "<em>NEWS</em>" +
            "<strong>" +
            esc(langField(item, "title")) +
            "</strong>" +
            "<b>→</b>" +
            "</a>"
          );
        })
        .join("");
    } catch (error) {
      console.error(error);
      host.innerHTML = "";
    }
  }

  async function renderNewsDetail() {
    const host = document.getElementById("newsDetail");
    if (!host) return;

    const id =
      new URLSearchParams(location.search).get("id");

    if (!id) {
      host.innerHTML = "";
      return;
    }

    try {
      const rows = await select("site_news", {
        select: "*",
        id: "eq." + id,
        is_published: "eq.true",
        limit: 1
      });

      const item = rows[0];

      if (!item) {
        host.innerHTML = "";
        return;
      }

      document.title =
        langField(item, "title") + " — RƎ:ALYZE";

      host.innerHTML =
        '<article class="news-detail-card">' +
        (item.image_url
          ? '<img class="news-detail-image" src="' +
            esc(item.image_url) +
            '" alt="">'
          : "") +
        '<div class="news-detail-meta">' +
        esc(formatDate(item.published_at)) +
        "</div>" +
        "<h1>" +
        esc(langField(item, "title")) +
        "</h1>" +
        '<div class="cms-rich-text">' +
        sanitizeRichHTML(langField(item, "body")) +
        "</div>" +
        "</article>";
    } catch (error) {
      console.error(error);
      host.innerHTML = "";
    }
  }

  async function renderMusic() {
    const host = document.getElementById("dynamicMusicGrid");
    if (!host) return;

    try {
      const rows = await select("site_songs", {
        select: "*",
        is_published: "eq.true",
        order: "release_date.desc.nullslast,created_at.desc"
      });

      if (!rows.length) {
        host.innerHTML =
          '<div class="cms-empty">' +
          esc(emptyText("music")) +
          "</div>";
        return;
      }

      const lang = currentLang();

      host.innerHTML = rows
        .map(function (item) {
          const tag =
            lang === "ja"
              ? "歌唱"
              : lang === "en"
              ? "Vocal"
              : "Người hát";

          const dateTag =
            lang === "ja"
              ? "公開日"
              : lang === "en"
              ? "Release"
              : "Ngày ra mắt";

          const description =
            langField(item, "description");

          const body =
            '<div class="cms-music-image">' +
            '<img src="' +
            esc(item.image_url || "assets/group-main.jpg") +
            '" alt="' +
            esc(item.title || "") +
            '">' +
            "</div>" +
            '<div class="cms-music-body">' +
            (item.release_date
              ? '<div class="cms-music-date">' +
                esc(formatDate(item.release_date)) +
                "</div>"
              : "") +
            "<h2>" +
            esc(item.title || "") +
            "</h2>" +
            "<dl>" +
            "<div><dt>" +
            tag +
            "</dt><dd>" +
            esc(item.singers || "—") +
            "</dd></div>" +
            (item.release_date
              ? "<div><dt>" +
                dateTag +
                "</dt><dd>" +
                esc(formatDate(item.release_date)) +
                "</dd></div>"
              : "") +
            "</dl>" +
            (description
              ? "<p>" + esc(description) + "</p>"
              : "") +
            (item.external_url
              ? '<span class="cms-open-link">OPEN ↗</span>'
              : "") +
            "</div>";

          if (item.external_url) {
            return (
              '<a class="cms-music-card" href="' +
              esc(item.external_url) +
              '" target="_blank" rel="noopener noreferrer">' +
              body +
              "</a>"
            );
          }

          return (
            '<article class="cms-music-card">' +
            body +
            "</article>"
          );
        })
        .join("");
    } catch (error) {
      console.error(error);
      host.innerHTML = "";
    }
  }

  async function renderRules() {
    const host = document.getElementById("dynamicRules");
    if (!host) return;

    try {
      const rows = await select("site_rules", {
        select: "*",
        is_published: "eq.true",
        order: "sort_order.asc,created_at.asc"
      });

      if (!rows.length) {
        host.innerHTML =
          '<div class="cms-empty">' +
          esc(emptyText("rule")) +
          "</div>";
        return;
      }

      host.innerHTML = rows
        .map(function (item, index) {
          const title = langField(item, "title");
          const body = langField(item, "body");

          return (
            '<article class="cms-rule-card">' +
            '<div class="cms-rule-no">' +
            String(index + 1).padStart(2, "0") +
            "</div>" +
            '<div class="cms-rich-text">' +
            (title ? "<h2>" + esc(title) + "</h2>" : "") +
            sanitizeRichHTML(body) +
            "</div>" +
            "</article>"
          );
        })
        .join("");
    } catch (error) {
      console.error(error);
      host.innerHTML = "";
    }
  }

  async function renderAbout() {
    const shell = document.getElementById("dynamicAbout");
    if (!shell) return;

    try {
      const rows = await select("site_about", {
        select: "*",
        id: "eq.main",
        limit: 1
      });

      const item = rows[0];
      if (!item) return;

      const title = document.getElementById("aboutPageTitle");
      const desc = document.getElementById("aboutPageDesc");

      if (title) {
        title.textContent =
          langField(item, "page_title") ||
          "RƎ:ALYZE";
      }

      if (desc) {
        desc.textContent =
          langField(item, "page_desc");
      }

      shell.innerHTML =
        '<article class="info-panel">' +
        "<h2>" +
        esc(langField(item, "section1_title")) +
        "</h2>" +
        '<div class="cms-rich-text">' +
        sanitizeRichHTML(
          langField(item, "section1_body")
        ) +
        "</div>" +
        "</article>" +
        '<article class="info-panel">' +
        "<h2>" +
        esc(langField(item, "section2_title")) +
        "</h2>" +
        '<div class="cms-rich-text">' +
        sanitizeRichHTML(
          langField(item, "section2_body")
        ) +
        "</div>" +
        "</article>";
    } catch (error) {
      console.error(error);
    }
  }

  function renderAll() {
    renderNewsList();
    renderNewsDetail();
    renderMusic();
    renderRules();
    renderAbout();
  }

  document.addEventListener(
    "DOMContentLoaded",
    renderAll
  );

  document.addEventListener(
    "realyze-language-changed",
    renderAll
  );

  window.RealyzeSiteData = {
    refresh: renderAll
  };
})();
