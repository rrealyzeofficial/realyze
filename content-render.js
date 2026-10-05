import {
  getNews, getSongs, getRules, getNewsById,
  langField, getCurrentLanguage, formatDate, sanitizeRichHTML
} from "./cms.js";

const esc = (s = "") => String(s).replace(/[&<>"']/g, c => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
}[c]));

export async function renderHomeNews() {
  const host = document.querySelector("#dynamicNewsList");
  if (!host) return;

  host.innerHTML = '<div class="cms-loading">Loading...</div>';
  const items = await getNews(5);
  const lang = getCurrentLanguage();

  if (!items.length) {
    host.innerHTML = '<div class="cms-empty">No news yet.</div>';
    return;
  }

  host.innerHTML = items.map(item => `
    <a class="news-item" href="news-detail.html?id=${encodeURIComponent(item.id)}">
      <time>${esc(formatDate(item.published_at, lang))}</time>
      <em>NEWS</em>
      <strong>${esc(langField(item, "title", lang))}</strong>
      <b>→</b>
    </a>
  `).join("");
}

export async function renderMusic() {
  const host = document.querySelector("#dynamicMusicGrid");
  if (!host) return;

  host.innerHTML = '<div class="cms-loading">Loading...</div>';
  const items = await getSongs();
  const lang = getCurrentLanguage();

  if (!items.length) {
    host.innerHTML = '<div class="cms-empty">No music yet.</div>';
    return;
  }

  host.innerHTML = items.map(item => `
    <article class="cms-music-card">
      <div class="cms-music-image">
        <img src="${esc(item.image_url || "assets/group-main.jpg")}" alt="${esc(item.title)}">
      </div>
      <div class="cms-music-body">
        <div class="cms-music-date">${esc(formatDate(item.release_date, lang))}</div>
        <h2>${esc(item.title)}</h2>
        <dl>
          <div><dt>${lang === "ja" ? "歌唱" : lang === "en" ? "Vocal" : "Người hát"}</dt><dd>${esc(item.singers || "—")}</dd></div>
          <div><dt>${lang === "ja" ? "公開日" : lang === "en" ? "Release" : "Ngày ra mắt"}</dt><dd>${esc(formatDate(item.release_date, lang))}</dd></div>
        </dl>
        ${langField(item, "description", lang) ? `<p>${esc(langField(item, "description", lang))}</p>` : ""}
        ${item.external_url ? `<a class="cms-open-link" href="${esc(item.external_url)}" target="_blank" rel="noopener">OPEN ↗</a>` : ""}
      </div>
    </article>
  `).join("");
}

export async function renderRules() {
  const host = document.querySelector("#dynamicRules");
  if (!host) return;

  host.innerHTML = '<div class="cms-loading">Loading...</div>';
  const items = await getRules();
  const lang = getCurrentLanguage();

  if (!items.length) {
    host.innerHTML = '<div class="cms-empty">No rules yet.</div>';
    return;
  }

  host.innerHTML = items.map((item, i) => `
    <article class="cms-rule-card">
      <div class="cms-rule-no">${String(i + 1).padStart(2, "0")}</div>
      <div class="cms-rich-text">
        ${item[`title_${lang}`] || item.title_vi ? `<h2>${esc(langField(item, "title", lang))}</h2>` : ""}
        ${sanitizeRichHTML(langField(item, "body", lang))}
      </div>
    </article>
  `).join("");
}

export async function renderNewsDetail() {
  const host = document.querySelector("#newsDetail");
  if (!host) return;

  const id = new URLSearchParams(location.search).get("id");
  const item = await getNewsById(id);
  const lang = getCurrentLanguage();

  if (!item) {
    host.innerHTML = '<div class="cms-empty">News not found.</div>';
    return;
  }

  document.title = `${langField(item, "title", lang)} — RƎ:ALYZE`;

  host.innerHTML = `
    <article class="news-detail-card">
      ${item.image_url ? `<img class="news-detail-image" src="${esc(item.image_url)}" alt="">` : ""}
      <div class="news-detail-meta">${esc(formatDate(item.published_at, lang))}</div>
      <h1>${esc(langField(item, "title", lang))}</h1>
      <div class="cms-rich-text">${sanitizeRichHTML(langField(item, "body", lang))}</div>
    </article>
  `;
}

document.addEventListener("realyze-language-changed", () => {
  renderHomeNews();
  renderMusic();
  renderRules();
  renderNewsDetail();
});

document.addEventListener("DOMContentLoaded", () => {
  renderHomeNews();
  renderMusic();
  renderRules();
  renderNewsDetail();
});
