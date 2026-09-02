document.addEventListener("DOMContentLoaded", function () {

    // ===== CHUYỂN TRANG =====

    const buttons = document.querySelectorAll("[data-page]");
    const pages = document.querySelectorAll(".page");

    buttons.forEach(function (button) {

        button.addEventListener("click", function () {

            const target = this.getAttribute("data-page");

            pages.forEach(function (page) {
                page.classList.remove("active");
            });

            const targetPage = document.getElementById(target);

            if (targetPage) {
                targetPage.classList.add("active");
                window.scrollTo(0, 0);
            }

        });

    });

    // ===== LYRICS =====

// ===== LYRICS =====

const lyricsButtons = document.querySelectorAll(".lyrics-button");

lyricsButtons.forEach(function (button) {

    button.addEventListener("click", function () {

        const song = this.closest(".song");
        const lyricsBox = song.querySelector(".lyrics-content");

        // Nếu đang mở thì đóng
        if (song.classList.contains("lyrics-open")) {

            song.classList.remove("lyrics-open");
            this.textContent = "LYRICS";

            return;
        }

        // Lấy đường dẫn file TXT
        const file = this.getAttribute("data-lyrics");

        fetch(file)
            .then(function (response) {

                if (!response.ok) {
                    throw new Error("Không tìm thấy file lyrics");
                }

                return response.text();

            })
            .then(function (lyrics) {

                lyricsBox.textContent = lyrics;

                song.classList.add("lyrics-open");

                button.textContent = "HIDE LYRICS";

            })
            .catch(function (error) {

                console.error(error);

                lyricsBox.textContent =
                    "Không thể tải lyrics.";

                song.classList.add("lyrics-open");

            });

    });

});

    // ===== AUDIO =====

    const audio = document.getElementById("audio");
    const playerButton = document.getElementById("player-button");
    const progress = document.getElementById("progress");
    const nowPlaying = document.getElementById("now-playing");

    let currentSong = "";


    // Nút PLAY của từng bài

    const playButtons = document.querySelectorAll(".play-button");

    playButtons.forEach(function (button) {

        button.addEventListener("click", function (event) {

            event.stopPropagation();

            const song = this.getAttribute("data-song");
            const songElement = this.closest(".song");

            const title = songElement
                .querySelector("h3")
                .textContent
                .trim();


            if (currentSong === song) {

                if (audio.paused) {
                    audio.play();
                } else {
                    audio.pause();
                }

                return;
            }


            currentSong = song;

            audio.src = song;
            audio.currentTime = 0;

            audio.play();

            nowPlaying.textContent = title;

        });

    });


    // PLAY / PAUSE

    playerButton.addEventListener("click", function () {

        if (!currentSong) {
            return;
        }

        if (audio.paused) {
            audio.play();
        } else {
            audio.pause();
        }

    });


    // Khi phát

    audio.addEventListener("play", function () {
        playerButton.textContent = "Ⅱ";
    });


    // Khi dừng

    audio.addEventListener("pause", function () {
        playerButton.textContent = "▶";
    });


    // Thanh tiến trình

    audio.addEventListener("timeupdate", function () {

        if (!audio.duration) {
            return;
        }

        progress.value =
            (audio.currentTime / audio.duration) * 100;

    });


    // Kéo thanh tiến trình

    progress.addEventListener("input", function () {

        if (!audio.duration) {
            return;
        }

        audio.currentTime =
            (this.value / 100) * audio.duration;

    });

});