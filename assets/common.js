// ════════════════════════════════════════════════
//  CONFIG — Prince API base URL
//  Dev:
//  Prod:
// ════════════════════════════════════════════════
const API_BASE = "https://api.princetechn.com";
const API_KEY = "prince";
function apiUrl(path) {
  const sep = path.includes("?") ? "&" : "?";
  return `${API_BASE}${path}${sep}apikey=${API_KEY}`;
}

// ── MATCH CACHE ──
const matchCache = {};
let _mkc = 0;
function cacheMatch(m) {
  const k = "mk" + _mkc++;
  matchCache[k] = m;
  return k;
}
function cacheStream(s) {
  const k = "sk" + _mkc++;
  matchCache[k] = s;
  return k;
}
function clearCache() {
  Object.keys(matchCache).forEach((k) => delete matchCache[k]);
  _mkc = 0;
}

// ── NEWS CACHE ──
const newsCache = {};
let _nkc = 0;
function cacheNews(n) {
  const k = "nk" + _nkc++;
  newsCache[k] = n;
  return k;
}

// ── HELPERS ──
function sportChip(sport) {
  const s = (sport || "").toLowerCase();
  const label =
    s === "football"
      ? "Football"
      : s === "basketball"
        ? "Basketball"
        : s === "tennis"
          ? "Tennis"
          : sport || "Sport";
  return `<span class="sport-chip ${s || "other"}">${label}</span>`;
}

function statusClass(status) {
  const s = (status || "").toLowerCase();
  if (
    s.includes("live") ||
    s.includes("1st") ||
    s.includes("2nd") ||
    (s.includes("half") && !s.includes("half time"))
  )
    return "live";
  if (
    s.includes("full") ||
    s.includes("ft") ||
    s.includes("ended") ||
    s.includes("finished")
  )
    return "ft";
  if (s.includes("half time") || s === "ht") return "ht";
  return "ns";
}

function isLive(status) {
  const s = (status || "").toLowerCase();
  return (
    s.includes("live") ||
    s.includes("1st") ||
    s.includes("2nd") ||
    s.includes("extra") ||
    s.includes("penalt") ||
    (s.includes("half") && !s.includes("half time"))
  );
}

function isFinished(status) {
  const s = (status || "").toLowerCase();
  return (
    s.includes("full") ||
    s.includes("ft") ||
    s.includes("ended") ||
    s.includes("finished")
  );
}

function teamInitials(name) {
  return (name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

function formatDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const mDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diff = Math.round((mDay - today) / 86400000);
    const time = d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    if (diff === 0) return "Today · " + time;
    if (diff === 1) return "Tomorrow · " + time;
    return (
      d.toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
      }) +
      " · " +
      time
    );
  } catch {
    return "";
  }
}

function formatMatchTime(date, time) {
  if (date && time) return date + " " + time;
  if (date) return date;
  return "";
}

function teamLogoHtml(logo, name) {
  const init = teamInitials(name);
  if (logo) {
    return `<img class="team-logo" src="${logo}" alt="${name}" loading="lazy"
      onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
      <div class="team-logo-placeholder" style="display:none">${init}</div>`;
  }
  return `<div class="team-logo-placeholder">${init}</div>`;
}

function skeletons(n, cls = "skel-card") {
  return Array(n).fill(`<div class="skeleton ${cls}"></div>`).join("");
}

function showBanner(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add("show");
  const span = el.querySelector("span");
  if (span) span.textContent = msg;
}
function hideBanner(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("show");
}

