
// ======================================================
// LANGUAGE SYSTEM — VI (default) / EN / JA
// ======================================================
// Vietnamese is the source/default language.
// Switching EN/JP translates the interface instantly.
// Selected language is remembered with localStorage.

const translations = {
  vi: {
    "nav.top":"TRANG CHỦ",
    "nav.member":"THÀNH VIÊN",
    "nav.about":"GIỚI THIỆU",
    "nav.music":"ÂM NHẠC",
    "nav.rule":"QUY TẮC",
    "nav.news":"TIN TỨC",
    "nav.contact":"LIÊN HỆ",

    "home.member_kicker":"THÀNH VIÊN",
    "home.member_title":"Gặp gỡ các thành viên",
    "home.member_desc":"9 thành viên, 9 màu sắc riêng cùng tạo nên RƎ:ALYZE.",
    "home.news_kicker":"TIN TỨC",
    "home.news_title":"Cập nhật mới nhất",
    "news.1":"RƎ:ALYZE chính thức làm mới website.",
    "news.2":"Dự án cover mới đã được phát hành.",
    "news.3":"Thông tin tuyển thành viên đã được cập nhật.",
    "home.contact_kicker":"LIÊN HỆ",
    "home.contact_title":"Cùng cộng hưởng với chúng mình.",
    "home.contact_desc":"Theo dõi các kênh chính thức của RƎ:ALYZE.",

    "social.youtube":"YouTube",
    "social.tiktok":"TikTok",
    "social.facebook":"Facebook",
    "social.x":"X",
    "social.discord":"Discord",

    "profile.label":"HỒ SƠ THÀNH VIÊN",
    "profile.birthday":"NGÀY SINH",
    "profile.hobby":"SỞ THÍCH",
    "profile.color":"MÀU CHỦ ĐẠO",

    "about.kicker":"GIỚI THIỆU",
    "about.title":"Về RƎ:ALYZE",
    "about.desc":"Trang giới thiệu về nhóm, ý nghĩa tên RƎ:ALYZE và concept tổng thể.",
    "about.body1":"RƎ:ALYZE là một nhóm cover Việt Nam tập trung vào J-pop, Vocaloid và phong cách Utaite. Mỗi thành viên có một màu sắc riêng, cùng tạo nên những dự án âm nhạc chung của nhóm.",
    "about.body2":"Đây là không gian dành cho ý nghĩa chính thức của RE:SONANCE, slogan của nhóm và cách các thành viên được kết nối với nhau.",

    "music.kicker":"ÂM NHẠC",
    "music.title":"Âm nhạc của chúng mình",
    "music.desc":"Nơi tổng hợp các bài cover, unit, duet và project âm nhạc của RƎ:ALYZE.",
    "music.group_cover":"COVER CẢ NHÓM",
    "music.duet_cover":"COVER SONG CA",
    "music.unit_cover":"COVER UNIT",

    "rule.kicker":"QUY TẮC",
    "rule.title":"Quy tắc cộng đồng",
    "rule.desc":"Các quy tắc và hướng dẫn chính thức của RƎ:ALYZE.",
    "rule.r1_title":"Tôn trọng",
    "rule.r1_body":"Tôn trọng thành viên, staff và cộng đồng. Bạn có thể thay nội dung mẫu này bằng rule chính thức.",
    "rule.r2_title":"Credit",
    "rule.r2_body":"Giữ đầy đủ credit khi repost hoặc sử dụng nội dung của nhóm theo quy định của RƎ:ALYZE.",
    "rule.r3_title":"Cộng đồng",
    "rule.r3_body":"Không gây tranh cãi, công kích hoặc tạo nội dung làm ảnh hưởng đến thành viên và cộng đồng.",

    "footer.back":"VỀ ĐẦU TRANG ↑"
  },

  en: {
    "nav.top":"TOP",
    "nav.member":"MEMBER",
    "nav.about":"ABOUT",
    "nav.music":"MUSIC",
    "nav.rule":"RULE",
    "nav.news":"NEWS",
    "nav.contact":"CONTACT",

    "home.member_kicker":"MEMBER",
    "home.member_title":"Meet the members",
    "home.member_desc":"Nine members, nine distinct colors — together forming RƎ:ALYZE.",
    "home.news_kicker":"NEWS",
    "home.news_title":"Latest updates",
    "news.1":"The RƎ:ALYZE official website has been renewed.",
    "news.2":"A new cover project has been released.",
    "news.3":"Member recruitment information has been updated.",
    "home.contact_kicker":"CONTACT",
    "home.contact_title":"Stay in resonance.",
    "home.contact_desc":"Follow the official RƎ:ALYZE channels.",

    "social.youtube":"YouTube",
    "social.tiktok":"TikTok",
    "social.facebook":"Facebook",
    "social.x":"X",
    "social.discord":"Discord",

    "profile.label":"MEMBER PROFILE",
    "profile.birthday":"BIRTHDAY",
    "profile.hobby":"HOBBY",
    "profile.color":"MAIN COLOR",

    "about.kicker":"ABOUT",
    "about.title":"About RƎ:ALYZE",
    "about.desc":"Learn more about the group, the meaning behind RƎ:ALYZE, and its overall concept.",
    "about.body1":"RƎ:ALYZE is a Vietnamese cover group focused on J-pop, Vocaloid, and Utaite-style music. Each member brings a unique color and personality, coming together through shared music projects.",
    "about.body2":"This space introduces the official meaning of RE:SONANCE, the group slogan, and the connection between the members.",

    "music.kicker":"MUSIC",
    "music.title":"Our music",
    "music.desc":"A collection of RƎ:ALYZE covers, units, duets, and music projects.",
    "music.group_cover":"GROUP COVER",
    "music.duet_cover":"DUET COVER",
    "music.unit_cover":"UNIT COVER",

    "rule.kicker":"RULE",
    "rule.title":"Community rules",
    "rule.desc":"Official RƎ:ALYZE community rules and guidelines.",
    "rule.r1_title":"Respect",
    "rule.r1_body":"Respect the members, staff, and community. Replace this sample text with the official rule when ready.",
    "rule.r2_title":"Credits",
    "rule.r2_body":"Keep proper credits when reposting or using RƎ:ALYZE content according to the group's guidelines.",
    "rule.r3_title":"Community",
    "rule.r3_body":"Avoid harassment, personal attacks, or content that may negatively affect members or the community.",

    "footer.back":"BACK TO TOP ↑"
  },

  ja: {
    "nav.top":"トップ",
    "nav.member":"メンバー",
    "nav.about":"アバウト",
    "nav.music":"ミュージック",
    "nav.rule":"ルール",
    "nav.news":"ニュース",
    "nav.contact":"コンタクト",

    "home.member_kicker":"メンバー",
    "home.member_title":"メンバー紹介",
    "home.member_desc":"9人、9つの個性。それぞれの色が重なり、RƎ:ALYZEになる。",
    "home.news_kicker":"ニュース",
    "home.news_title":"最新情報",
    "news.1":"RƎ:ALYZE公式サイトをリニューアルしました。",
    "news.2":"新しいカバープロジェクトを公開しました。",
    "news.3":"メンバー募集情報を更新しました。",
    "home.contact_kicker":"コンタクト",
    "home.contact_title":"私たちと共鳴しよう。",
    "home.contact_desc":"RƎ:ALYZEの公式アカウントをフォローしてください。",

    "social.youtube":"YouTube",
    "social.tiktok":"TikTok",
    "social.facebook":"Facebook",
    "social.x":"X",
    "social.discord":"Discord",

    "profile.label":"メンバープロフィール",
    "profile.birthday":"誕生日",
    "profile.hobby":"趣味",
    "profile.color":"メインカラー",

    "about.kicker":"アバウト",
    "about.title":"RƎ:ALYZEについて",
    "about.desc":"グループの紹介、RƎ:ALYZEという名前の意味、そして全体のコンセプトを紹介します。",
    "about.body1":"RƎ:ALYZEは、J-POP、Vocaloid、歌い手スタイルを中心に活動するベトナムのカバーグループです。メンバーそれぞれが異なる個性と色を持ち、音楽を通してひとつの作品を作り上げます。",
    "about.body2":"ここでは、RE:SONANCEの公式な意味、グループのスローガン、そしてメンバー同士のつながりを紹介します。",

    "music.kicker":"ミュージック",
    "music.title":"私たちの音楽",
    "music.desc":"RƎ:ALYZEのカバー、ユニット、デュエット、音楽プロジェクトをまとめています。",
    "music.group_cover":"グループカバー",
    "music.duet_cover":"デュエットカバー",
    "music.unit_cover":"ユニットカバー",

    "rule.kicker":"ルール",
    "rule.title":"コミュニティルール",
    "rule.desc":"RƎ:ALYZEの公式コミュニティルールとガイドラインです。",
    "rule.r1_title":"リスペクト",
    "rule.r1_body":"メンバー、スタッフ、コミュニティを尊重してください。この文章は後から正式なルールに変更できます。",
    "rule.r2_title":"クレジット",
    "rule.r2_body":"RƎ:ALYZEのコンテンツを再投稿・使用する場合は、グループのルールに従って適切なクレジットを記載してください。",
    "rule.r3_title":"コミュニティ",
    "rule.r3_body":"メンバーやコミュニティに悪影響を与えるような攻撃、誹謗中傷、トラブルにつながる行為は避けてください。",

    "footer.back":"ページ上部へ ↑"
  }
};

