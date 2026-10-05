import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type",
  "Access-Control-Allow-Methods":
    "GET, OPTIONS"
};

const DEFAULT_HANDLE = "@realize-ent";

let cachedChannelId = "";
let cachedVideos: unknown[] = [];
let cachedAt = 0;

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
          "application/json; charset=utf-8",
        "Cache-Control":
          "public, max-age=45"
      }
    }
  );
}

function decodeXml(
  value = ""
) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(
      /&#(\d+);/g,
      (_, code) =>
        String.fromCodePoint(
          Number(code)
        )
    )
    .trim();
}

function firstMatch(
  source: string,
  patterns: RegExp[]
) {
  for (const pattern of patterns) {
    const match =
      source.match(pattern);

    if (match?.[1]) {
      return match[1];
    }
  }

  return "";
}

async function resolveChannelId() {
  const envId =
    Deno.env.get(
      "YOUTUBE_CHANNEL_ID"
    )?.trim();

  if (envId) {
    return envId;
  }

  if (cachedChannelId) {
    return cachedChannelId;
  }

  const handle =
    (
      Deno.env.get(
        "YOUTUBE_HANDLE"
      ) ||
      DEFAULT_HANDLE
    ).replace(/^\/+/, "");

  const pageUrl =
    "https://www.youtube.com/" +
    handle;

  const response =
    await fetch(
      pageUrl,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 R3ALYZE-Website/1.0",
          "Accept-Language":
            "en-US,en;q=0.8"
        }
      }
    );

  if (!response.ok) {
    throw new Error(
      "Cannot open YouTube channel page."
    );
  }

  const html =
    await response.text();

  const channelId =
    firstMatch(
      html,
      [
        /<meta[^>]+itemprop=["']channelId["'][^>]+content=["'](UC[a-zA-Z0-9_-]+)["']/i,
        /<meta[^>]+content=["'](UC[a-zA-Z0-9_-]+)["'][^>]+itemprop=["']channelId["']/i,
        /"externalId":"(UC[a-zA-Z0-9_-]+)"/,
        /"channelId":"(UC[a-zA-Z0-9_-]+)"/,
        /youtube\.com\/channel\/(UC[a-zA-Z0-9_-]+)/
      ]
    );

  if (!channelId) {
    throw new Error(
      "Cannot resolve YouTube channel ID. Add YOUTUBE_CHANNEL_ID in Edge Function Secrets."
    );
  }

  cachedChannelId =
    channelId;

  return channelId;
}

function parseEntries(
  xml: string
) {
  const entries =
    xml.match(
      /<entry>[\s\S]*?<\/entry>/g
    ) || [];

  return entries
    .map((entry) => {
      const videoId =
        firstMatch(
          entry,
          [
            /<yt:videoId>([^<]+)<\/yt:videoId>/,
            /<id>yt:video:([^<]+)<\/id>/
          ]
        );

      if (!videoId) {
        return null;
      }

      const title =
        decodeXml(
          firstMatch(
            entry,
            [
              /<title>([\s\S]*?)<\/title>/
            ]
          )
        );

      const link =
        decodeXml(
          firstMatch(
            entry,
            [
              /<link[^>]+rel=["']alternate["'][^>]+href=["']([^"']+)["']/i,
              /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']alternate["']/i
            ]
          )
        ) ||
        (
          "https://www.youtube.com/watch?v=" +
          videoId
        );

      const published =
        decodeXml(
          firstMatch(
            entry,
            [
              /<published>([^<]+)<\/published>/
            ]
          )
        );

      return {
        id: videoId,
        video_id: videoId,
        title,
        external_url: link,
        published_at: published,
        image_url:
          "https://i.ytimg.com/vi/" +
          videoId +
          "/hqdefault.jpg"
      };
    })
    .filter(Boolean)
    .slice(0, 3);
}

async function latestVideos() {
  const now =
    Date.now();

  // Avoid hitting YouTube repeatedly when many visitors
  // open the website at the same time.
  if (
    cachedVideos.length &&
    now - cachedAt < 45000
  ) {
    return cachedVideos;
  }

  const channelId =
    await resolveChannelId();

  const feedUrl =
    "https://www.youtube.com/feeds/videos.xml?channel_id=" +
    encodeURIComponent(
      channelId
    );

  const response =
    await fetch(
      feedUrl,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 R3ALYZE-Website/1.0"
        }
      }
    );

  if (!response.ok) {
    throw new Error(
      "Cannot load YouTube upload feed."
    );
  }

  const xml =
    await response.text();

  const videos =
    parseEntries(xml);

  cachedVideos =
    videos;

  cachedAt =
    now;

  return videos;
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

    if (req.method !== "GET") {
      return json(
        {
          error:
            "Method not allowed."
        },
        405
      );
    }

    try {
      const videos =
        await latestVideos();

      return json({
        channel:
          DEFAULT_HANDLE,
        videos
      });

    } catch (error) {
      return json(
        {
          error:
            error instanceof Error
              ? error.message
              : String(error)
        },
        500
      );
    }
  }
);
