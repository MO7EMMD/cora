const config = window.WORLD_CUP_CONFIG || {};
let currentMatch = null;

const elements = {
  matchesGrid: document.getElementById("matchesGrid"),
  feedStatus: document.getElementById("feedStatus"),
  featuredTitle: document.getElementById("featuredTitle"),
  featuredMeta: document.getElementById("featuredMeta"),
  featuredStatus: document.getElementById("featuredStatus"),
  featuredScore: document.getElementById("featuredScore"),
  featuredSource: document.getElementById("featuredSource"),
  playerFrame: document.getElementById("playerFrame"),
  streamStatus: document.getElementById("streamStatus"),
  matchDetails: document.getElementById("matchDetails"),
  refreshButton: document.getElementById("refreshButton"),
  newsSection: document.getElementById("news"),
  newsGrid: document.getElementById("newsGrid"),
  newsStatus: document.getElementById("newsStatus")
};

async function fetchMatches() {
  const provider = config.dataProvider || {};
  const baseUrl = provider.baseUrl || "";
  const endpoint = provider.endpoint || "";

  if (!baseUrl || !endpoint || provider.apiKey === "YOUR_API_KEY") {
    return withLiveDemoChannel(normalizeMatches(config.fallbackMatches || [], "البيانات التجريبية"));
  }

  const url = buildProviderUrl(provider);
  const response = await fetch(url, {
    headers: provider.requestHeaders || {}
  });

  if (!response.ok) {
    throw new Error(`Unable to load matches: ${response.status}`);
  }

  const payload = await response.json();
  return withLiveDemoChannel(adaptProviderPayload(payload, provider));
}

function withLiveDemoChannel(matches) {
  if (!config.liveDemoChannel) return matches;
  const demo = normalizeMatches([config.liveDemoChannel], config.liveDemoChannel.sourceLabel);
  return [...demo, ...matches];
}

function buildProviderUrl(provider) {
  if (provider.type === "api-football") {
    return `${provider.baseUrl}${provider.endpoint}`;
  }

  const endpoint = provider.endpoint.replace("YOUR_API_KEY", provider.apiKey);
  return `${provider.baseUrl}${endpoint}`;
}

function adaptProviderPayload(payload, provider) {
  if (provider.type === "api-football") {
    return normalizeMatches(
      (payload.response || []).map((item) => ({
        id: String(item.fixture.id),
        homeTeam: item.teams.home.name,
        awayTeam: item.teams.away.name,
        status: item.fixture.status.short,
        score: `${item.goals.home ?? 0} - ${item.goals.away ?? 0}`,
        kickOff: item.fixture.date,
        venue: item.fixture.venue?.name || "غير محدد",
        group: item.league.round || provider.competitionName || "كأس العالم",
        sourceLabel: "API-Football"
      })),
      "API-Football"
    );
  }

  return normalizeMatches(
    (payload.events || []).map((item) => ({
      id: String(item.idEvent),
      homeTeam: item.strHomeTeam,
      awayTeam: item.strAwayTeam,
      status: deriveSportsDbStatus(item),
      score: `${item.intHomeScore ?? 0} - ${item.intAwayScore ?? 0}`,
      kickOff: `${item.dateEvent || ""}T${item.strTime || "00:00:00"}Z`,
      venue: item.strVenue || "غير محدد",
      group: item.strRound || provider.competitionName || "كأس العالم",
      sourceLabel: "TheSportsDB"
    })),
    "TheSportsDB"
  );
}

function deriveSportsDbStatus(item) {
  if (item.strStatus) return item.strStatus;
  if (item.intHomeScore !== null && item.intAwayScore !== null) return "مكتملة";
  return "قريباً";
}

function normalizeMatches(matches, sourceLabel) {
  return matches
    .filter((match) => match.homeTeam && match.awayTeam)
    .map((match) => ({
      id: String(match.id),
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      status: translateStatus(match.status),
      score: match.score || "0 - 0",
      kickOff: match.kickOff,
      venue: match.venue || "غير محدد",
      group: match.group || "كأس العالم",
      sourceLabel: match.sourceLabel || sourceLabel
    }))
    .sort((a, b) => new Date(a.kickOff) - new Date(b.kickOff));
}

function translateStatus(status) {
  const value = String(status || "").toUpperCase();
  const map = {
    NS: "قريباً",
    FT: "مكتملة",
    LIVE: "مباشر",
    HT: "استراحة",
    PST: "مؤجلة"
  };
  return map[value] || status || "غير معروف";
}

function getStreamForMatch(match) {
  return (config.streams || {})[match.id] || null;
}