let currentLanguage = localStorage.getItem("realyze-language") || "vi";
if(!translations[currentLanguage]) currentLanguage = "vi";

function translatePage(lang){
  currentLanguage = lang;
  localStorage.setItem("realyze-language", lang);
  document.documentElement.lang = lang === "ja" ? "ja" : lang;

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    const value = translations[lang]?.[key] ?? translations.vi[key];
    if(value !== undefined) el.textContent = value;
  });

  document.querySelectorAll(".lang-switcher [data-lang]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });

  document.dispatchEvent(new CustomEvent("realyze-language-changed", { detail: { lang } }));

  // Refresh an open member popup so its text changes immediately too.
  const modal = document.querySelector("#profileModal");
  if(modal?.open && modal.dataset.memberKey){
    openMemberProfile(modal.dataset.memberKey);
  }
}

document.querySelectorAll(".lang-switcher [data-lang]").forEach(btn => {
  btn.addEventListener("click", () => translatePage(btn.dataset.lang));
});

document.addEventListener("DOMContentLoaded", () => translatePage(currentLanguage));



const menuBtn = document.querySelector("#menuBtn");
const mainNav = document.querySelector("#mainNav");

if(menuBtn && mainNav){
  menuBtn.addEventListener("click", () => mainNav.classList.toggle("open"));
  mainNav.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", () => mainNav.classList.remove("open"));
  });
}