// ── BUILD MATCH CARD ──
function buildMatchCard(m, showWatch = false) {
  const key = cacheMatch(m);
  const live = isLive(m.status);
  const sc = statusClass(m.status);
  const home = m.homeTeam || "Home";
  const away = m.awayTeam || "Away";
  const hs = m.homeScore ?? "0";
  const as_ = m.awayScore ?? "0";
  const sport = m.sport || "football";
  const hasStream = showWatch && m.streams && m.streams.length > 0;

  let footer = "";
  if (hasStream) {
    const sk = cacheStream(m.streams[0]);
    footer = `
      <span class="match-time">${live ? '<i class="fas fa-circle" style="color:var(--accent);font-size:7px"></i> Live now' : m.startTime ? formatDate(m.startTime) : m.time || ""}</span>
      <button class="watch-btn" onclick="event.stopPropagation();openStreamForMatch('${key}','${sk}')"><i class="fas fa-play"></i> Watch</button>`;
  } else if (m.startTime) {
    footer = `<span class="match-time"><i class="fas fa-clock"></i>${formatDate(m.startTime)}</span><span></span>`;
  } else if (m.date || m.time) {
    footer = `<span class="match-time"><i class="fas fa-calendar"></i>${formatMatchTime(m.date, m.time)}</span><span></span>`;
  } else {
    footer = `<span></span><span></span>`;
  }

  return `
  <div class="match-card${live ? " live" : ""}" onclick="openMatchModal('${key}')">
    <div class="card-top">
      <span class="league-badge"><i class="fas fa-trophy" style="color:var(--primary)"></i>${m.league || "Unknown League"}</span>
      ${sportChip(sport)}
    </div>
    <div class="scoreboard">
      <div class="team">${teamLogoHtml(m.homeLogo, home)}<div class="team-name">${home}</div></div>
      <div class="vs-block">
        <div class="score">${hs}<span class="score-divider">–</span>${as_}</div>
        <span class="status-badge ${sc}">${live ? '<i class="fas fa-circle" style="font-size:6px;margin-right:3px"></i>' : ""}${m.status || "Unknown"}</span>
      </div>
      <div class="team">${teamLogoHtml(m.awayLogo, away)}<div class="team-name">${away}</div></div>
    </div>
    <div class="card-footer">${footer}</div>
  </div>`;
}

// ── NETFLIX PLAYER ENGINE ──
let _nfpTimer = null;
let _nfpVisible = true;

function nfpShowControls() {
  const top = document.getElementById("nfp-top");
  const bot = document.getElementById("nfp-bottom");
  const ctr = document.getElementById("nfp-center");
  if (top) top.classList.remove("nfp-hidden");
  if (bot) bot.classList.remove("nfp-hidden");
  if (ctr) ctr.classList.remove("nfp-hidden");
  _nfpVisible = true;
  clearTimeout(_nfpTimer);
  const v = document.getElementById("player-video");
  if (v && !v.paused) _nfpTimer = setTimeout(nfpHideControls, 3200);
}

function nfpHideControls() {
  const top = document.getElementById("nfp-top");
  const bot = document.getElementById("nfp-bottom");
  const ctr = document.getElementById("nfp-center");
  if (top) top.classList.add("nfp-hidden");
  if (bot) bot.classList.add("nfp-hidden");
  if (ctr) ctr.classList.add("nfp-hidden");
  _nfpVisible = false;
}

function nfpToggleControls() {
  if (_nfpVisible) {
    nfpHideControls();
  } else {
    nfpShowControls();
  }
}

// Global stream fallback queue — when one URL fails, auto-try the rest
window._streamFallbacks = [];

function openStreamByKey(sk) {
  const s = streamCache[sk];
  if (!s || !s.url) return;
  playStream(s.url, s.title || "Watch Live");
}

function openStreamForMatch(matchKey, streamKey) {
  const m = matchCache[matchKey];
  if (m && isFinished(m.status)) { showMatchEndedScreen(m); return; }
  const s = streamCache[streamKey];
  if (!s || !s.url) return;
  const all = (m && m.streams) || [];
  const idx = all.findIndex(st => st.url === s.url);
  window._streamFallbacks = all.filter((_, i) => i !== idx);
  playStream(s.url, s.title || "Watch Live");
}

function playStreamIfLive(matchKey, url, title, allStreams) {
  const m = matchCache[matchKey];
  if (m && isFinished(m.status)) { showMatchEndedScreen(m); return; }
  const all = allStreams || (m && m.streams) || [];
  window._streamFallbacks = all.filter(s => s.url !== url);
  playStream(url, title);
}

function showMatchEndedScreen(m) {
  try {
    sessionStorage.setItem("endedMatch", JSON.stringify(m));
  } catch {}
  window.location.href = "ended.html";
}

