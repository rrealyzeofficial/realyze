import {
  restSelect,
  hasSupabaseConfig
} from "./supabase-rest.js";

export const demoNews = [
  {
    id: "demo-news-1",
    title_vi: "RƎ:ALYZE official website renewal.",
    title_en: "RƎ:ALYZE official website renewal.",
    title_ja: "RƎ:ALYZE公式サイトをリニューアルしました。",
    body_vi:
      "<h2>Website mới của RƎ:ALYZE</h2>" +
      "<p>Đây là nội dung mẫu. Khi kết nối Supabase, " +
      "bạn có thể cập nhật News từ trang Admin.</p>",
    body_en:
      "<h2>The new RƎ:ALYZE website</h2>" +
      "<p>This is sample content.</p>",
    body_ja:
      "<h2>RƎ:ALYZEの新しいウェブサイト</h2>" +
      "<p>これはサンプルです。</p>",
    image_url: "assets/group-main.jpg",
    published_at: "2026-10-05"
  }
];

export const demoSongs = [
  {
    id: "demo-song-1",
    title: "Virtual to LIVE",
    singers: "RƎ:ALYZE",
    release_date: "2026-10-01",
    image_url: "assets/group-main.jpg",
    external_url: "#",
    description_vi: "Group Cover",
    description_en: "Group Cover",
    description_ja: "グループカバー"
  },
  {
    id: "demo-song-2",
    title: "Teikoku Shoujo",
    singers: "Ebi × Vani",
    release_date: "2026-09-20",
    image_url: "assets/group-main.jpg",
    external_url: "#",
    description_vi: "Duet Cover",
    description_en: "Duet Cover",
    description_ja: "デュエットカバー"
  }
];

export const demoRules = [
  {
    id: "demo-rule-1",
    title_vi: "Tôn trọng",
    title_en: "Respect",
    title_ja: "リスペクト",
    body_vi:
      "<h2>Tôn trọng thành viên và cộng đồng</h2>" +
      "<p>Không công kích hoặc làm ảnh hưởng tiêu cực " +
      "đến các thành viên.</p>",
    body_en:
      "<h2>Respect members and the community</h2>" +
      "<p>Avoid harassment or attacks.</p>",
    body_ja:
      "<h2>メンバーとコミュニティを尊重する</h2>" +
      "<p>誹謗中傷や攻撃的な行為は避けてください。</p>",
    sort_order: 1
  }
];

export function getCurrentLanguage() {
  return (
    localStorage.getItem("realyze-language") ||
    "vi"
  );
}

export function langField(
  item,
  base,
  lang = getCurrentLanguage()
) {
  return (
    item?.[`${base}_${lang}`] ||
    item?.[`${base}_vi`] ||
    item?.[base] ||
    ""
  );
}

export function formatDate(
  dateString,
  lang = getCurrentLanguage()
) {
  if (!dateString) return "";

  const locale =
    lang === "ja"
      ? "ja-JP"
      : lang === "en"
      ? "en-US"
      : "vi-VN";

  const date =
    new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat(
    locale,
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }
  ).format(date);
}

export function sanitizeRichHTML(
  html = ""
) {
  const template =
    document.createElement("template");

  template.innerHTML = html;

  const allowed = new Set([
    "H1","H2","H3","P","BR",
    "STRONG","B","EM","I",
    "UL","OL","LI",
    "BLOCKQUOTE","HR","A"
  ]);

  template.content
    .querySelectorAll("*")
    .forEach(element => {
      if (!allowed.has(element.tagName)) {
        element.replaceWith(
          ...element.childNodes
        );
        return;
      }

      [...element.attributes]
        .forEach(attribute => {
          if (
            element.tagName === "A" &&
            ["href","target","rel"]
              .includes(attribute.name)
          ) {
            return;
          }

          element.removeAttribute(
            attribute.name
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

export async function getNews(
  limit = 20
) {
  if (!hasSupabaseConfig()) {
    return demoNews.slice(0, limit);
  }

  try {
    return await restSelect(
      "site_news",
      {
        select: "*",
        is_published: "eq.true",
        order: "published_at.desc",
        limit
      }
    );
  } catch (error) {
    console.error(error);
    return demoNews.slice(0, limit);
  }
}

export async function getNewsById(id) {
  if (!hasSupabaseConfig()) {
    return (
      demoNews.find(
        item => item.id === id
      ) ||
      demoNews[0]
    );
  }

  try {
    const rows = await restSelect(
      "site_news",
      {
        select: "*",
        id: `eq.${id}`,
        is_published: "eq.true",
        limit: 1
      }
    );

    return rows?.[0] || null;

  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function getSongs() {
  if (!hasSupabaseConfig()) {
    return demoSongs;
  }

  try {
    return await restSelect(
      "site_songs",
      {
        select: "*",
        is_published: "eq.true",
        order: "release_date.desc"
      }
    );
  } catch (error) {
    console.error(error);
    return demoSongs;
  }
}

export async function getRules() {
  if (!hasSupabaseConfig()) {
    return demoRules;
  }

  try {
    return await restSelect(
      "site_rules",
      {
        select: "*",
        is_published: "eq.true",
        order:
          "sort_order.asc,created_at.asc"
      }
    );
  } catch (error) {
    console.error(error);
    return demoRules;
  }
}