/*
  MEMBER DATA
  ------------------------------
  Bạn chỉ cần sửa dữ liệu trong object bên dưới.
  Link "#" là placeholder, thay bằng link thật của từng thành viên.
*/
const memberProfiles = {
  shota: {
    name:"Shota", japanese:"ショウタ", romaji:"Shōta",
    quote:{
      vi:"Câu giới thiệu của Shota sẽ đặt ở đây.",
      en:"Shota's self-introduction will be placed here.",
      ja:"ショウタの自己紹介メッセージをここに入れます。"
    },
    birthday:"Chưa cập nhật",
    hobby:{vi:"Chưa cập nhật", en:"Not updated", ja:"未設定"},
    color:"#B0D9FA", colorName:"#B0D9FA",
    image:"assets/members/shota.jpg", x:"#", youtube:"#", tiktok:"#"
  },
  vani: {
    name:"Vani", japanese:"ヴァニ", romaji:"Vani",
    quote:{
      vi:"Câu giới thiệu của Vani sẽ đặt ở đây.",
      en:"Vani's self-introduction will be placed here.",
      ja:"ヴァニの自己紹介メッセージをここに入れます。"
    },
    birthday:"Chưa cập nhật",
    hobby:{vi:"Chưa cập nhật", en:"Not updated", ja:"未設定"},
    color:"#F9CDD4", colorName:"#F9CDD4",
    image:"assets/members/vani.jpg", x:"#", youtube:"#", tiktok:"#"
  },
  shoto: {
    name:"Shoto", japanese:"ショウト", romaji:"Shōto",
    quote:{vi:"Câu giới thiệu của Shoto sẽ đặt ở đây.",en:"Shoto's self-introduction will be placed here.",ja:"ショウトの自己紹介メッセージをここに入れます。"},
    birthday:"Chưa cập nhật", hobby:{vi:"Chưa cập nhật",en:"Not updated",ja:"未設定"},
    color:"#3A1865",colorName:"#3A1865",image:"assets/members/shoto.jpg",x:"#",youtube:"#",tiktok:"#"
  },
  mikon: {
    name:"Mikon", japanese:"ミコン", romaji:"Mikon",
    quote:{vi:"Câu giới thiệu của Mikon sẽ đặt ở đây.",en:"Mikon's self-introduction will be placed here.",ja:"ミコンの自己紹介メッセージをここに入れます。"},
    birthday:"Chưa cập nhật", hobby:{vi:"Chưa cập nhật",en:"Not updated",ja:"未設定"},
    color:"#A481C2",colorName:"#A481C2",image:"assets/members/mikon.jpg",x:"#",youtube:"#",tiktok:"#"
  },
  elis: {
    name:"Elis", japanese:"エリス", romaji:"Erisu",
    quote:{vi:"Câu giới thiệu của Elis sẽ đặt ở đây.",en:"Elis's self-introduction will be placed here.",ja:"エリスの自己紹介メッセージをここに入れます。"},
    birthday:"Chưa cập nhật", hobby:{vi:"Chưa cập nhật",en:"Not updated",ja:"未設定"},
    color:"#940912",colorName:"#940912",image:"assets/members/elis.jpg",x:"#",youtube:"#",tiktok:"#"
  },
  hikari: {
    name:"Hikari", japanese:"ヒカリ", romaji:"Hikari",
    quote:{vi:"Câu giới thiệu của Hikari sẽ đặt ở đây.",en:"Hikari's self-introduction will be placed here.",ja:"ヒカリの自己紹介メッセージをここに入れます。"},
    birthday:"Chưa cập nhật", hobby:{vi:"Chưa cập nhật",en:"Not updated",ja:"未設定"},
    color:"#E0115F",colorName:"#E0115F",image:"assets/members/hikari.jpg",x:"#",youtube:"#",tiktok:"#"
  },
  ebi: {
    name:"Ebi", japanese:"エビ", romaji:"Ebi",
    quote:{vi:"Câu giới thiệu của Ebi sẽ đặt ở đây.",en:"Ebi's self-introduction will be placed here.",ja:"エビの自己紹介メッセージをここに入れます。"},
    birthday:"Chưa cập nhật", hobby:{vi:"Chưa cập nhật",en:"Not updated",ja:"未設定"},
    color:"#97A2FF",colorName:"#97A2FF",image:"assets/members/ebi.jpg",x:"#",youtube:"#",tiktok:"#"
  },
  zanith: {
    name:"Zanith", japanese:"ザニス", romaji:"Zanisu",
    quote:{vi:"Câu giới thiệu của Zanith sẽ đặt ở đây.",en:"Zanith's self-introduction will be placed here.",ja:"ザニスの自己紹介メッセージをここに入れます。"},
    birthday:"Chưa cập nhật", hobby:{vi:"Chưa cập nhật",en:"Not updated",ja:"未設定"},
    color:"#66C1FF",colorName:"#66C1FF",image:"assets/members/zanith.jpg",x:"#",youtube:"#",tiktok:"#"
  },
  eclia: {
    name:"Eclia", japanese:"エクリア", romaji:"Ekuria",
    quote:{vi:"Câu giới thiệu của Eclia sẽ đặt ở đây.",en:"Eclia's self-introduction will be placed here.",ja:"エクリアの自己紹介メッセージをここに入れます。"},
    birthday:"Chưa cập nhật", hobby:{vi:"Chưa cập nhật",en:"Not updated",ja:"未設定"},
    color:"#FFCDCD",colorName:"#FFCDCD",image:"assets/members/eclia.jpg",x:"#",youtube:"#",tiktok:"#"
  }
};

