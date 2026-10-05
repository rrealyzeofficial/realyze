import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type",
  "Access-Control-Allow-Methods":
    "POST, OPTIONS"
};

function json(
  value: unknown,
  status = 200
) {
  return new Response(
    JSON.stringify(value),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type":
          "application/json; charset=utf-8"
      }
    }
  );
}

function cleanText(
  value: unknown
) {
  return String(
    value ?? ""
  )
    .replace(/\u0000/g, "")
    .trim();
}

Deno.serve(
  async (req) => {
    if (req.method === "OPTIONS") {
      return new Response(
        "ok",
        {
          headers:
            corsHeaders
        }
      );
    }

    if (req.method !== "POST") {
      return json(
        {
          error:
            "Method not allowed"
        },
        405
      );
    }

    try {
      const body =
        await req.json();

      const senderName =
        cleanText(
          body?.sender_name
        );

      const content =
        cleanText(
          body?.content
        );

      const captchaToken =
        cleanText(
          body?.captcha_token
        );

      const honeypot =
        cleanText(
          body?.website
        );

      const language =
        ["vi","en","ja"]
          .includes(
            body?.language
          )
          ? body.language
          : null;

      // Hidden field should stay empty.
      if (honeypot) {
        return json(
          {
            ok: true
          }
        );
      }

      if (
        !senderName ||
        senderName.length > 80 ||
        !content ||
        content.length > 3000
      ) {
        return json(
          {
            error:
              "Invalid message.",
            code:
              "INVALID_INPUT"
          },
          400
        );
      }

      if (!captchaToken) {
        return json(
          {
            error:
              "CAPTCHA required.",
            code:
              "CAPTCHA_FAILED"
          },
          400
        );
      }

      const turnstileSecret =
        Deno.env.get(
          "TURNSTILE_SECRET_KEY"
        );

      if (!turnstileSecret) {
        return json(
          {
            error:
              "TURNSTILE_SECRET_KEY is missing.",
            code:
              "SERVER_CONFIG"
          },
          500
        );
      }

      const verifyForm =
        new URLSearchParams();

      verifyForm.set(
        "secret",
        turnstileSecret
      );

      verifyForm.set(
        "response",
        captchaToken
      );

      const clientIp =
        req.headers.get(
          "cf-connecting-ip"
        ) ||
        req.headers.get(
          "x-forwarded-for"
        )
          ?.split(",")[0]
          ?.trim();

      if (clientIp) {
        verifyForm.set(
          "remoteip",
          clientIp
        );
      }

      const verifyResponse =
        await fetch(
          "https://challenges.cloudflare.com/turnstile/v0/siteverify",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/x-www-form-urlencoded"
            },
            body:
              verifyForm.toString()
          }
        );

      const verification =
        await verifyResponse.json();

      if (
        !verifyResponse.ok ||
        verification?.success !== true
      ) {
        return json(
          {
            error:
              "CAPTCHA verification failed.",
            code:
              "CAPTCHA_FAILED"
          },
          400
        );
      }

      const supabaseUrl =
        Deno.env.get(
          "SUPABASE_URL"
        );

      const serviceRole =
        Deno.env.get(
          "SUPABASE_SERVICE_ROLE_KEY"
        );

      if (
        !supabaseUrl ||
        !serviceRole
      ) {
        return json(
          {
            error:
              "Supabase server secrets are missing.",
            code:
              "SERVER_CONFIG"
          },
          500
        );
      }

      const insertResponse =
        await fetch(
          supabaseUrl +
            "/rest/v1/site_letters",
          {
            method: "POST",
            headers: {
              apikey:
                serviceRole,
              Authorization:
                "Bearer " +
                serviceRole,
              "Content-Type":
                "application/json",
              Prefer:
                "return=minimal"
            },
            body:
              JSON.stringify({
                sender_name:
                  senderName,
                content:
                  content,
                language:
                  language,
                is_read:
                  false
              })
          }
        );

      if (!insertResponse.ok) {
        const detail =
          await insertResponse
            .text();

        console.error(
          "site_letters insert:",
          detail
        );

        return json(
          {
            error:
              "Could not save message.",
            code:
              "DATABASE_ERROR"
          },
          500
        );
      }

      return json({
        ok: true
      });

    } catch (error) {
      console.error(
        "submit-letter:",
        error
      );

      return json(
        {
          error:
            error instanceof Error
              ? error.message
              : String(error),
          code:
            "SERVER_ERROR"
        },
        500
      );
    }
  }
);
