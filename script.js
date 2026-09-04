// ---------------------------------------------------------------
// FAVORITE TRACKS — edit this array manually to change the list.
// `cover` should point to a local image (e.g. images/music/xxx.jpg).
// If you leave `url` empty, the track becomes non-clickable.
// ---------------------------------------------------------------
const favoriteTracks = [
  {
    title: "Crime & Punishment",
    artist: "Ado",
    cover: "images/music/crime.jpg",
    url: "https://music.youtube.com/watch?v=x1UsJ2Znjk0&si=bgZV6Bst-_bAvbmL",
  },
  {
    title: "Fleeting Lullaby",
    artist: "Ado",
    cover: "images/music/fleeting.jpg",
    url: "https://music.youtube.com/watch?v=hyV1AJiFNyo&si=LpvkH9vV_3JQV_Gf",
  },
  {
    title: "Balalaika",
    artist: "9lana",
    cover: "images/music/balalaika.jpg",
    url: "https://music.youtube.com/watch?v=SxyEC5tbo9o&si=rIX6H6ufmRhP_v9n",
  },
  {
    title: "モエチャッカファイア / エレン・ジョ",
    artist: "Ellen Joe (CV:Shion Wakayama)",
    cover: "images/music/ellen.jpg",
    url: "https://music.youtube.com/watch?v=rTqYRWcA-Yw&si=pTGwFz3OOiO9gKzl",
  },
  {
    title: "少年よ我に帰れ",
    artist: "Yakushimaru Etsuko",
    cover: "images/music/mawaru.jpg",
    url: "https://music.youtube.com/watch?v=9liVljr-1cs&si=kaSuDLvA5jQaKIT_",
  },
];

function renderTracks() {
  const list = document.getElementById("trackList");
  if (!list) return;

  list.innerHTML = favoriteTracks
    .map((track) => {
      const tag = track.url ? "a" : "div";
      const linkAttrs = track.url
        ? `href="${track.url}" target="_blank" rel="noreferrer"`
        : "";
      return `
        <${tag} class="track" ${linkAttrs}>
          <img class="track-cover" src="${track.cover}" alt="" loading="lazy"
               onerror="this.style.background='linear-gradient(140deg, rgba(110,231,255,0.25), rgba(155,124,255,0.25))'; this.removeAttribute('src');" />
          <div class="track-info">
            <div class="track-title">${track.title}</div>
            <div class="track-artist">${track.artist}</div>
          </div>
          ${track.url ? '<span class="track-play">▶</span>' : ""}
        </${tag}>
      `;
    })
    .join("");
}

// ---------------------------------------------------------------
// DYNAMIC INFO PANELS — click a card to expand it in place of the
// other two; click it again (or another card) to switch/collapse.
// ---------------------------------------------------------------
function setupInfoPanels() {
  const wrap = document.getElementById("infoPanels");
  if (!wrap) return;

  const cards = Array.from(wrap.querySelectorAll(".info-card"));

  // --- Mobile carousel dots -------------------------------------
  // Desktop ignores these visually (display: none via CSS) but they
  // stay wired up so the same code works once the layout switches
  // to the horizontal snap-scroll carousel at 820px.
  const dotsWrap = document.getElementById("infoDots");
  const dots = [];

  if (dotsWrap) {
    dotsWrap.innerHTML = cards
      .map((_, i) => `<button type="button" class="info-dot" aria-label="Go to card ${i + 1}"></button>`)
      .join("");
    dots.push(...dotsWrap.querySelectorAll(".info-dot"));

    dots.forEach((dot, i) => {
      dot.addEventListener("click", () => {
        cards[i].scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      });
    });
  }

  function setActiveDot(index) {
    dots.forEach((dot, i) => dot.classList.toggle("is-active", i === index));
  }

  // Figures out which card is centered in the carousel as the user
  // swipes, so the dot indicator tracks the scroll position.
  let scrollTimeout;
  wrap.addEventListener("scroll", () => {
    if (!dots.length) return;
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      const wrapRect = wrap.getBoundingClientRect();
      const center = wrapRect.left + wrapRect.width / 2;
      let closest = 0;
      let closestDist = Infinity;
      cards.forEach((card, i) => {
        const rect = card.getBoundingClientRect();
        const dist = Math.abs(rect.left + rect.width / 2 - center);
        if (dist < closestDist) {
          closestDist = dist;
          closest = i;
        }
      });
      setActiveDot(closest);
    }, 80);
  });
  setActiveDot(0);

  // --- Expand / collapse (desktop accordion + mobile carousel) ---
  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const alreadyActive = card.classList.contains("is-active");

      cards.forEach((c) => c.classList.remove("is-active"));

      if (!alreadyActive) {
        card.classList.add("is-active");
        wrap.classList.add("has-active");
        card.setAttribute("aria-expanded", "true");
        // On the mobile carousel this re-centers the card that just
        // grew taller; on desktop the scroll container doesn't move.
        card.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      } else {
        wrap.classList.remove("has-active");
      }

      cards.forEach((c) => {
        if (c !== card) c.setAttribute("aria-expanded", "false");
      });
    });
  });
}

