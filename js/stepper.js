const ISLAND_FILES = {
  astypalea: { file: "data/astypalea.geojson", label: "Astypalaia" },
  anafi: { file: "data/anafi.geojson", label: "Anafi" },
  ios: { file: "data/ios.geojson", label: "Ios" },
  syros: { file: "data/syros.geojson", label: "Syros" }
};

// Each page sets `window.TRAIL_ISLAND = "ios"` (etc.) before loading this
// script. Falls back to a ?island= query param, then to "ios", so the old
// generic trail.html?island=... pattern still works too.
function getIslandId() {
  if (window.TRAIL_ISLAND && ISLAND_FILES[window.TRAIL_ISLAND]) return window.TRAIL_ISLAND;
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("island");
  if (ISLAND_FILES[fromQuery]) return fromQuery;
  return "ios";
}

let map, geoLayer, markersByOrder = {};
let maxUnlocked = 1;

function initMap() {
  map = L.map("map", { scrollWheelZoom: false });
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
}

async function loadTrail() {
  const islandId = getIslandId();
  const island = ISLAND_FILES[islandId];
  document.title = `${island.label} Trail \u2014 Geo-Archaeo Hiking`;

  const res = await fetch(island.file);
  const data = await res.json();
  renderTrail(data);
}

function renderTrail(data) {
  const meta = data.properties;
  document.getElementById("trailIsland").textContent = meta.island + " \u00b7 " + meta.region;
  document.getElementById("trailTitle").textContent = meta.trailName;
  document.getElementById("trailSummary").textContent = meta.summary;
  document.getElementById("statDistance").textContent = meta.distanceKm ? meta.distanceKm + " km" : "TBD";
  document.getElementById("statGain").textContent = meta.elevationGainM ? meta.elevationGainM + " m gain" : "TBD";
  document.getElementById("statDifficulty").textContent = meta.difficulty;
  document.getElementById("trailNote").textContent = meta.note + " " + meta.basedOn;

  const layers = [];
  const waypoints = data.features
    .filter(f => f.properties.kind === "waypoint")
    .sort((a, b) => a.properties.order - b.properties.order);

  data.features.forEach(f => {
    if (f.properties.kind === "route") {
      const line = L.geoJSON(f, {
        style: { color: "#7B2456", weight: 3, opacity: 0.85, dashArray: "1 8", lineCap: "round" }
      });
      layers.push(line);
    }
  });

  markersByOrder = {};
  waypoints.forEach(f => {
    const [lng, lat] = f.geometry.coordinates;
    const marker = L.marker([lat, lng], { icon: waypointIcon(f.properties.type, false) });
    const photos = galleryImages(f.properties);
    marker.bindPopup(
      `<h3>${f.properties.name}</h3><span class="period">${f.properties.period}</span>${
        photos[0] ? `<img src="${photos[0].src}" alt="${photos[0].alt}" class="popup-photo">` : ""
      }<p>${f.properties.description}</p>`
    );
    marker.wpOrder = f.properties.order;
    marker.wpType = f.properties.type;
    layers.push(marker);
    markersByOrder[f.properties.order] = marker;
  });

  if (geoLayer) geoLayer.remove();
  geoLayer = L.layerGroup(layers).addTo(map);
  const bounds = L.geoJSON(data).getBounds();
  if (bounds.isValid()) map.fitBounds(bounds, { padding: [30, 30] });

  renderStepper(waypoints);
}

// Returns an array of {src, alt} for a waypoint's gallery: real images
// first (from `image` / `images` in the GeoJSON), padded out with
// generic placeholder slides so every stop has a swipeable gallery.
function galleryImages(props) {
  const real = [];
  if (Array.isArray(props.images)) {
    props.images.forEach(img => real.push({ src: img.src, alt: img.alt || props.name }));
  } else if (props.image) {
    real.push({ src: props.image, alt: props.imageCaption || props.name });
  }
  const placeholderLabels = ["Site view", "Geological detail", "Landscape context"];
  const placeholders = placeholderLabels
    .slice(0, Math.max(0, 3 - real.length))
    .map(label => ({ placeholder: true, label }));
  return [...real, ...placeholders];
}

function renderGalleryHTML(props, stepId) {
  const images = galleryImages(props);
  const slides = images.map(img => {
    if (img.placeholder) {
      return `<div class="gallery__slide"><div class="placeholder-img">Photo placeholder<br>${img.label}</div></div>`;
    }
    return `<div class="gallery__slide"><img src="${img.src}" alt="${img.alt}"></div>`;
  }).join("");
  return `
    <div class="gallery" id="${stepId}-gallery">
      <div class="gallery__track">${slides}</div>
      ${images.length > 1 ? `
        <button class="gallery__nav gallery__nav--prev" aria-label="Previous photo" data-gallery="${stepId}-gallery" data-dir="-1">&larr;</button>
        <button class="gallery__nav gallery__nav--next" aria-label="Next photo" data-gallery="${stepId}-gallery" data-dir="1">&rarr;</button>
      ` : ""}
    </div>
  `;
}

function renderStepper(waypoints) {
  const container = document.getElementById("stepper");
  container.innerHTML = "";
  maxUnlocked = 1;

  waypoints.forEach(f => {
    const p = f.properties;
    const stepId = `step-${p.order}`;
    const step = document.createElement("div");
    step.className = "step" + (p.order > 1 ? " step--locked" : "");
    step.dataset.order = p.order;
    step.innerHTML = `
      <button class="step__header" data-order="${p.order}">
        <span class="step__num">${String(p.order).padStart(2, "0")}</span>
        <span class="step__name">${p.name}</span>
        <span class="step__toggle">+</span>
      </button>
      <div class="step__body" id="${stepId}-body">
        <p class="step__period">${p.period}</p>
        ${renderGalleryHTML(p, stepId)}
        <p class="step__desc">${p.description}</p>
      </div>
    `;
    container.appendChild(step);
  });

  container.querySelectorAll(".step__header").forEach(btn => {
    btn.addEventListener("click", () => toggleStep(Number(btn.dataset.order), waypoints.length));
  });

  container.querySelectorAll(".gallery__nav").forEach(btn => {
    btn.addEventListener("click", () => scrollGallery(btn.dataset.gallery, Number(btn.dataset.dir)));
  });
}

function toggleStep(order, total) {
  const step = document.querySelector(`.step[data-order="${order}"]`);
  const body = step.querySelector(".step__body");
  const isOpen = step.classList.toggle("step--open");
  step.querySelector(".step__toggle").textContent = isOpen ? "\u2212" : "+";

  const marker = markersByOrder[order];
  if (marker && isOpen) {
    map.panTo(marker.getLatLng());
    marker.openPopup();
  }

  if (isOpen && order === maxUnlocked && order < total) {
    maxUnlocked = order + 1;
    const nextStep = document.querySelector(`.step[data-order="${maxUnlocked}"]`);
    if (nextStep) {
      nextStep.classList.remove("step--locked");
      requestAnimationFrame(() => {
        nextStep.classList.add("step--revealed");
        nextStep.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    }
  }
}

function scrollGallery(id, dir) {
  const track = document.querySelector(`#${id} .gallery__track`);
  if (!track) return;
  track.scrollBy({ left: dir * track.clientWidth, behavior: "smooth" });
}

document.addEventListener("DOMContentLoaded", async () => {
  initMap();
  await loadTrail();
});
