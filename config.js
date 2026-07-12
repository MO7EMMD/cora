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
    },
    {
      id: "sample-semi",
      homeTeam: "البرازيل",
      awayTeam: "إسبانيا",
      status: "قريباً",
      score: "0 - 0",
      kickOff: "2026-07-17T19:00:00Z",
      venue: "استاد افتراضي",
      group: "نصف النهائي",
      sourceLabel: "بيانات تجريبية"
    }
  ],
  streams: {
    "sample-final": {
      type: "external",
      title: "شاهد من المنصة الرسمية",
      url: "https://www.plus.fifa.com/"
    },
    "sample-semi": {
      type: "embed",
      title: "استبدل هذا الرابط ببث مرخّص",
      embedUrl: "https://www.youtube.com/embed/jfKfPfyJRdk"
    }
  }
};