// ---------------------------------------------------------------
// LIVE ACTIVITY PANEL — shows what I'm currently doing (YouTube
// Music now, Discord presence later). Each entry is keyed by id so
// an external script (the relay talking to Pear Desktop's API, or
// a future Discord bridge) can push updates in with:
//
//   window.activityFeed.set("ytmusic", {
//     label: "Listening on YouTube Music",
//     title: "Song title",
//     subtitle: "Artist name",
//     cover: "https://...jpg",
//     accent: "var(--cyan)",
//     progress: { elapsed: 42, duration: 210 }, // optional
//   });
//
//   window.activityFeed.clear("ytmusic"); // back to no-card
//
// Reserved (ghost) slots render as a dashed "coming soon" card so
// there's always visual space held for integrations that aren't
// wired up yet.
// ---------------------------------------------------------------
const RESERVED_ACTIVITIES = {
  ytmusic: {
    icon: "🎵",
    label: "YouTube Music",
    subtitle: "Nothing playing right now…",
  },
  discord: {
    cover: "images/tamaki-bn.jpg",
    icon: "🎮",
    label: "Discord",
    subtitle: "Waiting for status…",
  },
};

const activityState = {};

// Swaps a broken/missing cover image for an emoji fallback tile,
// keeping the card's layout intact either way.
function handleAvatarError(imgEl, icon) {
  const span = document.createElement("span");
  span.className = "activity-card-cover activity-card-cover-icon";
  span.setAttribute("aria-hidden", "true");
  span.textContent = icon || "✦";
  imgEl.replaceWith(span);
}
window.handleAvatarError = handleAvatarError;

function renderActivityCard(id, data) {
  if (!data) {
    const reserved = RESERVED_ACTIVITIES[id];
    if (!reserved) return "";
    const ghostAvatar = reserved.cover
      ? `<img class="activity-card-cover" src="${reserved.cover}" alt=""
             onerror="handleAvatarError(this, '${(reserved.icon || "✦").replace(/'/g, "&#39;")}')" />`
      : `<span class="activity-card-cover activity-card-cover-icon" aria-hidden="true">${reserved.icon || "✦"}</span>`;
    return `
      <div class="activity-card is-ghost" data-activity="${id}">
        <div class="activity-card-avatar">
          ${ghostAvatar}
        </div>
        <div class="activity-card-body">
          <div class="activity-card-label"><span class="pulse" aria-hidden="true"></span>${reserved.label}</div>
          <div class="activity-card-subtitle">${reserved.subtitle}</div>
        </div>
      </div>
    `;
  }

  const progress =
    data.progress && data.progress.duration
      ? `<div class="activity-card-progress"><div class="activity-card-progress-fill" style="width:${Math.min(
          100,
          (data.progress.elapsed / data.progress.duration) * 100
        )}%"></div></div>`
      : "";

  const avatar = data.cover
    ? `<img class="activity-card-cover" src="${data.cover}" alt=""
           onerror="handleAvatarError(this, '${(data.icon || "✦").replace(/'/g, "&#39;")}')" />`
    : `<span class="activity-card-cover activity-card-cover-icon" aria-hidden="true">${data.icon || "✦"}</span>`;

  const statusDot = data.statusColor
    ? `<span class="activity-status-dot${data.statusPulse ? " is-pulsing" : ""}" style="--status-color: ${data.statusColor};"></span>`
    : "";

  const labelIcon = data.paused
    ? `<span class="pause-icon" aria-hidden="true">⏸</span>`
    : `<span class="pulse" aria-hidden="true"></span>`;

  return `
    <div class="activity-card${data.paused ? " is-paused" : ""}" data-activity="${id}" style="${data.accent ? `--accent: ${data.accent};` : ""}">
      <div class="activity-card-avatar">
        ${avatar}
        ${statusDot}
      </div>
      <div class="activity-card-body">
        <div class="activity-card-label">${labelIcon}${data.label}</div>
        <div class="activity-card-title">${data.title}</div>
        ${data.subtitle ? `<div class="activity-card-subtitle">${data.subtitle}</div>` : ""}
        ${progress}
      </div>
    </div>
  `;
}

