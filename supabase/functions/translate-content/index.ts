const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        error: "Method not allowed"
      }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  }

  try {
    const apiKey =
      Deno.env.get("DEEPL_API_KEY");

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error:
            "DEEPL_API_KEY is not configured."
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        }
      );
    }

    const apiUrl =
      Deno.env.get("DEEPL_API_URL") ||
      "https://api-free.deepl.com/v2/translate";

    const payload = await req.json();

    const texts =
      Array.isArray(payload?.texts)
        ? payload.texts
        : [];

    const requestedTarget =
      String(payload?.target || "")
        .toUpperCase();

    const target =
      requestedTarget === "EN"
        ? "EN-US"
        : requestedTarget === "JA"
        ? "JA"
        : "";

    if (!texts.length || !target) {
      return new Response(
        JSON.stringify({
          error:
            "texts[] and target EN/JA are required."
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        }
      );
    }

    const form =
      new URLSearchParams();

    for (const text of texts) {
      form.append(
        "text",
        String(text ?? "")
      );
    }

    form.set("source_lang", "VI");
    form.set("target_lang", target);

    // Keeps <h1>, <p>, <strong>, lists, etc.
    form.set("tag_handling", "html");
    form.set("preserve_formatting", "1");

    const deeplResponse =
      await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization:
            "DeepL-Auth-Key " + apiKey,
          "Content-Type":
            "application/x-www-form-urlencoded"
        },
        body: form.toString()
      });

    const result =
      await deeplResponse.json();

    if (!deeplResponse.ok) {
      return new Response(
        JSON.stringify({
          error:
            result?.message ||
            "DeepL translation failed."
        }),
        {
          status: deeplResponse.status,
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json"
          }
        }
      );
    }

    const translations =
      (result.translations || [])
        .map((item) => item.text || "");

    return new Response(
      JSON.stringify({
        translations
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        error:
          error?.message ||
          String(error)
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  }
});
