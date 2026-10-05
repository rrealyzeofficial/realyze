RƎ:ALYZE OFFICIAL WEBSITE V3

CHANGES
- Top visual is now ONE static group image.
- Hero image file: assets/group-main.jpg
- Hero image source size is fixed at 1600 x 720 px.
- CSS desktop crop: aspect-ratio 20/9, object-position center center.
- Member section is immediately under RE:SONANCE.
- Members are centered in a 3 x 3 grid with separate framed cards.
- Lighter lavender / blush / white palette.
- Rounded typography everywhere.
- ABOUT, MUSIC and RULE are separate pages.
- NEWS is directly above CONTACT on the home page.

GROUP IMAGE
Replace:
assets/group-main.jpg

Recommended source size:
1600 x 720 px

To adjust crop later, edit this rule in styles.css:
.group-frame img {
  aspect-ratio:20/9;
  object-fit:cover;
  object-position:center center;
}

Examples:
object-position:center 20%;
object-position:center top;

MEMBER IMAGES
Replace these files while keeping the same names:
assets/members/shota.jpg
assets/members/vani.jpg
assets/members/shoto.jpg
assets/members/mikon.jpg
assets/members/elis.jpg
assets/members/hikari.jpg
assets/members/ebi.jpg
assets/members/zanith.jpg
assets/members/eclia.jpg

Placeholder member size: 900 x 1100 px.


V4 - MEMBER HOVER + PROFILE POPUP
---------------------------------
Hover:
- card zoom nhẹ
- nhấc lên
- rung/tilt rất ngắn
- ảnh bên trong zoom nhẹ hơn

Click:
- mở popup profile nhỏ
- tên
- phiên âm Nhật
- romaji
- X / YouTube / TikTok
- câu giới thiệu
- ngày sinh
- sở thích
- màu chủ đạo

ĐỂ NHẬP THÔNG TIN THẬT:
Mở script.js và sửa object "memberProfiles".

Ví dụ:
vani: {
  name: "Vani",
  japanese: "ヴァニ",
  romaji: "Vani",
  quote: "Hello, mình là Vani...",
  birthday: "12/03",
  hobby: "Hát, game, ...",
  color: "#F9CDD4",
  colorName: "#F9CDD4",
  image: "assets/members/vani.jpg",
  x: "https://x.com/...",
  youtube: "https://youtube.com/...",
  tiktok: "https://tiktok.com/@..."
}

LƯU Ý:
Các phiên âm Nhật hiện tại chỉ là giá trị mẫu để bố cục hoạt động.
Có thể sửa tự do trong script.js.


V5 - SOCIAL ICON IMAGES
-----------------------
Các nút X / YouTube / TikTok đã đổi từ chữ sang ảnh icon.

Icon nằm tại:
assets/icons/x.svg
assets/icons/youtube.svg
assets/icons/tiktok.svg
assets/icons/facebook.svg
assets/icons/discord.svg

Đã áp dụng cho:
- header
- popup member
- Contact trên trang chủ

Nếu muốn đổi icon khác, chỉ cần thay file SVG cùng tên.


V6 - LANGUAGE SYSTEM
--------------------
3 ngôn ngữ:
- VI = Tiếng Việt (mặc định)
- EN = English
- JP = 日本語

Nút chuyển ngôn ngữ nằm trên header.

Cơ chế:
- đổi ngôn ngữ ngay lập tức, không reload trang
- nhớ lựa chọn bằng localStorage
- chuyển trang vẫn giữ nguyên ngôn ngữ đã chọn
- popup member cũng đổi câu giới thiệu / sở thích theo ngôn ngữ

File dịch:
script.js -> const translations = { ... }

Tiếng Việt là bản gốc.
Các bản EN/JP hiện đã được viết sẵn cho toàn bộ nội dung hiện có.

LƯU Ý VỀ "TỰ DỊCH":
Website hiện là static site nên không gọi Google Translate/OpenAI hay dịch máy bên ngoài.
Cách này nhanh, miễn phí, không cần API key và không bị lỗi CORS/quota.
Nếu sau này thêm nội dung mới, thêm key vào object translations trong script.js.
Nếu muốn nhập tiếng Việt mới và để website gọi AI dịch tự động thật sự, cần thêm backend/API translation riêng.


V7 - FAVICON / TAB ICON
-----------------------
Đã thêm favicon cho tab trình duyệt để thay icon hình trái đất mặc định.

File đang dùng:
- assets/favicon.svg
- assets/favicon.png

Nếu muốn đổi sang logo RƎ:ALYZE khác:
1. thay assets/favicon.svg hoặc assets/favicon.png
2. giữ nguyên tên file là được

HTML đã được thêm sẵn:
<link rel="icon" type="image/svg+xml" href="assets/favicon.svg">
<link rel="alternate icon" type="image/png" href="assets/favicon.png">


V8 - CUSTOM LOGO
----------------
Đã thay logo bằng ảnh bạn gửi.

Áp dụng cho:
- icon tab trình duyệt (favicon)
- logo ở header
- logo ở footer

File chính:
- assets/realyze-logo.png
- assets/favicon.png
- assets/favicon-32.png

Mình đã tự tách nền xám nhạt khỏi logo để dùng trên web.
Nếu muốn thay logo khác sau này, chỉ cần thay:
- assets/realyze-logo.png
- assets/favicon.png
- assets/favicon-32.png


V9 - ADMIN CMS
==============
Website không còn cần sửa code để cập nhật News / Music / Rule.

TRANG ADMIN
- admin.html
- Login bằng Supabase Auth email/password
- Chỉ user có trong bảng site_admins mới truy cập được

NEWS
- tiêu đề VI/EN/JP
- ngày đăng
- ảnh
- rich text nội dung
- Draft / Published
- click News ngoài trang chủ -> news-detail.html
- News detail hiển thị ảnh + ngày + tiêu đề + nội dung

MUSIC
- tên bài hát
- người hát
- ngày ra mắt
- ảnh
- link bài hát / YouTube
- mô tả VI/EN/JP
- Draft / Published

RULE
- tiêu đề VI/EN/JP
- thứ tự
- trình soạn thảo rich text
- H1 / H2 / H3 / P
- Bold / Italic
- bullet list / numbered list / quote
- Draft / Published

SUPABASE SETUP
1. Tạo project Supabase.
2. Chạy supabase-schema.sql trong SQL Editor.
3. Điền Project URL + anon key vào supabase-config.js.
4. Authentication > Users > Add user.
5. Copy UUID user.
6. Chạy:
   insert into public.site_admins(user_id)
   values ('UUID_CUA_AUTH_USER');
7. Mở admin.html và đăng nhập.

ẢNH
Admin upload ảnh lên bucket public "cms-media".

NGÔN NGỮ
Public content có VI / EN / JP.
Nếu EN/JP để trống, website fallback về tiếng Việt.
Việc tự dịch AI thực sự cho nội dung mới có thể thêm ở bước sau bằng Edge Function / Translation API.