const ACTIVITY_ORDER = ["ytmusic", "discord"];

function renderActivityPanel() {
  const panel = document.getElementById("activityPanel");
  if (!panel) return;

  const ids = new Set([...ACTIVITY_ORDER, ...Object.keys(activityState), ...Object.keys(RESERVED_ACTIVITIES)]);
  panel.innerHTML = Array.from(ids)
    .map((id) => renderActivityCard(id, activityState[id]))
    .join("");
}

window.activityFeed = {
  set(id, data) {
    activityState[id] = data;
    renderActivityPanel();
  },
  clear(id) {
    delete activityState[id];
    renderActivityPanel();
  },
};

// ---------------------------------------------------------------
// NAME FIELD TYPEWRITER — cycles example names in a ghost layer
// above the real (empty) placeholder. "John" stays static; only the
// last name changes. Typing stops and the ghost hides the moment
// the user focuses the field, so it never fights with real input.
// ---------------------------------------------------------------
const TYPEWRITER_PREFIX = "John ";
const TYPEWRITER_NAMES = ["Sekiro...", "Nightrein...", "Genshin...", "Silksong...", "Minecraft..."];

function setupNameTypewriter() {
  const input = document.getElementById("nameField");
  const ghost = document.getElementById("nameGhost");
  if (!input || !ghost) return;

  const TYPE_MS = 70;
  const DELETE_MS = 40;
  const HOLD_MS = 1400;
  const GAP_MS = 300;

  let nameIndex = 0;
  let timer = null;
  let paused = false;

  function schedule(fn, delay) {
    timer = setTimeout(fn, delay);
  }

  function typeName() {
    if (paused) return;
    const full = TYPEWRITER_PREFIX + TYPEWRITER_NAMES[nameIndex];
    let i = TYPEWRITER_PREFIX.length; // prefix is always shown instantly

    ghost.textContent = TYPEWRITER_PREFIX;

    function step() {
      if (paused) return;
      if (i < full.length) {
        ghost.textContent = full.slice(0, i + 1);
        i += 1;
        schedule(step, TYPE_MS);
      } else {
        schedule(deleteName, HOLD_MS);
      }
    }
    schedule(step, TYPE_MS);
  }

  function deleteName() {
    if (paused) return;
    const full = TYPEWRITER_PREFIX + TYPEWRITER_NAMES[nameIndex];
    let i = full.length;

    function step() {
      if (paused) return;
      if (i > TYPEWRITER_PREFIX.length) {
        i -= 1;
        ghost.textContent = full.slice(0, i);
        schedule(step, DELETE_MS);
      } else {
        nameIndex = (nameIndex + 1) % TYPEWRITER_NAMES.length;
        schedule(typeName, GAP_MS);
      }
    }
    schedule(step, DELETE_MS);
  }

  function pause() {
    paused = true;
    clearTimeout(timer);
    ghost.classList.add("is-hidden");
  }

  function resume() {
    if (input.value) return; // real text takes priority, ghost stays hidden
    paused = false;
    ghost.classList.remove("is-hidden");
    typeName();
  }

  input.addEventListener("focus", pause);
  input.addEventListener("input", () => {
    if (input.value) pause();
  });
  input.addEventListener("blur", resume);

  typeName();
}