function playStream(url, title) {
  if (!url) return;
  const player = document.getElementById("player-modal");
  if (!player) {
    window.open(url, "_blank", "noopener");
    return;
  }

  const titleEl = document.getElementById("player-title");
  if (titleEl) titleEl.textContent = title || "Watch Live";

  const video = document.getElementById("player-video");
  const iframe = document.getElementById("player-iframe");
  const errMsg = document.getElementById("player-error");
  const qualBadge = document.getElementById("quality-badge");
  const bigBtn = document.querySelector(".nfp-big-btn");
  const loader = document.getElementById("player-loader");
  const loaderText = document.getElementById("loader-text");

  const _showLoader = (text) => {
    if (loader) loader.classList.add("show");
    if (loaderText) loaderText.textContent = text || "Loading stream…";
    if (errMsg) errMsg.classList.remove("show");
  };
  const _hideLoader = () => { if (loader) loader.classList.remove("show"); };
  // Track if this stream session actually produced video frames
  window._streamPlayed = false;

  if (video) {
    video.style.display = "none";
    video.src = "";
  }
  if (iframe) {
    iframe.style.display = "none";
    iframe.src = "";
  }
  if (errMsg) errMsg.classList.remove("show");
  _showLoader("Loading stream…");
  if (qualBadge) qualBadge.classList.remove("show");
  if (bigBtn) bigBtn.classList.remove("nfp-hidden");

  const pi = document.getElementById("play-icon");
  const bi = document.getElementById("big-play-icon");
  if (pi) pi.className = "fas fa-pause";
  if (bi) bi.className = "fas fa-pause";

  const isHLS = /\.m3u8|\.m3u(\?|$)/i.test(url);

  if (isHLS && video) {
    video.style.display = "block";
    if (qualBadge) {
      qualBadge.textContent = "Connecting…";
      qualBadge.classList.add("show");
    }

    const _showError = (played) => {
      _hideLoader();
      const ep = errMsg && errMsg.querySelector("p");
      const es = errMsg && errMsg.querySelector("small");
      if (ep) ep.textContent = played ? "Stream ended" : "Stream unavailable";
      if (es) es.textContent = played
        ? "The broadcast finished or lost connection. Try another stream from the list."
        : "No working stream found. All available links were tried — check back during a live match.";
      if (errMsg) errMsg.classList.add("show");
      if (qualBadge) qualBadge.classList.remove("show");
    };

    const _retryViaProxy = () => {
      if (window._stallTimer) { clearTimeout(window._stallTimer); window._stallTimer = null; }
      // If video is still actively playing, this is a false alarm — ignore it
      if (video && !video.paused && video.readyState >= 2 && video.currentTime > 0) return;
      // If stream played content before stopping, show "ended" message
      if (window._streamPlayed) { _showError(true); return; }
      // Stream never played — try next fallback silently
      if (window._streamFallbacks && window._streamFallbacks.length) {
        const next = window._streamFallbacks.shift();
        _showLoader("Trying another stream…");
        if (qualBadge) { qualBadge.textContent = "Trying next…"; qualBadge.classList.add("show"); }
        playStream(next.url, next.title || title);
        return;
      }
      // All fallbacks exhausted — show unavailable error
      _showError(false);
    };

    if (window.Hls && Hls.isSupported()) {
      if (window._hlsInst) {
        window._hlsInst.destroy();
        window._hlsInst = null;
      }
      if (window._stallTimer) {
        clearTimeout(window._stallTimer);
        window._stallTimer = null;
      }

      const hls = new Hls({
        maxBufferLength: 30,
        enableWorker: true,
        fragLoadingMaxRetry: 4,
        fragLoadingRetryDelay: 1000,
        levelLoadingMaxRetry: 3,
        manifestLoadingMaxRetry: 2,
      });
      window._hlsInst = hls;
      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
        if (qualBadge) {
          qualBadge.textContent = "HLS";
          qualBadge.classList.add("show");
        }
        window._stallTimer = setTimeout(_retryViaProxy, 15000);
        // Lock screen / notification bar media controls
        if ("mediaSession" in navigator) {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: title || "MatchZone Live",
            artist: "MatchZone",
            artwork: [{ src: "/matchzone/assets/og-preview.png", sizes: "512x512", type: "image/png" }],
          });
          navigator.mediaSession.setActionHandler("play", () => video.play().catch(() => {}));
          navigator.mediaSession.setActionHandler("pause", () => video.pause());
          navigator.mediaSession.setActionHandler("stop", () => closePlayer());
        }
      });

      const _onFirstFrame = () => {
        if (window._stallTimer) {
          clearTimeout(window._stallTimer);
          window._stallTimer = null;
        }
        window._streamPlayed = true;
        _hideLoader();
        video.removeEventListener("timeupdate", _onFirstFrame);
      };
      video.addEventListener("timeupdate", _onFirstFrame);

      hls.on(Hls.Events.ERROR, (_, d) => {
        if (d.fatal) {
          if (window._stallTimer) {
            clearTimeout(window._stallTimer);
            window._stallTimer = null;
          }
          const httpStatus = d.response && d.response.code;
          if (httpStatus === 403) {
            // 403 Forbidden = stream access denied / ended
            _showError(true);
          } else {
            _retryViaProxy();
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
      video.play().catch(() => {});
      if (qualBadge) {
        qualBadge.textContent = "HLS";
        qualBadge.classList.add("show");
      }
      window._stallTimer = setTimeout(_retryViaProxy, 15000);
      video.addEventListener("timeupdate", function _c() {
        clearTimeout(window._stallTimer);
        window._stallTimer = null;
        window._streamPlayed = true;
        _hideLoader();
        video.removeEventListener("timeupdate", _c);
      });
    }
  } else if (iframe) {
    iframe.src = url;
    iframe.style.display = "block";
    iframe.onload = () => _hideLoader();
    setTimeout(() => _hideLoader(), 6000);
  }

  player.classList.add("open");
  document.body.style.overflow = "hidden";
  nfpShowControls();
}

function closePlayer() {
  const player = document.getElementById("player-modal");
  if (player) player.classList.remove("open");
  const video = document.getElementById("player-video");
  if (video) {
    video.pause();
    video.src = "";
  }
  const iframe = document.getElementById("player-iframe");
  if (iframe) iframe.src = "";
  if (window._hlsInst) {
    window._hlsInst.destroy();
    window._hlsInst = null;
  }
  if (window._stallTimer) {
    clearTimeout(window._stallTimer);
    window._stallTimer = null;
  }
  if (document.pictureInPictureElement)
    document.exitPictureInPicture().catch(() => {});
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  clearTimeout(_nfpTimer);
  document.body.style.overflow = "";
}

function togglePlayPause() {
  const v = document.getElementById("player-video");
  if (!v || v.style.display === "none") return;
  if (v.paused) {
    v.play();
  } else {
    v.pause();
  }
  nfpShowControls();
}

function toggleMute() {
  const v = document.getElementById("player-video");
  const icon = document.getElementById("vol-icon");
  const slider = document.getElementById("vol-slider");
  if (!v) return;
  v.muted = !v.muted;
  if (v.muted) {
    if (icon) icon.className = "fas fa-volume-mute";
    if (slider) slider.value = 0;
  } else {
    const vol = parseFloat(slider?.value || 1);
    if (icon)
      icon.className =
        vol > 0.5
          ? "fas fa-volume-up"
          : vol > 0
            ? "fas fa-volume-down"
            : "fas fa-volume-mute";
    if (slider) slider.value = vol || 1;
  }
  nfpShowControls();
}

function setVolume(val) {
  const v = document.getElementById("player-video");
  const icon = document.getElementById("vol-icon");
  if (!v) return;
  const f = parseFloat(val);
  v.volume = f;
  v.muted = f === 0;
  if (icon)
    icon.className =
      f > 0.5
        ? "fas fa-volume-up"
        : f > 0
          ? "fas fa-volume-down"
          : "fas fa-volume-mute";
}

async function togglePiP() {
  const v = document.getElementById("player-video");
  if (!v || v.style.display === "none") return;
  const pipBtns = document.querySelectorAll(".nfp-pip-btn");
  const setPipActive = (on) =>
    pipBtns.forEach((b) => b.classList.toggle("pip-active", on));
  try {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
      setPipActive(false);
    } else if (v.readyState >= 1) {
      await v.requestPictureInPicture();
      setPipActive(true);
    } else {
      v.addEventListener(
        "loadedmetadata",
        async () => {
          try {
            await v.requestPictureInPicture();
            setPipActive(true);
          } catch {}
        },
        { once: true },
      );
    }
  } catch (e) {
    console.warn("PiP not supported", e);
  }
}

