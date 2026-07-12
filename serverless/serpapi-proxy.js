/**
 * وسيط آمن لاستدعاء SerpApi (Google Search) — Cloudflare Worker
 * ============================================================
 * لماذا هذا الملف ضروري؟
 * SerpApi لا يسمح باستدعائه مباشرة من كود المتصفح (لا يدعم CORS)، كما أن وضع
 * مفتاح API داخل ملفات موقع ثابت (مثل GitHub Pages) يعني أن أي زائر يستطيع
 * رؤيته وسرقته عبر "عرض المصدر". لذلك يجب أن يتم الاستدعاء من خادم صغير يحتفظ
 * بالمفتاح كسرّ، ثم يعيد للموقع فقط النتائج (بدون المفتاح). هذا الملف هو ذلك
 * الخادم الصغير، جاهز للنشر المجاني على Cloudflare Workers خلال دقائق.
 *
 * خطوات النشر (مجانية بالكامل):
 * 1) أنشئ حساباً على https://dash.cloudflare.com (مجاني).
 * 2) من القائمة الجانبية: Workers & Pages → Create → Create Worker.
 * 3) اختر اسماً (مثال: serpapi-proxy) ثم Deploy.
 * 4) بعد الإنشاء، اضغط "Edit code" والصق محتوى هذا الملف بالكامل، ثم Save and Deploy.
 * 5) اذهب إلى Settings → Variables and Secrets → Add:
 *      الاسم: SERPAPI_KEY
 *      القيمة: مفتاحك من https://serpapi.com/manage-api-key (Encrypt/Secret).
 * 6) في نفس الإعدادات، أضف متغيّراً غير سرّي:
 *      الاسم: ALLOWED_ORIGIN
 *      القيمة: https://mo7emmd.github.io  (نطاق موقعك — بدون شرطة مائلة في النهاية)
 * 7) انسخ رابط الـ Worker النهائي (مثال: https://serpapi-proxy.YOUR-SUBDOMAIN.workers.dev)
 *    وضعه في config.js داخل newsSearch.proxyUrl، ثم اجعل newsSearch.enabled = true.
 *
 * هذا الوسيط لا يفعل شيئاً سوى: يستقبل كلمة البحث → يستدعي SerpApi بمفتاحك
 * السرّي → يعيد فقط العنوان والرابط والمقتطف لكل نتيجة (بدون أي بيانات حساسة).
 */

export default {
  async fetch(request, env) {
    const allowedOrigin = env.ALLOWED_ORIGIN || "https://mo7emmd.github.io";
    const requestOrigin = request.headers.get("Origin") || "";
    const originIsAllowed = requestOrigin === allowedOrigin;

    const corsHeaders = {
      "Access-Control-Allow-Origin": originIsAllowed ? requestOrigin : allowedOrigin,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "GET") {
      return json({ error: "method_not_allowed" }, 405, corsHeaders);
    }

    if (!env.SERPAPI_KEY) {
      return json({ error: "missing_serpapi_key_secret" }, 500, corsHeaders);
    }

    const requestUrl = new URL(request.url);
    const query = (requestUrl.searchParams.get("q") || "FIFA World Cup news").slice(0, 120);

    const serpApiUrl = new URL("https://serpapi.com/search.json");
    serpApiUrl.searchParams.set("engine", "google");
    serpApiUrl.searchParams.set("q", query);
    serpApiUrl.searchParams.set("num", "8");
    serpApiUrl.searchParams.set("hl", "ar");
    serpApiUrl.searchParams.set("api_key", env.SERPAPI_KEY);

    try {
      const upstream = await fetch(serpApiUrl.toString());
      if (!upstream.ok) {
        return json({ error: "serpapi_upstream_error", status: upstream.status }, 502, corsHeaders);
      }

      const data = await upstream.json();
      const results = (data.organic_results || []).slice(0, 8).map((item) => ({
        title: item.title || "",
        link: item.link || "",
        snippet: item.snippet || "",
        source: item.source || (item.displayed_link || "")
      }));

      return json({ results }, 200, { ...corsHeaders, "Cache-Control": "public, max-age=300" });
    } catch (error) {
      return json({ error: "proxy_exception" }, 500, corsHeaders);
    }
  }
};

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json; charset=utf-8" }
  });
}
