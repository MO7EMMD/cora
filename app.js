const config = window.WORLD_CUP_CONFIG || {};

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
  refreshButton: document.getElementById("refreshButton")
};

async function fetchMatches() {
  const provider = config.dataProvider || {};
  const baseUrl = provider.baseUrl || "";
  const endpoint = provider.endpoint || "";

  if (!baseUrl || !endpoint || provider.apiKey === "YOUR_API_KEY") {
    return normalizeMatches(config.fallbackMatches || [], "البيانات التجريبية");
  }

  const url = buildProviderUrl(provider);
  const response = await fetch(url, {
    headers: provider.requestHeaders || {}
  });

  if (!response.ok) {
    throw new Error(`Unable to load matches: ${response.status}`);
  }

  const payload = await response.json();
  return adaptProviderPayload(payload, provider);
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
      setFeaturedMatch(match);
      renderPlayer(match);
    });

    elements.matchesGrid.appendChild(card);

    if (index === 0) {
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

  if (!stream) {
    elements.playerFrame.className = "player-frame empty-state";
    elements.playerFrame.innerHTML = `
      <div>
        <p class="empty-title">لا يوجد بث مرخّص لهذه المباراة</p>
        <p class="muted">أضف رابطاً رسمياً داخل config.js لعرضه هنا.</p>
      </div>
    `;
    setStreamStatus("لا يوجد بث محدد", "neutral");
    return;
  }

  if (stream.type === "embed") {
    elements.playerFrame.className = "player-frame";
    elements.playerFrame.innerHTML = `<iframe src="${escapeAttribute(stream.embedUrl)}" title="${escapeAttribute(stream.title || "البث المرخّص")}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
    setStreamStatus(stream.title || "بث مضمن مرخّص", "live");
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
    setStreamStatus(stream.title || "بث فيديو مرخّص", "live");
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
    setStreamStatus("يفتح في موقع رسمي خارجي", "external");
    return;
  }

  elements.playerFrame.className = "player-frame empty-state";
  elements.playerFrame.innerHTML = `
    <div>
      <p class="empty-title">نوع البث غير مدعوم</p>
      <p class="muted">استخدم embed أو video أو external داخل ملف الإعدادات.</p>
    </div>
  `;
  setStreamStatus("صيغة بث غير معروفة", "neutral");
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

elements.refreshButton.addEventListener("click", loadMatches);
loadMatches();
