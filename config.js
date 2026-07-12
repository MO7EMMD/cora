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
  // نظام التوكن + التشغيل المتكيّف (HLS.js) يشغّل فيديو حقيقياً على الموقع فعلياً.
  // ملاحظة مهمة: جربنا بثاً حياً حقيقياً (NASA TV) لكن خوادمه (Akamai) ترفض أي طلب
  // يحمل Referer من نطاق خارجي (حماية شائعة تطبّقها كل شبكات البث تقريباً)، لذلك تم
  // استبداله بعيّنة HLS.js الرسمية المخصصة للتشغيل التجريبي عبر النطاقات المختلفة.
  // هذه ليست مباراة كأس عالم حقيقية ولا بثاً تلفزيونياً حياً — إنها عيّنة تقنية فقط.
  liveDemoChannel: {
    id: "live-demo-channel",
    homeTeam: "عرض تقني حي",
    awayTeam: "اختبار تشغيل HLS فعلي",
    status: "قيد التشغيل",
    score: "—",
    kickOff: new Date().toISOString(),
    venue: "عيّنة HLS.js الرسمية (وليست بث تلفزيوني)",
    group: "تجربة تقنية — ليست مباراة",
    sourceLabel: "تشغيل حي فعلي"
  },
  streams: {
    "sample-final": {
      type: "external",
      title: "شاهد من المنصة الرسمية",
      url: "https://www.plus.fifa.com/"
    },
    "live-demo-channel": {
      type: "hls",
      title: "تشغيل HLS متكيّف فعلي (عيّنة رسمية من مشروع HLS.js) — أضف رابط بثك المرخّص لاستبدالها",
      videoUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
    }
    // مثال بث HLS لمباراتك الخاصة بجودة عالية وبدون تقطيع (يتطلب رابط m3u8 مرخّص فعلياً
    // ولا يمنع التضمين عبر Referer — تأكد من ذلك مع مزوّد البث):
    // "match-id": {
    //   type: "hls",
    //   title: "بث مباشر رسمي",
    //   videoUrl: "https://your-licensed-provider.example.com/live/stream.m3u8"
    // }
  }
};
