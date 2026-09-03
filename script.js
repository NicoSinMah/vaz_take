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

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const alreadyActive = card.classList.contains("is-active");

      cards.forEach((c) => c.classList.remove("is-active"));

      if (!alreadyActive) {
        card.classList.add("is-active");
        wrap.classList.add("has-active");
        card.setAttribute("aria-expanded", "true");
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
  discord: {
    icon: "🎮",
    label: "Discord Rich Presence",
    subtitle: "Coming soon",
  },
};

const activityState = {};

function renderActivityCard(id, data) {
  if (!data) {
    const reserved = RESERVED_ACTIVITIES[id];
    if (!reserved) return "";
    return `
      <div class="activity-card is-ghost" data-activity="${id}">
        <span class="activity-card-cover" aria-hidden="true">${reserved.icon}</span>
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

  return `
    <div class="activity-card" data-activity="${id}" style="${data.accent ? `--accent: ${data.accent};` : ""}">
      <img class="activity-card-cover" src="${data.cover || ""}" alt=""
           onerror="this.removeAttribute('src');" />
      <div class="activity-card-body">
        <div class="activity-card-label"><span class="pulse" aria-hidden="true"></span>${data.label}</div>
        <div class="activity-card-title">${data.title}</div>
        ${data.subtitle ? `<div class="activity-card-subtitle">${data.subtitle}</div>` : ""}
        ${progress}
      </div>
    </div>
  `;
}

function renderActivityPanel() {
  const panel = document.getElementById("activityPanel");
  if (!panel) return;

  const ids = new Set([...Object.keys(activityState), ...Object.keys(RESERVED_ACTIVITIES)]);
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

document.addEventListener("DOMContentLoaded", () => {
  renderTracks();
  setupInfoPanels();
  renderActivityPanel();
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
  if (record && record.is_playing && record.title && record.title !== 'No songs currently') {
    window.activityFeed.set('ytmusic', {
      label: record.label || 'Listening on YouTube Music',
      title: record.title,
      subtitle: record.subtitle,
      cover: record.cover,
      accent: record.accent || 'var(--cyan)',
    });
  } else {
    window.activityFeed.clear('ytmusic');
  }
}

function updateDiscordUI(record) {
  if (record && record.status && record.status !== 'offline') {
    window.activityFeed.set('discord', {
      label: 'Discord Rich Presence',
      title: record.activity_name || record.status,
      subtitle: record.activity_details || record.status,
      cover: record.large_image_url,
      accent: record.status === 'dnd' ? 'var(--pink)' : 'var(--purple)',
    });
  } else {
    window.activityFeed.clear('discord');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  watchPresenceRow('presence', 1, updateYtMusicUI);
  watchPresenceRow('discord_presence', 1, updateDiscordUI);
});