function toggleFullscreen() {
  const player = document.getElementById("player-modal");
  const icon = document.getElementById("fs-icon");
  if (!document.fullscreenElement) {
    (player || document.documentElement).requestFullscreen?.();
    if (icon) icon.className = "fas fa-compress";
  } else {
    document.exitFullscreen?.();
    if (icon) icon.className = "fas fa-expand";
  }
}

// ── MATCH MODAL ──
function openMatchModal(key) {
  const m = matchCache[key];
  if (!m) return;
  const live = isLive(m.status);
  const sc = statusClass(m.status);
  const bg = document.getElementById("match-modal");
  if (!bg) return;

  document.getElementById("modal-title").textContent =
    `${m.homeTeam || "Home"} vs ${m.awayTeam || "Away"}`;

  const streamsHtml =
    m.streams && m.streams.length
      ? `<div class="streams-section">
        <div class="streams-section-title">Available Streams</div>
        <div class="streams-list">${m.streams
          .map((s) => {
            const safeUrl = (s.url || "").replace(/'/g, "\\'");
            const safeTitle = (s.title || "Stream").replace(/'/g, "\\'");
            return `<div class="stream-item">
            <span class="stream-item-title"><i class="fas fa-play-circle"></i>${s.title || "Stream"}</span>
            <button class="watch-btn" onclick="closeModal();playStreamIfLive('${key}','${safeUrl}','${safeTitle}',matchCache['${key}']?.streams)"><i class="fas fa-play"></i> Watch</button>
          </div>`;
          })
          .join("")}
        </div>
       </div>`
      : "";

  const infoRows = [
    m.league
      ? `<div class="info-item"><div class="info-label">League</div><div class="info-value">${m.league}</div></div>`
      : "",
    m.sport
      ? `<div class="info-item"><div class="info-label">Sport</div><div class="info-value" style="text-transform:capitalize">${m.sport}</div></div>`
      : "",
    m.date
      ? `<div class="info-item"><div class="info-label">Date</div><div class="info-value">${m.date}</div></div>`
      : "",
    m.time
      ? `<div class="info-item"><div class="info-label">Time</div><div class="info-value">${m.time}</div></div>`
      : "",
    m.startTime
      ? `<div class="info-item"><div class="info-label">Kick-off</div><div class="info-value">${formatDate(m.startTime)}</div></div>`
      : "",
    m.halfTimeScore
      ? `<div class="info-item"><div class="info-label">HT Score</div><div class="info-value">${m.halfTimeScore}</div></div>`
      : "",
  ]
    .filter(Boolean)
    .join("");

  document.getElementById("modal-body").innerHTML = `
    <div style="display:flex;justify-content:center;margin-bottom:14px">
      <span class="status-badge ${sc}">${live ? '<i class="fas fa-circle" style="font-size:6px;margin-right:4px"></i>' : ""}${m.status || ""}</span>
    </div>
    <div class="modal-score-block">
      <div class="modal-team">
        ${teamLogoHtml(m.homeLogo, m.homeTeam || "Home")}
        <div class="modal-team-name">${m.homeTeam || "Home"}</div>
      </div>
      <div class="modal-score-nums">
        <div class="modal-score-num">${m.homeScore ?? "0"}</div>
        <div class="modal-score-dash">–</div>
        <div class="modal-score-num">${m.awayScore ?? "0"}</div>
      </div>
      <div class="modal-team">
        ${teamLogoHtml(m.awayLogo, m.awayTeam || "Away")}
        <div class="modal-team-name">${m.awayTeam || "Away"}</div>
      </div>
    </div>
    ${infoRows ? `<div class="modal-info">${infoRows}</div>` : ""}
    ${streamsHtml}`;

  bg.classList.add("open");
}

