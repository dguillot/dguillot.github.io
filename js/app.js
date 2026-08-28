const TYPE_LABELS = {
  tv: "TV",
  physical: "Physical Media",
  streaming: "Streaming",
  rating: "Ratings cut",
  regional: "Regional"
};

const ACTION_LABELS = {
  replaced: "Replaced",
  deleted: "Deleted",
  muted: "Muted"
};

async function loadData() {
  const [movies, changes] = await Promise.all([
    fetch("data/movies.json").then((r) => r.json()),
    fetch("data/changes.json").then((r) => r.json())
  ]);
  return { movies, changes };
}

function qs(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function badgeType(type) {
  return `<span class="badge badge-${type}">${TYPE_LABELS[type] || type}</span>`;
}

function badgeAction(action) {
  return `<span class="badge badge-${action}">${ACTION_LABELS[action] || action}</span>`;
}

function movieById(movies, id) {
  return movies.find((m) => m.id === id);
}

function changesForMovie(changes, movieId) {
  return changes.filter((c) => c.movieId === movieId);
}

function renderChangeCard(change, movie, { compact = false } = {}) {
  const replacementBlock =
    change.action === "replaced"
      ? `<div class="compare-label mb-1">Now it says</div>
         <p class="line-quote mb-0">“${escapeHtml(change.replacement)}”</p>`
      : `<div class="compare-label mb-1">${ACTION_LABELS[change.action]}</div>
         <p class="line-quote mb-0 text-muted-2">This line was ${change.action}.</p>`;

  return `
    <article class="line-card p-3 p-md-4">
      <div class="d-flex justify-content-between align-items-start gap-2 mb-3">
        <div>
          <div class="meta small text-muted-2">${escapeHtml(movie.title)} (${movie.year})</div>
          <div class="fw-semibold">${escapeHtml(change.character)}</div>
        </div>
        <div class="d-flex gap-1 flex-wrap justify-content-end">
          ${badgeType(change.type)}
          ${badgeAction(change.action)}
        </div>
      </div>
      <div class="row g-3">
        <div class="col-md-6">
          <div class="p-3 rounded line-original h-100">
            <div class="compare-label mb-1">It used to say</div>
            <p class="line-quote mb-0">“${escapeHtml(change.original)}”</p>
          </div>
        </div>
        <div class="col-md-6">
          <div class="p-3 rounded ${change.action === "replaced" ? "line-replacement" : "line-deleted"} h-100">
            ${replacementBlock}
          </div>
        </div>
      </div>
      ${
        compact
          ? `<div class="mt-3"><a href="change.html?id=${encodeURIComponent(change.id)}">Full note</a></div>`
          : `<p class="mt-3 mb-1">${escapeHtml(change.notes)}</p>
             <p class="small text-muted-2 mb-0">${escapeHtml(change.scene)} · ${escapeHtml((change.sources || []).join("; "))}</p>`
      }
    </article>
  `;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function setActiveNav() {
  const page = document.body.dataset.page;
  document.querySelectorAll("[data-nav]").forEach((link) => {
    if (link.dataset.nav === page) link.classList.add("active");
  });
}

async function initHome() {
  const { movies, changes } = await loadData();
  const featuredIds = [
    "dh2-falcon",
    "lebowski-alps",
    "soatap-monkey",
    "scarface-chicken",
    "dh5-melon",
    "free-solo-messed"
  ];
  const featured = featuredIds
    .map((id) => changes.find((c) => c.id === id))
    .filter(Boolean);
  document.getElementById("featured").innerHTML = featured
    .map((change) => {
      const movie = movieById(movies, change.movieId);
      return `<div class="col-lg-6">${renderChangeCard(change, movie, { compact: true })}</div>`;
    })
    .join("");
  document.getElementById("stat-changes").textContent = changes.length;
  document.getElementById("stat-movies").textContent = movies.length;
}

async function initMovies() {
  const { movies, changes } = await loadData();
  const qInput = document.getElementById("q");
  const typeSelect = document.getElementById("type");

  function render() {
    const q = qInput.value.trim().toLowerCase();
    const type = typeSelect.value;
    const rows = movies
      .map((movie) => {
        const movieChanges = changesForMovie(changes, movie.id);
        return { movie, movieChanges };
      })
      .filter(({ movie, movieChanges }) => {
        const hay = `${movie.title} ${movie.year}`.toLowerCase();
        const matchQ = !q || hay.includes(q);
        const matchType = !type || movieChanges.some((c) => c.type === type);
        return matchQ && matchType;
      });

    document.getElementById("movie-count").textContent = `${rows.length} movie${rows.length === 1 ? "" : "s"}`;
    document.getElementById("movie-rows").innerHTML = rows
      .map(({ movie, movieChanges }) => {
        const types = [...new Set(movieChanges.map((c) => c.type))]
          .map(badgeType)
          .join(" ");
        return `
          <tr class="movie-row" onclick="location.href='movie.html?id=${movie.id}'">
            <td class="fw-semibold">${escapeHtml(movie.title)}</td>
            <td>${movie.year}</td>
            <td>${movieChanges.length}</td>
            <td>${types}</td>
          </tr>
        `;
      })
      .join("");
  }

  qInput.addEventListener("input", render);
  typeSelect.addEventListener("change", render);
  render();
}

async function initMovie() {
  const { movies, changes } = await loadData();
  const movie = movieById(movies, qs("id"));
  const root = document.getElementById("movie-root");
  if (!movie) {
    root.innerHTML = `<p>Movie not found. <a href="movies.html">Back to the list</a>.</p>`;
    return;
  }
  document.title = `${movie.title} · It Used To Say`;
  const movieChanges = changesForMovie(changes, movie.id);
  const replaced = movieChanges.filter((c) => c.action === "replaced").length;
  const deleted = movieChanges.filter((c) => c.action === "deleted").length;
  root.innerHTML = `
    <p class="kicker mb-2">Movie</p>
    <h1 class="mb-1">${escapeHtml(movie.title)}</h1>
    <p class="text-muted-2">${movie.year} · ${escapeHtml(movie.director)}</p>
    <p class="mb-4">
      <span class="badge badge-replaced">${replaced} replaced</span>
      <span class="badge badge-deleted">${deleted} deleted</span>
    </p>
    <div class="d-flex flex-column gap-4">
      ${movieChanges.map((change) => renderChangeCard(change, movie, { compact: true })).join("")}
    </div>
  `;
}

async function initChange() {
  const { movies, changes } = await loadData();
  const change = changes.find((c) => c.id === qs("id"));
  const root = document.getElementById("change-root");
  if (!change) {
    root.innerHTML = `<p>Change not found. <a href="index.html">Back home</a>.</p>`;
    return;
  }
  const movie = movieById(movies, change.movieId);
  document.title = `${movie.title}: line change · It Used To Say`;
  const siblings = changesForMovie(changes, change.movieId);
  const index = siblings.findIndex((c) => c.id === change.id);
  const prev = siblings[index - 1];
  const next = siblings[index + 1];
  root.innerHTML = `
    <p class="kicker mb-2"><a href="movie.html?id=${movie.id}">${escapeHtml(movie.title)}</a></p>
    ${renderChangeCard(change, movie)}
    <div class="d-flex justify-content-between mt-4">
      <div>${prev ? `<a href="change.html?id=${prev.id}">← Previous line</a>` : ""}</div>
      <div>${next ? `<a href="change.html?id=${next.id}">Next line →</a>` : ""}</div>
    </div>
  `;
}

async function loadPartials() {
  const slots = document.querySelectorAll("[data-partial]");
  await Promise.all(
    [...slots].map(async (slot) => {
      const name = slot.dataset.partial;
      const res = await fetch(`partials/${name}.html`);
      if (!res.ok) return;
      slot.outerHTML = await res.text();
    })
  );
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadPartials();
  setActiveNav();
  const page = document.body.dataset.page;
  if (page === "home") initHome();
  if (page === "movies") initMovies();
  if (page === "movie") initMovie();
  if (page === "change") initChange();
});