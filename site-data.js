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

    if (lang === "vi") {
      return (
        item[base + "_vi"] ||
        item[base] ||
        ""
      );
    }

    if (lang === "en") {
      return (
        item[base + "_en"] ||
        item[base + "_vi"] ||
        item[base] ||
        ""
      );
    }

    return (
      item[base + "_ja"] ||
      item[base + "_en"] ||
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
    const source =
      String(html == null ? "" : html);

    const template =
      document.createElement("template");

    if (
      !/<[a-z][\s\S]*>/i.test(source)
    ) {
      const holder =
        document.createElement("div");

      holder.textContent = source;

      template.innerHTML =
        holder.innerHTML.replace(
          /\r?\n/g,
          "<br>"
        );
    } else {
      template.innerHTML = source;
    }

    const allowed = new Set([
      "H1", "H2", "H3", "P", "DIV", "BR",
      "STRONG", "B", "EM", "I", "SPAN",
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

        Array.from(element.attributes)
          .forEach(function (attr) {
            if (
              element.tagName === "A" &&
              ["href", "target", "rel"]
                .includes(attr.name)
            ) {
              return;
            }

            element.removeAttribute(
              attr.name
            );
          });

        if (element.tagName === "A") {
          element.setAttribute(
            "target",
            "_blank"
          );
          element.setAttribute(
            "rel",
            "noopener noreferrer"
          );
        }
      });

    return template.innerHTML;
  }

  async function loadConfig() {
    if (configCache) return configCache;

    const savedUrl =
      localStorage.getItem(
        "realyze_supabase_url"
      ) || "";

    const savedKey =
      localStorage.getItem(
        "realyze_supabase_anon_key"
      ) || "";

    if (
      /^https:\/\/.+\.supabase\.co$/i.test(
        savedUrl
      ) &&
      savedKey.length > 20
    ) {
      configCache = {
        url: savedUrl.replace(
          /\/+$/,
          ""
        ),
        key: savedKey
      };

      return configCache;
    }

    // Khi chạy localhost / GitHub Pages,
    // tự đọc cấu hình từ supabase-config.js.
    if (location.protocol !== "file:") {
      try {
        const response =
          await fetch(
            "./supabase-config.js?site=" +
              Date.now(),
            {
              cache: "no-store"
            }
          );

        if (response.ok) {
          const source =
            await response.text();

          const urlMatch =
            source.match(
              /SUPABASE_URL\s*=\s*["'`]([^"'`]+)["'`]/
            );

          const keyMatch =
            source.match(
              /SUPABASE_ANON_KEY\s*=\s*["'`]([^"'`]+)["'`]/
            );

          if (
            urlMatch &&
            keyMatch &&
            !urlMatch[1].includes(
              "YOUR_"
            ) &&
            !keyMatch[1].includes(
              "YOUR_"
            )
          ) {
            configCache = {
              url:
                urlMatch[1].replace(
                  /\/+$/,
                  ""
                ),
              key: keyMatch[1]
            };

            return configCache;
          }
        }
      } catch (error) {
        console.warn(
          "Cannot read supabase-config.js:",
          error
        );
      }
    }

    return null;
  }

  function queryString(params) {
    const search =
      new URLSearchParams();

    Object.keys(params || {})
      .forEach(function (key) {
        const value =
          params[key];

        if (
          value !== undefined &&
          value !== null &&
          value !== ""
        ) {
          search.set(
            key,
            String(value)
          );
        }
      });

    const query =
      search.toString();

    return query
      ? "?" + query
      : "";
  }

  async function select(
    table,
    params
  ) {
    const config =
      await loadConfig();

    if (!config) {
      throw new Error(
        "Supabase config unavailable."
      );
    }

    const response =
      await fetch(
        config.url +
          "/rest/v1/" +
          table +
          queryString(
            params || {}
          ),
        {
          cache: "no-store",
          headers: {
            apikey: config.key,
            Authorization:
              "Bearer " +
              config.key,
            "Cache-Control":
              "no-cache"
          }
        }
      );

    const raw =
      await response.text();

    let data = [];

    if (raw) {
      try {
        data =
          JSON.parse(raw);
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

      throw new Error(
        "Public query failed."
      );
    }

    return data;
  }

  function emptyText(type) {
    const lang =
      currentLang();

    const labels = {
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

    return (
      labels[type]?.[lang] ||
      labels[type]?.vi ||
      ""
    );
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
    const host =
      document.getElementById(
        "dynamicMusicGrid"
      );

    if (!host) return;

    try {
      const rows = await select(
        "site_songs",
        {
          select: "*",
          is_published: "eq.true",
          order:
            "release_date.desc.nullslast,created_at.desc"
        }
      );

      if (!rows.length) {
        host.innerHTML =
          '<div class="cms-empty">' +
          esc(emptyText("music")) +
          "</div>";
        return;
      }

      const lang = currentLang();

      const labels = {
        vi: {
          vocal: "Người hát",
          release: "Ngày ra mắt",
          more: "Xem thêm",
          less: "Thu gọn",
          open: "MỞ ↗"
        },
        en: {
          vocal: "Vocal",
          release: "Release",
          more: "Read more",
          less: "Collapse",
          open: "OPEN ↗"
        },
        ja: {
          vocal: "歌唱",
          release: "公開日",
          more: "もっと見る",
          less: "閉じる",
          open: "開く ↗"
        }
      };

      const t =
        labels[lang] || labels.vi;

      host.innerHTML =
        rows.map(function (item) {
          const description =
            langField(
              item,
              "description"
            );

          const longDescription =
            description.length > 170 ||
            description
              .split(/\r?\n/)
              .length > 4;

          return (
            '<article class="cms-music-card">' +

            '<div class="cms-music-image">' +
            '<img src="' +
            esc(
              item.image_url ||
              "assets/group-main.jpg"
            ) +
            '" alt="' +
            esc(item.title || "") +
            '">' +
            "</div>" +

            '<div class="cms-music-body">' +

            (item.release_date
              ? '<div class="cms-music-date">' +
                esc(
                  formatDate(
                    item.release_date
                  )
                ) +
                "</div>"
              : "") +

            "<h2>" +
            esc(item.title || "") +
            "</h2>" +

            "<dl>" +
            "<div><dt>" +
            t.vocal +
            "</dt><dd>" +
            esc(item.singers || "—") +
            "</dd></div>" +

            (item.release_date
              ? "<div><dt>" +
                t.release +
                "</dt><dd>" +
                esc(
                  formatDate(
                    item.release_date
                  )
                ) +
                "</dd></div>"
              : "") +
            "</dl>" +

            (description
              ? '<p class="cms-music-description' +
                (longDescription
                  ? " is-collapsible"
                  : "") +
                '">' +
                esc(description) +
                "</p>"
              : "") +

            '<div class="cms-music-actions">' +

            (longDescription
              ? '<button class="cms-music-toggle" type="button" ' +
                'data-more="' +
                esc(t.more) +
                '" data-less="' +
                esc(t.less) +
                '">' +
                esc(t.more) +
                "</button>"
              : "") +

            (item.external_url
              ? '<a class="cms-open-link" href="' +
                esc(item.external_url) +
                '" target="_blank" rel="noopener noreferrer">' +
                esc(t.open) +
                "</a>"
              : "") +

            "</div>" +
            "</div>" +
            "</article>"
          );
        }).join("");

      if (!host.dataset.toggleBound) {
        host.dataset.toggleBound = "1";

        host.addEventListener(
          "click",
          function (event) {
            const button =
              event.target.closest(
                ".cms-music-toggle"
              );

            if (!button) return;

            const card =
              button.closest(
                ".cms-music-card"
              );

            const expanded =
              card.classList.toggle(
                "is-expanded"
              );

            button.textContent =
              expanded
                ? button.dataset.less
                : button.dataset.more;
          }
        );
      }

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


  let memberCache = [];

  const fallbackMembers = [
    {
      id: "shota",
      name: "Shota",
      japanese: "ショウタ",
      romaji: "Shōta",
      color: "#B0D9FA",
      image_url: "assets/members/shota.jpg",
      sort_order: 1
    },
    {
      id: "vani",
      name: "Vani",
      japanese: "ヴァニ",
      romaji: "Vani",
      color: "#F9CDD4",
      image_url: "assets/members/vani.jpg",
      sort_order: 2
    },
    {
      id: "shoto",
      name: "Shoto",
      japanese: "ショウト",
      romaji: "Shōto",
      color: "#3A1865",
      image_url: "assets/members/shoto.jpg",
      sort_order: 3
    },
    {
      id: "mikon",
      name: "Mikon",
      japanese: "ミコン",
      romaji: "Mikon",
      color: "#A481C2",
      image_url: "assets/members/mikon.jpg",
      sort_order: 4
    },
    {
      id: "elis",
      name: "Elis",
      japanese: "エリス",
      romaji: "Erisu",
      color: "#940912",
      image_url: "assets/members/elis.jpg",
      sort_order: 5
    },
    {
      id: "hikari",
      name: "Hikari",
      japanese: "ヒカリ",
      romaji: "Hikari",
      color: "#E0115F",
      image_url: "assets/members/hikari.jpg",
      sort_order: 6
    },
    {
      id: "ebi",
      name: "Ebi",
      japanese: "エビ",
      romaji: "Ebi",
      color: "#97A2FF",
      image_url: "assets/members/ebi.jpg",
      sort_order: 7
    },
    {
      id: "zanith",
      name: "Zanith",
      japanese: "ザニス",
      romaji: "Zanisu",
      color: "#66C1FF",
      image_url: "assets/members/zanith.jpg",
      sort_order: 8
    },
    {
      id: "eclia",
      name: "Eclia",
      japanese: "エクリア",
      romaji: "Ekuria",
      color: "#FFCDCD",
      image_url: "assets/members/eclia.jpg",
      sort_order: 9
    }
  ];

  function memberText(item, base) {
    const lang = currentLang();

    return (
      item[base + "_" + lang] ||
      item[base + "_vi"] ||
      ""
    );
  }

  function updateMemberSectionDesc(count) {
    const element =
      document.getElementById(
        "memberSectionDesc"
      );

    if (!element) return;

    const lang = currentLang();

    if (lang === "en") {
      element.textContent =
        count +
        " members, each with a distinct color — together forming RƎ:ALYZE.";
      return;
    }

    if (lang === "ja") {
      element.textContent =
        count +
        "人、それぞれの色が重なり、RƎ:ALYZEになる。";
      return;
    }

    element.textContent =
      count +
      " thành viên, " +
      count +
      " màu sắc riêng cùng tạo nên RƎ:ALYZE.";
  }

  function setSocialLink(element, url) {
    if (!element) return;

    if (url) {
      element.href = url;
      element.hidden = false;
    } else {
      element.removeAttribute("href");
      element.hidden = true;
    }
  }

  function openMemberProfile(id) {
    const member =
      memberCache.find(
        function (item) {
          return (
            String(item.id) ===
            String(id)
          );
        }
      );

    const modal =
      document.getElementById(
        "profileModal"
      );

    if (!member || !modal) return;

    const image =
      document.getElementById("profileImage");
    const name =
      document.getElementById("profileName");
    const japanese =
      document.getElementById("profileJapanese");
    const romaji =
      document.getElementById("profileRomaji");
    const quote =
      document.getElementById("profileQuote");
    const birthday =
      document.getElementById("profileBirthday");
    const hobby =
      document.getElementById("profileHobby");
    const color =
      document.getElementById("profileColor");
    const colorDot =
      document.getElementById("profileColorDot");

    const quoteText =
      memberText(member, "quote");

    const hobbyText =
      memberText(member, "hobby");

    image.src =
      member.image_url ||
      "assets/members/" +
      member.id +
      ".jpg";

    image.alt =
      member.name || "";

    name.textContent =
      member.name || "—";

    japanese.textContent =
      member.japanese || "—";

    romaji.textContent =
      member.romaji || "—";

    quote.textContent =
      quoteText
        ? "“" + quoteText + "”"
        : "—";

    birthday.textContent =
      member.birthday || "—";

    hobby.textContent =
      hobbyText || "—";

    color.textContent =
      member.color || "—";

    colorDot.style.background =
      member.color || "#ddd";

    setSocialLink(
      document.getElementById("profileX"),
      member.x_url
    );

    setSocialLink(
      document.getElementById("profileYT"),
      member.youtube_url
    );

    setSocialLink(
      document.getElementById("profileTT"),
      member.tiktok_url
    );

    modal.dataset.memberId =
      member.id;

    if (!modal.open) {
      modal.showModal();
    }
  }

  function bindMemberModal() {
    const modal =
      document.getElementById(
        "profileModal"
      );

    if (!modal || modal.dataset.bound) {
      return;
    }

    modal.dataset.bound = "1";

    const close =
      document.getElementById(
        "profileClose"
      );

    if (close) {
      close.addEventListener(
        "click",
        function () {
          modal.close();
        }
      );
    }

    modal.addEventListener(
      "click",
      function (event) {
        const rect =
          modal.getBoundingClientRect();

        const outside =
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom;

        if (outside) {
          modal.close();
        }
      }
    );
  }

  async function renderMembers() {
    const host =
      document.getElementById(
        "dynamicMemberGrid"
      );

    if (!host) return;

    let rows = [];

    try {
      rows = await select(
        "site_members",
        {
          select: "*",
          is_active: "eq.true",
          order: "sort_order.asc,name.asc"
        }
      );
    } catch (error) {
      console.warn(
        "Using member fallback:",
        error
      );

      rows = fallbackMembers;
    }

    if (!rows.length) {
      rows = fallbackMembers;
    }

    memberCache = rows;

    updateMemberSectionDesc(
      rows.length
    );

    host.innerHTML =
      rows.map(function (item) {
        return (
          '<article class="member-card" ' +
          'data-member-id="' +
          esc(item.id) +
          '" tabindex="0" role="button" ' +
          'aria-label="' +
          esc(item.name || "") +
          '">' +

          '<div class="member-photo-wrap">' +
          '<img src="' +
          esc(
            item.image_url ||
            "assets/members/" +
            item.id +
            ".jpg"
          ) +
          '" alt="' +
          esc(item.name || "") +
          '">' +
          "</div>" +

          '<div class="member-info">' +
          "<h3>" +
          esc(item.name || "") +
          "</h3>" +
          '<span style="background:' +
          esc(item.color || "#ddd") +
          '"></span>' +
          "</div>" +
          "</article>"
        );
      }).join("");

    host
      .querySelectorAll(
        ".member-card[data-member-id]"
      )
      .forEach(function (card) {
        const id =
          card.dataset.memberId;

        card.addEventListener(
          "click",
          function () {
            openMemberProfile(id);
          }
        );

        card.addEventListener(
          "keydown",
          function (event) {
            if (
              event.key === "Enter" ||
              event.key === " "
            ) {
              event.preventDefault();
              openMemberProfile(id);
            }
          }
        );
      });

    bindMemberModal();

    const modal =
      document.getElementById(
        "profileModal"
      );

    if (
      modal &&
      modal.open &&
      modal.dataset.memberId
    ) {
      openMemberProfile(
        modal.dataset.memberId
      );
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


  let youtubePage = 0;
  let youtubeVideos = [];
  let youtubePointerStart = null;
  let youtubePointerDelta = 0;

  function youtubePairs(items) {
    if (!items.length) {
      return [];
    }

    if (items.length === 1) {
      return [[items[0]]];
    }

    if (items.length === 2) {
      return [
        [items[0], items[1]],
        [items[1], items[0]]
      ];
    }

    return [
      [items[0], items[1]],
      [items[1], items[2]],
      [items[2], items[0]]
    ];
  }

  function youtubeImage(item) {
    return (
      item.image_url ||
      item.thumbnail ||
      (
        item.video_id
          ? "https://i.ytimg.com/vi/" +
            encodeURIComponent(
              item.video_id
            ) +
            "/hqdefault.jpg"
          : "assets/group-main.jpg"
      )
    );
  }

  function renderYoutubeCarousel() {
    const track =
      document.getElementById(
        "youtubeTrack"
      );

    const pagination =
      document.getElementById(
        "youtubePagination"
      );

    if (!track || !pagination) {
      return;
    }

    const pages =
      youtubePairs(
        youtubeVideos
      );

    if (!pages.length) {
      track.innerHTML = "";
      pagination.innerHTML = "";
      return;
    }

    if (youtubePage >= pages.length) {
      youtubePage = 0;
    }

    track.innerHTML =
      pages.map(function (page, pageIndex) {
        return (
          '<div class="youtube-slide" aria-hidden="' +
          (pageIndex === youtubePage
            ? "false"
            : "true") +
          '">' +

          page.map(function (item) {
            return (
              '<a class="youtube-video-card" href="' +
              esc(item.external_url) +
              '" target="_blank" rel="noopener noreferrer">' +

              '<div class="youtube-video-image">' +
              '<img draggable="false" src="' +
              esc(youtubeImage(item)) +
              '" alt="' +
              esc(item.title || "") +
              '">' +
              '<span class="youtube-play">▶</span>' +
              "</div>" +

              '<div class="youtube-video-title">' +
              esc(item.title || "") +
              "</div>" +

              "</a>"
            );
          }).join("") +

          "</div>"
        );
      }).join("");

    track.style.transform =
      "translate3d(" +
      (-youtubePage * 100) +
      "%,0,0)";

    pagination.innerHTML =
      pages.map(function (_, index) {
        return (
          '<button class="youtube-page-dot' +
          (index === youtubePage
            ? " active"
            : "") +
          '" type="button" data-page="' +
          index +
          '" aria-label="Page ' +
          (index + 1) +
          '">' +
          '<span class="meteor-mark">✦</span>' +
          "</button>"
        );
      }).join("");
  }

  function setYoutubePage(nextPage) {
    const pages =
      youtubePairs(
        youtubeVideos
      );

    if (!pages.length) return;

    youtubePage =
      (
        nextPage % pages.length +
        pages.length
      ) % pages.length;

    renderYoutubeCarousel();
  }

  function bindYoutubeCarousel() {
    const carousel =
      document.getElementById(
        "youtubeCarousel"
      );

    const pagination =
      document.getElementById(
        "youtubePagination"
      );

    if (
      !carousel ||
      carousel.dataset.bound
    ) {
      return;
    }

    carousel.dataset.bound = "1";

    let startX = null;
    let startY = null;
    let currentX = null;
    let dragging = false;
    let dragTriggered = false;
    let activePointerId = null;

    const DRAG_START = 8;
    const PAGE_CHANGE = 52;

    function finishDrag(event) {
      if (startX === null) {
        return;
      }

      const deltaX =
        (currentX ?? startX) -
        startX;

      const didDrag =
        dragging &&
        Math.abs(deltaX) >=
          DRAG_START;

      if (didDrag) {
        dragTriggered = true;

        if (
          Math.abs(deltaX) >=
          PAGE_CHANGE
        ) {
          setYoutubePage(
            youtubePage +
            (deltaX < 0 ? 1 : -1)
          );
        }

        // Keep click suppression only for the click generated
        // immediately after a real drag.
        setTimeout(
          function () {
            dragTriggered = false;
          },
          0
        );
      }

      if (
        activePointerId !== null
      ) {
        try {
          carousel.releasePointerCapture(
            activePointerId
          );
        } catch {}
      }

      startX = null;
      startY = null;
      currentX = null;
      dragging = false;
      activePointerId = null;

      carousel.classList.remove(
        "is-dragging"
      );
    }

    carousel.addEventListener(
      "pointerdown",
      function (event) {
        // Only react to the primary mouse button.
        if (
          event.pointerType === "mouse" &&
          event.button !== 0
        ) {
          return;
        }

        startX =
          event.clientX;

        startY =
          event.clientY;

        currentX =
          event.clientX;

        dragging = false;
        dragTriggered = false;

        activePointerId =
          event.pointerId;

        carousel.classList.add(
          "is-pointer-down"
        );
      }
    );

    carousel.addEventListener(
      "pointermove",
      function (event) {
        if (startX === null) {
          return;
        }

        currentX =
          event.clientX;

        const deltaX =
          event.clientX -
          startX;

        const deltaY =
          event.clientY -
          startY;

        if (
          !dragging &&
          Math.abs(deltaX) >
            DRAG_START &&
          Math.abs(deltaX) >
            Math.abs(deltaY)
        ) {
          dragging = true;

          carousel.classList.add(
            "is-dragging"
          );

          try {
            carousel.setPointerCapture(
              event.pointerId
            );
          } catch {}
        }

        if (dragging) {
          // Prevent browser image/link drag while user is sliding.
          event.preventDefault();
        }
      }
    );

    carousel.addEventListener(
      "pointerup",
      finishDrag
    );

    carousel.addEventListener(
      "pointercancel",
      finishDrag
    );

    carousel.addEventListener(
      "lostpointercapture",
      function () {
        if (startX !== null) {
          finishDrag({});
        }
      }
    );

    // Prevent native drag-and-drop ghost image.
    carousel.addEventListener(
      "dragstart",
      function (event) {
        event.preventDefault();
      }
    );

    // Crucial: only block the link click after an actual drag.
    carousel.addEventListener(
      "click",
      function (event) {
        if (!dragTriggered) {
          return;
        }

        const link =
          event.target.closest(
            ".youtube-video-card"
          );

        if (link) {
          event.preventDefault();
          event.stopPropagation();
        }
      },
      true
    );

    pagination?.addEventListener(
      "click",
      function (event) {
        const button =
          event.target.closest(
            ".youtube-page-dot"
          );

        if (!button) return;

        setYoutubePage(
          Number(
            button.dataset.page || 0
          )
        );
      }
    );
  }

  async function fetchLatestYoutubeVideos() {
    const config =
      await loadConfig();

    if (!config) {
      throw new Error(
        "Supabase config unavailable."
      );
    }

    const response =
      await fetch(
        config.url +
          "/functions/v1/youtube-latest",
        {
          method: "GET",
          cache: "no-store",
          headers: {
            apikey: config.key,
            Authorization:
              "Bearer " +
              config.key
          }
        }
      );

    const raw =
      await response.text();

    let data = null;

    try {
      data =
        raw
          ? JSON.parse(raw)
          : null;
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error(
        data?.error ||
        "Cannot load YouTube videos."
      );
    }

    return Array.isArray(
      data?.videos
    )
      ? data.videos
      : [];
  }

  async function renderYoutubeFeature() {
    const section =
      document.getElementById(
        "youtube"
      );

    const track =
      document.getElementById(
        "youtubeTrack"
      );

    if (!section || !track) {
      return;
    }

    try {
      const rows =
        await fetchLatestYoutubeVideos();

      youtubeVideos =
        rows.slice(0, 3);

      if (!youtubeVideos.length) {
        section.hidden = true;
        return;
      }

      section.hidden = false;

      if (
        youtubePage >=
        youtubePairs(
          youtubeVideos
        ).length
      ) {
        youtubePage = 0;
      }

      renderYoutubeCarousel();
      bindYoutubeCarousel();

      if (!youtubeRefreshTimer) {
        youtubeRefreshTimer =
          setInterval(
            function () {
              if (
                document.visibilityState ===
                "visible"
              ) {
                renderYoutubeFeature();
              }
            },
            60000
          );
      }

    } catch (error) {
      console.error(
        "YouTube live sync:",
        error
      );

      // Keep the current carousel visible if it
      // already loaded successfully before.
      if (!youtubeVideos.length) {
        section.hidden = true;
      }
    }
  }

  function renderAll() {
    renderNewsList();
    renderNewsDetail();
    renderMusic();
    renderRules();
    renderMembers();
    renderAbout();
    renderYoutubeFeature();
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
