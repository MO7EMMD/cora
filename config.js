window.WORLD_CUP_CONFIG = {
  siteName: "كأس العالم مباشر",
  timezone: "Asia/Riyadh",
  dataProvider: {
    type: "thesportsdb",
    // مفتاح تجريبي عام ومجاني من TheSportsDB (لا يحتاج تسجيل). للاستخدام الموسّع
    // احصل على مفتاح خاص من https://www.thesportsdb.com/api.php وضعه هنا.
    apiKey: "3",
    // api-football example:
    // type: "api-football",
    // baseUrl: "https://v3.football.api-sports.io",
    // endpoint: "/fixtures?league=1&season=2026",
    baseUrl: "https://www.thesportsdb.com/api/v1/json",
    endpoint: "/YOUR_API_KEY/eventsseason.php?id=4429&s=2022",
    competitionName: "FIFA World Cup",
    requestHeaders: {
      // "x-apisports-key": "YOUR_API_KEY"
    }
  },
  fallbackMatches: [
    {
      id: "sample-final",
      homeTeam: "الأرجنتين",
      awayTeam: "فرنسا",
      status: "مكتملة",
      score: "3 - 3",
      kickOff: "2026-07-19T20:00:00Z",
      venue: "ملعب نهائي كأس العالم",
      group: "النهائي",
      sourceLabel: "بيانات تجريبية"
    }
  ],
  // بطاقة ثابتة تظهر دائماً فوق قائمة المباريات (حقيقية كانت أو تجريبية) لإثبات أن
  // نظام التوكن + التشغيل المتكيّف (HLS.js) يعمل فعلياً بالفيديو الحي على الموقع.
  // هذه ليست مباراة كأس عالم حقيقية — إنها قناة تجريبية علنية ومرخّصة (NASA TV).
  liveDemoChannel: {
    id: "live-demo-channel",
    homeTeam: "قناة تجريبية حية",
    awayTeam: "اختبار تشغيل فعلي",
    status: "مباشر الآن",
    score: "—",
    kickOff: new Date().toISOString(),
    venue: "قناة عامة رسمية (NASA TV)",
    group: "تجربة تقنية مباشرة — ليست مباراة",
    sourceLabel: "بث حي حقيقي"
  },
  streams: {
    "sample-final": {
      type: "external",
      title: "شاهد من المنصة الرسمية",
      url: "https://www.plus.fifa.com/"
    },
    "live-demo-channel": {
      type: "hls",
      title: "بث مباشر فعلي (قناة NASA TV العامة) — لإثبات عمل نظام التوكن والتشغيل المتكيّف",
      videoUrl: "https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8"
    }
    // مثال بث HLS لمباراتك الخاصة بجودة عالية وبدون تقطيع (يتطلب رابط m3u8 مرخّص فعلياً):
    // "match-id": {
    //   type: "hls",
    //   title: "بث مباشر رسمي",
    //   videoUrl: "https://your-licensed-provider.example.com/live/stream.m3u8"
    // }
  }
};