// ---------------------------------------------------------------
// CONTACT FORM — submits to Netlify Forms via fetch so the page
// doesn't reload / bounce out to a mailto client. Requires the form
// to carry data-netlify="true" and a matching hidden form-name
// field (see index.html); Netlify's build bot needs that static
// HTML to register the form, this JS only handles the submission.
// ---------------------------------------------------------------
function setupContactForm() {
  const form = document.getElementById("contactForm");
  const status = document.getElementById("contactStatus");
  if (!form) return;

  function encodeFormData(data) {
    return Object.keys(data)
      .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
      .join("&");
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    // The reCAPTCHA widget injects a hidden textarea named
    // g-recaptcha-response once checked. If it's missing or empty,
    // stop here instead of firing a request Netlify will just reject.
    const recaptchaField = form.querySelector('[name="g-recaptcha-response"]');
    if (recaptchaField && !recaptchaField.value) {
      if (status) {
        status.textContent = "Please complete the CAPTCHA before sending.";
        status.classList.add("is-error");
      }
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: encodeFormData(data),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Netlify form submission failed: ${res.status}`);
        form.reset();
        if (status) {
          status.textContent = "Message sent — thanks for reaching out!";
          status.classList.remove("is-error");
        }
      })
      .catch((err) => {
        console.error("[contact form]", err);
        if (status) {
          status.textContent = "Something went wrong — try again or email me directly.";
          status.classList.add("is-error");
        }
      })
      .finally(() => {
        if (submitBtn) submitBtn.disabled = false;
      });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderTracks();
  setupInfoPanels();
  renderActivityPanel();
  setupNameTypewriter();
  setupContactForm();
});
// ---------------------------------------------------------------
// SUPABASE CLIENT — powers the live activity cards (YouTube Music
// now, Discord Rich Presence below). Public anon key only: reads
// are gated by RLS policies on the Supabase project, not by
// secrecy of this key.
// ---------------------------------------------------------------
const SUPABASE_URL = 'https://vabsmgzsorzpwxysyqdg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhYnNtZ3pzb3J6cHd4eXN5cWRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNzkyNzgsImV4cCI6MjEwMzk1NTI3OH0.20nuugPe0he2lSKyWfG8ZV80Ve-9t3_OAFQ5Bc-T6oI';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Poll interval used as a fallback in case the Realtime WebSocket
// channel drops or was never actually receiving events (the most
// common cause of "the card doesn't update until I refresh").
const PRESENCE_POLL_MS = 20000;

/**
 * Generic helper: fetch the current row, subscribe to live changes
 * on it, and ALSO poll on an interval as a safety net. `onRecord`
 * is called with the row (or null if none exists yet).
 */
function watchPresenceRow(table, id, onRecord) {
  async function fetchOnce() {
    const { data, error } = await supabaseClient
      .from(table)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error(`[presence] fetch failed for ${table}:`, error.message);
      return;
    }
    onRecord(data || null);
  }

  fetchOnce();

  // Realtime push — instant updates when it's working.
  supabaseClient
    .channel(`public:${table}:${id}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table, filter: `id=eq.${id}` },
      (payload) => onRecord(payload.new || null)
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn(`[presence] realtime channel for ${table} is not connected; relying on polling.`);
      }
    });

  // Polling fallback — catches missed events even if Realtime
  // isn't enabled for the table or the socket silently drops.
  setInterval(fetchOnce, PRESENCE_POLL_MS);
}

function updateYtMusicUI(record) {
  const hasTrack = record && record.title && record.title !== 'No songs currently';

  if (!hasTrack) {
    window.activityFeed.clear('ytmusic');
    return;
  }

  if (record.is_playing) {
    window.activityFeed.set('ytmusic', {
      label: record.label || 'Listening on YouTube Music',
      title: record.title,
      subtitle: record.subtitle,
      cover: record.cover,
      accent: record.accent || 'var(--cyan)',
    });
  } else {
    // A track is loaded but playback is paused — keep the card and its
    // track info, just mark it as paused instead of hiding it.
    window.activityFeed.set('ytmusic', {
      label: 'Paused on YouTube Music',
      title: record.title,
      subtitle: record.subtitle,
      cover: record.cover,
      accent: record.accent || 'var(--cyan)',
      paused: true,
    });
  }
}

const DISCORD_STATUS_META = {
  online: { label: "Online", color: "var(--green)", pulse: true },
  idle: { label: "Idle", color: "#ffcf6e", pulse: false },
  dnd: { label: "Do Not Disturb", color: "#ff5c7a", pulse: false },
  offline: { label: "Offline", color: "var(--muted)", pulse: false },
};

function updateDiscordUI(record) {
  const status = record?.status || "offline";
  const meta = DISCORD_STATUS_META[status] || DISCORD_STATUS_META.offline;
  const isActive = status !== "offline";
  const hasActivity = isActive && !!record?.activity_name;

  window.activityFeed.set("discord", {
    label: `Discord · ${meta.label}`,
    title: hasActivity ? record.activity_name : meta.label,
    subtitle: isActive
      ? (hasActivity ? record.activity_details || undefined : undefined)
      : "Not on Discord right now",
    // Show the game/app's own artwork while one is open; otherwise fall
    // back to the Discord profile picture, then to the local icon.
    cover: (hasActivity && record.large_image_url) || record?.avatar_url || "images/tamaki-bn.jpg",
    accent: meta.color,
    statusColor: meta.color,
    statusPulse: meta.pulse,
  });
}

document.addEventListener('DOMContentLoaded', () => {
  watchPresenceRow('presence', 1, updateYtMusicUI);
  watchPresenceRow('discord_presence', 1, updateDiscordUI);
});
