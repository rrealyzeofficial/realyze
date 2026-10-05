(function () {
  "use strict";

  const form =
    document.getElementById("letterForm");

  if (!form) return;

  const nameInput =
    document.getElementById("letterName");

  const contentInput =
    document.getElementById("letterContent");

  const honeypot =
    document.getElementById("letterWebsite");

  const submitButton =
    document.getElementById("letterSubmit");

  const statusBox =
    document.getElementById("letterStatus");

  const captchaHost =
    document.getElementById("letterCaptcha");

  const dialog =
    document.getElementById(
      "letterDialog"
    );

  const openButton =
    document.getElementById(
      "letterOpen"
    );

  const closeButton =
    document.getElementById(
      "letterClose"
    );

  function openLetterDialog() {
    if (!dialog) return;

    if (!dialog.open) {
      dialog.showModal();
    }

    setTimeout(
      function () {
        nameInput?.focus();
      },
      80
    );
  }

  function closeLetterDialog() {
    if (
      dialog &&
      dialog.open
    ) {
      dialog.close();
    }
  }

  openButton?.addEventListener(
    "click",
    openLetterDialog
  );

  closeButton?.addEventListener(
    "click",
    closeLetterDialog
  );

  dialog?.addEventListener(
    "click",
    function (event) {
      if (
        event.target === dialog
      ) {
        closeLetterDialog();
      }
    }
  );

  let captchaToken = "";
  let widgetId = null;
  let configCache = null;

  const messages = {
    vi: {
      captcha_setup:
        "CAPTCHA chưa được cấu hình.",
      captcha_required:
        "Hãy xác nhận bạn không phải robot.",
      invalid:
        "Hãy nhập tên và nội dung.",
      sending:
        "Đang gửi thư...",
      success:
        "✓ Thư đã được gửi đến RƎ:ALYZE.",
      failed:
        "Không gửi được thư. Vui lòng thử lại.",
      too_long:
        "Nội dung quá dài."
    },

    en: {
      captcha_setup:
        "CAPTCHA is not configured.",
      captcha_required:
        "Please confirm that you are not a robot.",
      invalid:
        "Please enter your name and message.",
      sending:
        "Sending...",
      success:
        "✓ Your letter has been sent to RƎ:ALYZE.",
      failed:
        "Could not send your letter. Please try again.",
      too_long:
        "Your message is too long."
    },

    ja: {
      captcha_setup:
        "CAPTCHAが設定されていません。",
      captcha_required:
        "ロボットではないことを確認してください。",
      invalid:
        "お名前とメッセージを入力してください。",
      sending:
        "送信中...",
      success:
        "✓ RƎ:ALYZEへメッセージを送信しました。",
      failed:
        "送信できませんでした。もう一度お試しください。",
      too_long:
        "メッセージが長すぎます。"
    }
  };

  function lang() {
    const value =
      localStorage.getItem(
        "realyze-language"
      ) || "vi";

    return messages[value]
      ? value
      : "vi";
  }

  function msg(key) {
    return (
      messages[lang()][key] ||
      messages.vi[key] ||
      ""
    );
  }

  function setStatus(
    text,
    type = ""
  ) {
    statusBox.textContent =
      text || "";

    statusBox.className =
      "letter-status" +
      (type
        ? " " + type
        : "");
  }

  async function loadSupabaseConfig() {
    if (configCache) {
      return configCache;
    }

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
        url:
          savedUrl.replace(
            /\/+$/,
            ""
          ),
        key: savedKey
      };

      return configCache;
    }

    if (location.protocol === "file:") {
      return null;
    }

    try {
      const response =
        await fetch(
          "./supabase-config.js?feedback=" +
            Date.now(),
          {
            cache: "no-store"
          }
        );

      if (!response.ok) {
        return null;
      }

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
        !urlMatch ||
        !keyMatch ||
        urlMatch[1].includes(
          "YOUR_"
        ) ||
        keyMatch[1].includes(
          "YOUR_"
        )
      ) {
        return null;
      }

      configCache = {
        url:
          urlMatch[1].replace(
            /\/+$/,
            ""
          ),
        key: keyMatch[1]
      };

      return configCache;

    } catch (error) {
      console.error(
        "Feedback config:",
        error
      );

      return null;
    }
  }

  function loadTurnstile() {
    const siteKey =
      window.REALYZE_FEEDBACK
        ?.turnstileSiteKey;

    if (
      !siteKey ||
      siteKey.includes(
        "YOUR_"
      )
    ) {
      setStatus(
        msg("captcha_setup"),
        "error"
      );

      submitButton.disabled = true;
      return;
    }

    function renderWidget() {
      if (
        !window.turnstile ||
        widgetId !== null
      ) {
        return;
      }

      const compact =
        window.matchMedia(
          "(max-width: 380px)"
        ).matches;

      widgetId =
        window.turnstile.render(
          captchaHost,
          {
            sitekey: siteKey,
            theme: "light",
            size:
              compact
                ? "compact"
                : "normal",
            language: "auto",

            callback:
              function (token) {
                captchaToken =
                  token || "";

                if (
                  statusBox.classList
                    .contains("error")
                ) {
                  setStatus("");
                }
              },

            "expired-callback":
              function () {
                captchaToken = "";
              },

            "error-callback":
              function () {
                captchaToken = "";

                setStatus(
                  msg(
                    "captcha_required"
                  ),
                  "error"
                );
              }
          }
        );
    }

    if (window.turnstile) {
      renderWidget();
      return;
    }

    const script =
      document.createElement(
        "script"
      );

    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

    script.async = true;
    script.defer = true;

    script.onload =
      renderWidget;

    script.onerror =
      function () {
        setStatus(
          msg("captcha_setup"),
          "error"
        );
      };

    document.head.appendChild(
      script
    );
  }

  async function submitLetter(
    payload
  ) {
    const config =
      await loadSupabaseConfig();

    if (!config) {
      throw new Error(
        "SUPABASE_CONFIG"
      );
    }

    const response =
      await fetch(
        config.url +
          "/functions/v1/submit-letter",
        {
          method: "POST",
          headers: {
            apikey: config.key,
            Authorization:
              "Bearer " +
              config.key,
            "Content-Type":
              "application/json"
          },
          body:
            JSON.stringify(
              payload
            )
        }
      );

    const raw =
      await response.text();

    let data = null;

    if (raw) {
      try {
        data =
          JSON.parse(raw);
      } catch {
        data = null;
      }
    }

    if (!response.ok) {
      const error =
        new Error(
          data?.error ||
          "SUBMIT_FAILED"
        );

      error.code =
        data?.code || "";

      throw error;
    }

    return data;
  }

  form.addEventListener(
    "submit",
    async function (event) {
      event.preventDefault();

      const senderName =
        nameInput.value.trim();

      const content =
        contentInput.value.trim();

      if (
        !senderName ||
        !content
      ) {
        setStatus(
          msg("invalid"),
          "error"
        );
        return;
      }

      if (
        senderName.length > 80 ||
        content.length > 3000
      ) {
        setStatus(
          msg("too_long"),
          "error"
        );
        return;
      }

      if (!captchaToken) {
        setStatus(
          msg("captcha_required"),
          "error"
        );
        return;
      }

      submitButton.disabled = true;

      setStatus(
        msg("sending"),
        "sending"
      );

      try {
        await submitLetter({
          sender_name:
            senderName,

          content:
            content,

          captcha_token:
            captchaToken,

          website:
            honeypot.value || "",

          language:
            lang()
        });

        form.reset();

        captchaToken = "";

        if (
          window.turnstile &&
          widgetId !== null
        ) {
          window.turnstile.reset(
            widgetId
          );
        }

        setStatus(
          msg("success"),
          "success"
        );

        setTimeout(
          function () {
            closeLetterDialog();
            setStatus("");
          },
          1200
        );

      } catch (error) {
        console.error(
          "Letter submit:",
          error
        );

        if (
          error.code ===
          "CAPTCHA_FAILED"
        ) {
          captchaToken = "";

          if (
            window.turnstile &&
            widgetId !== null
          ) {
            window.turnstile.reset(
              widgetId
            );
          }

          setStatus(
            msg(
              "captcha_required"
            ),
            "error"
          );

        } else {
          setStatus(
            msg("failed"),
            "error"
          );
        }

      } finally {
        submitButton.disabled =
          false;
      }
    }
  );

  document.addEventListener(
    "realyze-language-changed",
    function () {
      if (
        statusBox.textContent
      ) {
        setStatus("");
      }
    }
  );

  loadTurnstile();

  const urlParams =
    new URLSearchParams(
      location.search
    );

  if (
    urlParams.get("letter") === "1"
  ) {
    setTimeout(
      function () {
        openLetterDialog();

        try {
          const cleanUrl =
            new URL(
              location.href
            );

          cleanUrl.searchParams.delete(
            "letter"
          );

          history.replaceState(
            null,
            "",
            cleanUrl.pathname +
              cleanUrl.search +
              cleanUrl.hash
          );
        } catch {}
      },
      180
    );
  }
})();