function renderMatches(matches) {
  elements.matchesGrid.innerHTML = "";

  if (!matches.length) {
    elements.matchesGrid.innerHTML = `
      <div class="match-card">
        <p class="empty-title">لا توجد مباريات متاحة حالياً</p>
        <p class="muted">حدّث الإعدادات أو انتظر توفر البيانات من مزوّد المباريات.</p>
      </div>
    `;
    return;
  }

  matches.forEach((match, index) => {
    const stream = getStreamForMatch(match);
    const card = document.createElement("article");
    card.className = "match-card";
    card.innerHTML = `
      <header>
        <span>${escapeHtml(match.group)}</span>
        <span>${escapeHtml(match.status)}</span>
      </header>
      <div class="team-row">
        <strong>${escapeHtml(match.homeTeam)}</strong>
        <span class="score-chip">${escapeHtml(match.score)}</span>
        <strong>${escapeHtml(match.awayTeam)}</strong>
      </div>
      <div class="meta-row">
        <span>${formatKickOff(match.kickOff)}</span>
        <span>${escapeHtml(match.venue)}</span>
      </div>
      <div class="card-actions">
        <button class="card-button" type="button" data-match-id="${escapeHtml(match.id)}">شاهد الآن</button>
        ${stream && stream.type === "external" ? `<a class="card-link" target="_blank" rel="noreferrer" href="${escapeAttribute(stream.url)}">المنصة الرسمية</a>` : ""}
      </div>
    `;

    card.querySelector(".card-button").addEventListener("click", () => {
      currentMatch = match;
      setFeaturedMatch(match);
      renderPlayer(match);
    });

    elements.matchesGrid.appendChild(card);

    if (index === 0) {
      currentMatch = match;
      setFeaturedMatch(match);
      renderPlayer(match);
    }
  });
}

function setFeaturedMatch(match) {
  elements.featuredTitle.textContent = `${match.homeTeam} × ${match.awayTeam}`;
  elements.featuredMeta.textContent = `${match.group} • ${formatKickOff(match.kickOff)} • ${match.venue}`;
  elements.featuredStatus.textContent = match.status;
  elements.featuredScore.textContent = match.score;
  elements.featuredSource.textContent = match.sourceLabel;

  const details = [
    ["الفريقان", `${match.homeTeam} × ${match.awayTeam}`],
    ["الوقت", formatKickOff(match.kickOff)],
    ["الملعب", match.venue]
  ];

  elements.matchDetails.innerHTML = details
    .map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`)
    .join("");
}

function renderPlayer(match) {
  const stream = getStreamForMatch(match);
  const token = window.WCAuth.getViewerToken();

  if (!token) {
    elements.playerFrame.className = "player-frame empty-state";
    elements.playerFrame.innerHTML = `
      <div>
        <p class="empty-title">سجّل الدخول للحصول على توكن المشاهدة</p>
        <p class="muted">التوكن مجاني وفوري، ويثبت أن جلستك مصرّح لها بمشاهدة البث المرخّص.</p>
        <p><button class="btn btn-primary" type="button" id="playerLoginPrompt">تسجيل الدخول</button></p>
      </div>
    `;
    setStreamStatus("بانتظار توكن المشاهدة", "neutral");
    const promptBtn = document.getElementById("playerLoginPrompt");
    if (promptBtn) {
      promptBtn.addEventListener("click", () => {
        document.getElementById("loginNavBtn")?.click();
      });
    }
    return;
  }

  if (!stream) {
    elements.playerFrame.className = "player-frame empty-state";
    elements.playerFrame.innerHTML = `
      <div>
        <p class="empty-title">لا يوجد بث مرخّص لهذه المباراة</p>
        <p class="muted">أضف رابطاً رسمياً داخل config.js لعرضه هنا.</p>
      </div>
    `;
    setStreamStatus(`توكن نشط حتى ${formatTokenExpiry(token)}`, "neutral");
    return;
  }

  if (stream.type === "embed") {
    elements.playerFrame.className = "player-frame";
    elements.playerFrame.innerHTML = `<iframe src="${escapeAttribute(stream.embedUrl)}" title="${escapeAttribute(stream.title || "البث المرخّص")}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
    setStreamStatus(`${stream.title || "بث مضمن مرخّص"} • توكن حتى ${formatTokenExpiry(token)}`, "live");
    return;
  }

  if (stream.type === "hls") {
    elements.playerFrame.className = "player-frame";
    elements.playerFrame.innerHTML = `<video id="hlsVideo" controls playsinline autoplay muted></video>`;
    mountHlsPlayer(stream.videoUrl);
    setStreamStatus(`${stream.title || "بث مباشر متكيّف"} • توكن حتى ${formatTokenExpiry(token)}`, "live");
    return;
  }

  if (stream.type === "video") {
    elements.playerFrame.className = "player-frame";
    elements.playerFrame.innerHTML = `
      <video controls playsinline>
        <source src="${escapeAttribute(stream.videoUrl)}" type="${escapeAttribute(stream.mimeType || "application/x-mpegURL")}">
        المتصفح لا يدعم تشغيل هذا البث.
      </video>
    `;
    setStreamStatus(`${stream.title || "بث فيديو مرخّص"} • توكن حتى ${formatTokenExpiry(token)}`, "live");
    return;
  }

  if (stream.type === "external") {
    elements.playerFrame.className = "player-frame empty-state";
    elements.playerFrame.innerHTML = `
      <div>
        <p class="empty-title">${escapeHtml(stream.title || "شاهد من المصدر الرسمي")}</p>
        <p class="muted">هذا المزوّد لا يسمح بالتضمين داخل الموقع.</p>
        <p><a class="primary-button" target="_blank" rel="noreferrer" href="${escapeAttribute(stream.url)}">فتح المنصة الرسمية</a></p>
      </div>
    `;
    setStreamStatus(`يفتح في موقع رسمي خارجي • توكن حتى ${formatTokenExpiry(token)}`, "external");
    return;
  }

  elements.playerFrame.className = "player-frame empty-state";
  elements.playerFrame.innerHTML = `
    <div>
      <p class="empty-title">نوع البث غير مدعوم</p>
      <p class="muted">استخدم embed أو hls أو video أو external داخل ملف الإعدادات.</p>
    </div>
  `;
  setStreamStatus("صيغة بث غير معروفة", "neutral");
}