function closeModal() {
  const bg = document.getElementById("match-modal");
  if (bg) bg.classList.remove("open");
}

// ── NEWS MODAL ──
function openNewsModal(key) {
  const n = newsCache[key];
  if (!n) return;
  const bg = document.getElementById("news-modal");
  if (!bg) return;

  const NEWS_BASE = "https://www.sofascore.com";
  const thumb =
    n.cover?.url ||
    (typeof n.cover === "string" ? n.cover : "") ||
    n.thumbnail ||
    n.image ||
    "";
  const title = n.title || "Sports News";
  const summary = n.summary || n.desc || n.description || "";
  const ts = n.createdAt || n.publishTime || n.date || n.publishedAt || "";
  const dateStr = ts
    ? new Date(Number(ts) || ts).toLocaleDateString([], {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";
  const catVal = n.category;
  const category =
    typeof catVal === "string"
      ? catVal
      : typeof catVal === "number"
        ? "Sports"
        : catVal?.name || "Sports";
  const path = n.detailPath || n.url || n.link || n.href || "";
  const url = path.startsWith("http") ? path : path ? NEWS_BASE + path : "";

  const body = document.getElementById("news-modal-body");
  if (!body) return;
  body.innerHTML = `
    ${thumb ? `<img src="${thumb}" style="width:100%;max-height:260px;object-fit:cover;border-radius:8px;margin-bottom:16px;display:block" loading="lazy" onerror="this.style.display='none'">` : ""}
    <div class="news-tag" style="margin-bottom:8px">${category}</div>
    <h2 style="font-size:1.05rem;line-height:1.45;margin-bottom:10px;font-weight:700">${title}</h2>
    ${dateStr ? `<div style="font-size:.75rem;color:var(--muted);margin-bottom:14px;display:flex;align-items:center;gap:6px"><i class="fas fa-calendar-alt"></i>${dateStr}</div>` : ""}
    ${summary ? `<p style="font-size:.9rem;color:var(--text);line-height:1.75;margin-bottom:20px">${summary}</p>` : ""}
  `;

  document.getElementById("news-modal-title").textContent =
    title.length > 50 ? title.substring(0, 50) + "…" : title;
  bg.classList.add("open");
}

function closeNewsModal() {
  const bg = document.getElementById("news-modal");
  if (bg) bg.classList.remove("open");
}

// ── LIVE BADGE (nav) ──
async function updateLiveBadge() {
  try {
    const r = await fetch(apiUrl("/matchzone/data/football-live"));
    const j = await r.json();
    const matches = j.result?.matches || [];
    const count = matches.filter((m) => isLive(m.status)).length;
    const badge = document.getElementById("live-badge");
    if (badge) badge.textContent = count + " LIVE";
  } catch {}
}

// ── MOBILE DRAWER ──
function toggleDrawer() {
  const btn = document.getElementById("nav-hamburger");
  const drawer = document.getElementById("nav-drawer");
  if (!btn || !drawer) return;
  const isOpen = drawer.classList.contains("open");
  btn.classList.toggle("open", !isOpen);
  drawer.classList.toggle("open", !isOpen);
  document.body.style.overflow = isOpen ? "" : "hidden";
}
function closeDrawer() {
  const btn = document.getElementById("nav-hamburger");
  const drawer = document.getElementById("nav-drawer");
  if (btn) btn.classList.remove("open");
  if (drawer) drawer.classList.remove("open");
  document.body.style.overflow = "";
}

// ── DOM READY ──
document.addEventListener("DOMContentLoaded", () => {
  const page = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-link").forEach((a) => {
    const href = a.getAttribute("href") || "";
    if (href === page || (page === "" && href === "index.html"))
      a.classList.add("active");
  });

  // Close drawer when a link is clicked
  document.querySelectorAll("#nav-drawer .nav-link").forEach((a) => {
    a.addEventListener("click", closeDrawer);
  });

  // Match modal backdrop
  const mbg = document.getElementById("match-modal");
  if (mbg)
    mbg.addEventListener("click", (e) => {
      if (e.target === mbg) closeModal();
    });

  // News modal backdrop
  const nbg = document.getElementById("news-modal");
  if (nbg)
    nbg.addEventListener("click", (e) => {
      if (e.target === nbg) closeNewsModal();
    });

  // NFP player: mouse move / touch to show controls
  const nfpEl = document.getElementById("player-modal");
  if (nfpEl) {
    nfpEl.addEventListener("mousemove", () => {
      if (nfpEl.classList.contains("open")) nfpShowControls();
    });
    nfpEl.addEventListener(
      "touchstart",
      () => {
        if (nfpEl.classList.contains("open")) nfpToggleControls();
      },
      { passive: true },
    );
  }

  // Video play/pause icon sync
  const videoEl = document.getElementById("player-video");
  if (videoEl) {
    videoEl.addEventListener("play", () => {
      const pi = document.getElementById("play-icon");
      const bi = document.getElementById("big-play-icon");
      if (pi) pi.className = "fas fa-pause";
      if (bi) bi.className = "fas fa-pause";
      const bigBtn = document.querySelector(".nfp-big-btn");
      if (bigBtn)
        setTimeout(() => {
          if (!videoEl.paused) bigBtn.classList.add("nfp-hidden");
        }, 800);
      _nfpTimer = setTimeout(nfpHideControls, 3200);
    });
    videoEl.addEventListener("pause", () => {
      const pi = document.getElementById("play-icon");
      const bi = document.getElementById("big-play-icon");
      if (pi) pi.className = "fas fa-play";
      if (bi) bi.className = "fas fa-play";
      const bigBtn = document.querySelector(".nfp-big-btn");
      if (bigBtn) bigBtn.classList.remove("nfp-hidden");
      nfpShowControls();
      clearTimeout(_nfpTimer);
    });
  }

  // Fullscreen icon sync + auto-resume video if browser paused it during transition
  const _onFullscreenChange = () => {
    const icon = document.getElementById("fs-icon");
    if (icon)
      icon.className = document.fullscreenElement || document.webkitFullscreenElement
        ? "fas fa-compress"
        : "fas fa-expand";
    // Clear stall timer — fullscreen layout shift should not be treated as a stall
    if (window._stallTimer) { clearTimeout(window._stallTimer); window._stallTimer = null; }
    // Some browsers pause the video during fullscreen transition — resume it
    const player = document.getElementById("player-modal");
    const video = document.getElementById("player-video");
    if (player && player.classList.contains("open") && video && video.src &&
        !video.ended && video.paused && video.style.display !== "none") {
      setTimeout(() => { if (video.paused) video.play().catch(() => {}); }, 120);
    }
  };
  document.addEventListener("fullscreenchange", _onFullscreenChange);
  document.addEventListener("webkitfullscreenchange", _onFullscreenChange);

  // PiP: keep video playing when entering/leaving PiP
  document.addEventListener("enterpictureinpicture", () => {
    if (window._stallTimer) { clearTimeout(window._stallTimer); window._stallTimer = null; }
    const video = document.getElementById("player-video");
    if (video && video.paused) setTimeout(() => { if (video.paused) video.play().catch(() => {}); }, 120);
  });

  // PiP exit sync + resume in player
  document.addEventListener("leavepictureinpicture", () => {
    document
      .querySelectorAll(".nfp-pip-btn")
      .forEach((b) => b.classList.remove("pip-active"));
    const video = document.getElementById("player-video");
    if (video && video.paused) setTimeout(() => { if (video.paused) video.play().catch(() => {}); }, 120);
  });

  // Auto Picture-in-Picture: float the player when user switches to another app
  document.addEventListener("visibilitychange", async () => {
    if (document.visibilityState !== "hidden") return;
    const player = document.getElementById("player-modal");
    const video = document.getElementById("player-video");
    if (!player || !player.classList.contains("open")) return;
    if (!video || video.paused || video.style.display === "none") return;
    if (!document.pictureInPictureEnabled || document.pictureInPictureElement) return;
    try {
      await video.requestPictureInPicture();
      document.querySelectorAll(".nfp-pip-btn").forEach((b) => b.classList.add("pip-active"));
    } catch (_) {}
  });

  updateLiveBadge();
});
