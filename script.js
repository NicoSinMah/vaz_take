// ---------------------------------------------------------------
// FAVORITE TRACKS — edit this array manually to change the list.
// `cover` should point to a local image (e.g. images/music/xxx.jpg).
// If you leave `url` empty, the track becomes non-clickable.
// ---------------------------------------------------------------
const favoriteTracks = [
  {
    title: "Tell Your World",
    artist: "livetune feat. Hatsune Miku",
    cover: "images/music/tell-your-world.jpg",
    url: "https://music.youtube.com/search?q=Tell+Your+World+livetune+Hatsune+Miku",
  },
  {
    title: "Odds & Ends",
    artist: "ryo feat. Hatsune Miku",
    cover: "images/music/odds-and-ends.jpg",
    url: "https://music.youtube.com/search?q=Odds+and+Ends+Hatsune+Miku",
  },
  {
    title: "Ghost Rule",
    artist: "DECO*27 feat. Hatsune Miku",
    cover: "images/music/ghost-rule.jpg",
    url: "https://music.youtube.com/search?q=Ghost+Rule+DECO27+Hatsune+Miku",
  },
  {
    title: "Usseewa",
    artist: "Ado",
    cover: "images/music/usseewa.jpg",
    url: "https://music.youtube.com/search?q=Usseewa+Ado",
  },
  {
    title: "Racing Into The Night",
    artist: "YOASOBI",
    cover: "images/music/racing-into-the-night.jpg",
    url: "https://music.youtube.com/search?q=Racing+Into+The+Night+YOASOBI",
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

document.addEventListener("DOMContentLoaded", () => {
  renderTracks();
  setupInfoPanels();
});