function formatTokenExpiry(token) {
  const date = new Date(token.expiresAt);
  return new Intl.DateTimeFormat("ar", {
    timeStyle: "short",
    timeZone: config.timezone || "UTC"
  }).format(date);
}

let activeHls = null;

function mountHlsPlayer(streamUrl) {
  const video = document.getElementById("hlsVideo");
  if (!video || !streamUrl) return;

  if (activeHls) {
    activeHls.destroy();
    activeHls = null;
  }

  // تشغيل متكيّف الجودة (Adaptive Bitrate) لتقليل التقطيع مقارنة بالتشغيل المباشر للرابط.
  if (window.Hls && window.Hls.isSupported()) {
    activeHls = new window.Hls({
      maxBufferLength: 30,
      maxMaxBufferLength: 60,
      liveSyncDurationCount: 3
    });
    activeHls.loadSource(streamUrl);
    activeHls.attachMedia(video);
    activeHls.on(window.Hls.Events.ERROR, (event, data) => {
      if (data.fatal) {
        setStreamStatus("حدث خطأ في البث المباشر، جارٍ إعادة المحاولة...", "neutral");
        activeHls.startLoad();
      }
    });
  } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = streamUrl;
  } else {
    setStreamStatus("المتصفح لا يدعم تشغيل هذا النوع من البث المباشر", "neutral");
  }
}

function setStreamStatus(text, kind) {
  elements.streamStatus.className = `status-pill ${kind}`;
  elements.streamStatus.textContent = text;
}

function formatKickOff(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "موعد غير محدد";

  return new Intl.DateTimeFormat("ar", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: config.timezone || "UTC"
  }).format(date);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

async function loadMatches() {
  elements.feedStatus.textContent = "جارٍ تحميل المباريات...";
  elements.refreshButton.disabled = true;

  try {
    const matches = await fetchMatches();
    renderMatches(matches);
    elements.feedStatus.textContent = `تم تحميل ${matches.length} مباراة.`;
  } catch (error) {
    renderMatches(normalizeMatches(config.fallbackMatches || [], "البيانات التجريبية"));
    elements.feedStatus.textContent = "تعذر الوصول إلى مزوّد البيانات، تم عرض البيانات التجريبية.";
  } finally {
    elements.refreshButton.disabled = false;
  }
}