const profileModal = document.querySelector("#profileModal");
const profileClose = document.querySelector("#profileClose");

const fields = {
  image: document.querySelector("#profileImage"),
  name: document.querySelector("#profileName"),
  japanese: document.querySelector("#profileJapanese"),
  romaji: document.querySelector("#profileRomaji"),
  quote: document.querySelector("#profileQuote"),
  birthday: document.querySelector("#profileBirthday"),
  hobby: document.querySelector("#profileHobby"),
  color: document.querySelector("#profileColor"),
  colorDot: document.querySelector("#profileColorDot"),
  x: document.querySelector("#profileX"),
  youtube: document.querySelector("#profileYT"),
  tiktok: document.querySelector("#profileTT")
};

function openMemberProfile(key){
  const p = memberProfiles[key];
  if(!p || !profileModal) return;

  fields.image.src = p.image;
  fields.image.alt = p.name;
  fields.name.textContent = p.name;
  fields.japanese.textContent = p.japanese;
  fields.romaji.textContent = p.romaji;
  fields.quote.textContent = `“${p.quote?.[currentLanguage] ?? p.quote?.vi ?? p.quote}”`;
  fields.birthday.textContent = p.birthday;
  fields.hobby.textContent = p.hobby?.[currentLanguage] ?? p.hobby?.vi ?? p.hobby;
  fields.color.textContent = p.colorName;
  fields.colorDot.style.background = p.color;

  fields.x.href = p.x;
  fields.youtube.href = p.youtube;
  fields.tiktok.href = p.tiktok;

  profileModal.dataset.memberKey = key;
  if(!profileModal.open) profileModal.showModal();
}

document.querySelectorAll(".member-card[data-member]").forEach(card => {
  const key = card.dataset.member;

  card.addEventListener("click", () => openMemberProfile(key));

  card.addEventListener("keydown", e => {
    if(e.key === "Enter" || e.key === " "){
      e.preventDefault();
      openMemberProfile(key);
    }
  });
});

if(profileClose){
  profileClose.addEventListener("click", () => profileModal.close());
}

if(profileModal){
  profileModal.addEventListener("click", e => {
    const r = profileModal.getBoundingClientRect();
    const outside =
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom;

    if(outside) profileModal.close();
  });
}