// أخبار المباريات عبر SerpApi — تعمل فقط عند تفعيل newsSearch.enabled + proxyUrl
// في config.js (راجع serverless/serpapi-proxy.js للتفاصيل). لا يتم استدعاء SerpApi
// مباشرة من المتصفح إطلاقاً؛ يتم الاستدعاء عبر وسيط خادم يحمي مفتاح API.
async function loadMatchNews() {
  const newsConfig = config.newsSearch || {};
  if (!newsConfig.enabled || !newsConfig.proxyUrl) {
    elements.newsSection?.classList.add("hidden");
    return;
  }

  elements.newsSection.classList.remove("hidden");
  elements.newsStatus.textContent = "جارٍ تحميل الأخبار...";

  try {
    const requestUrl = new URL(newsConfig.proxyUrl);
    requestUrl.searchParams.set("q", newsConfig.query || "FIFA World Cup news");

    const response = await fetch(requestUrl.toString());
    if (!response.ok) throw new Error(`proxy_error_${response.status}`);

    const data = await response.json();
    const results = data.results || [];

    if (!results.length) {
      elements.newsGrid.innerHTML = "";
      elements.newsStatus.textContent = "لا توجد أخبار متاحة حالياً.";
      return;
    }

    elements.newsGrid.innerHTML = results
      .map(
        (item) => `
          <article class="news-card">
            <a href="${escapeAttribute(item.link)}" target="_blank" rel="noreferrer">${escapeHtml(item.title)}</a>
            <p>${escapeHtml(item.snippet || "")}</p>
            <span>${escapeHtml(item.source || "")}</span>
          </article>
        `
      )
      .join("");
    elements.newsStatus.textContent = `آخر تحديث: ${new Intl.DateTimeFormat("ar", { timeStyle: "short", timeZone: config.timezone || "UTC" }).format(new Date())}`;
  } catch (error) {
    elements.newsStatus.textContent = "تعذر تحميل الأخبار حالياً.";
  }
}

elements.refreshButton.addEventListener("click", loadMatches);
loadMatches();
loadMatchNews();
initAuthUI();

function rerenderPlayerForAuthChange() {
  if (currentMatch) renderPlayer(currentMatch);
}

function initAuthUI() {
  const guestActions = document.getElementById("guestActions");
  const userActions = document.getElementById("userActions");
  const userAvatar = document.getElementById("userAvatar");
  const userNameLabel = document.getElementById("userNameLabel");

  const overlay = document.getElementById("authOverlay");
  const closeBtn = document.getElementById("authClose");
  const tabLogin = document.getElementById("tabLogin");
  const tabSignup = document.getElementById("tabSignup");
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const loginError = document.getElementById("loginError");
  const signupError = document.getElementById("signupError");

  function refreshAuthUI() {
    const user = window.WCAuth.getCurrentUser();
    if (user) {
      guestActions.classList.add("hidden");
      userActions.classList.remove("hidden");
      userNameLabel.textContent = user.name;
      userAvatar.textContent = user.name.trim().charAt(0).toUpperCase() || "؟";
    } else {
      guestActions.classList.remove("hidden");
      userActions.classList.add("hidden");
    }
    rerenderPlayerForAuthChange();
  }

  function openModal(tab) {
    overlay.classList.remove("hidden");
    switchTab(tab);
  }

  function closeModal() {
    overlay.classList.add("hidden");
    loginError.classList.add("hidden");
    signupError.classList.add("hidden");
    loginForm.reset();
    signupForm.reset();
  }

  function switchTab(tab) {
    const isLogin = tab === "login";
    tabLogin.classList.toggle("active", isLogin);
    tabSignup.classList.toggle("active", !isLogin);
    loginForm.classList.toggle("hidden", !isLogin);
    signupForm.classList.toggle("hidden", isLogin);
  }

  document.getElementById("loginNavBtn").addEventListener("click", () => openModal("login"));
  document.getElementById("signupNavBtn").addEventListener("click", () => openModal("signup"));
  document.getElementById("heroSignupBtn").addEventListener("click", () => openModal("signup"));
  closeBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeModal();
  });

  tabLogin.addEventListener("click", () => switchTab("login"));
  tabSignup.addEventListener("click", () => switchTab("signup"));

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    loginError.classList.add("hidden");
    try {
      await window.WCAuth.login(
        document.getElementById("loginEmail").value,
        document.getElementById("loginPassword").value
      );
      refreshAuthUI();
      closeModal();
    } catch (error) {
      loginError.textContent = error.message;
      loginError.classList.remove("hidden");
    }
  });

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    signupError.classList.add("hidden");
    try {
      await window.WCAuth.signup(
        document.getElementById("signupName").value,
        document.getElementById("signupEmail").value,
        document.getElementById("signupPassword").value
      );
      refreshAuthUI();
      closeModal();
    } catch (error) {
      signupError.textContent = error.message;
      signupError.classList.remove("hidden");
    }
  });

  document.getElementById("logoutBtn").addEventListener("click", () => {
    window.WCAuth.logout();
    refreshAuthUI();
  });

  const navToggle = document.getElementById("navToggle");
  const navLinks = document.querySelector(".nav-links");
  navToggle.addEventListener("click", () => {
    navLinks.classList.toggle("show-mobile");
  });

  refreshAuthUI();
}
