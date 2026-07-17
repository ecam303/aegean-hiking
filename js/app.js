const ISLANDS = [
  { id: "astypalea", label: "Astypalaia", file: "data/astypalea.geojson" },
  { id: "ios", label: "Ios", file: "data/ios.geojson" },
  { id: "syros", label: "Syros", file: "data/syros.geojson" }
];

// Deep-time ribbon events — real chronological anchors for the sites
// covered by these three trails.
const TIMELINE_EVENTS = [
  { year: -3300, label: "Final Neolithic", sub: "Vathy first settled", pos: 4 },
  { year: -2700, label: "EC I \u2192 EC II", sub: "Chalandriani cemetery begins", pos: 30 },
  { year: -2500, label: "Skarkos II", sub: "Height of the settlement", pos: 55 },
  { year: -2300, label: "Kastri phase", sub: "Fortified citadel built", pos: 78 },
  { year: -2000, label: "EC III", sub: "Aegean maritime networks", pos: 96 }
];

let map, geoLayer, currentData;

function initTimeline() {
  const track = document.getElementById("timelineTrack");
  TIMELINE_EVENTS.forEach(ev => {
    const marker = document.createElement("div");
    marker.className = "chronology__marker";
    marker.style.left = ev.pos + "%";
    const label = document.createElement("div");
    label.className = "chronology__label";
    label.style.left = ev.pos + "%";
    label.innerHTML = `${ev.label}<span>${ev.sub}</span>`;
    const date = document.createElement("div");
    date.className = "chronology__date";
    date.style.left = ev.pos + "%";
    date.textContent = Math.abs(ev.year) + " BC";
    track.appendChild(marker);
    track.appendChild(label);
    track.appendChild(date);
  });
}

function initMap() {
  map = L.map("map", { scrollWheelZoom: false });
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
}

function initTiles() {
  document.querySelectorAll(".story-tile").forEach(tile => {
    tile.addEventListener("click", () => selectIsland(tile.dataset.id));
  });
}

async function selectIsland(id) {
  document.querySelectorAll(".story-tile").forEach(b =>
    b.classList.toggle("active", b.dataset.id === id)
  );
  const island = ISLANDS.find(i => i.id === id);
  const res = await fetch(island.file);
  const data = await res.json();
  currentData = data;
  renderTrail(data);
}

function renderTrail(data) {
  const meta = data.properties;
  document.getElementById("trailTitle").textContent = meta.trailName;
  document.getElementById("trailIsland").textContent = meta.island + " \u00b7 " + meta.region;
  document.getElementById("trailSummary").textContent = meta.summary;
  document.getElementById("statDistance").textContent = meta.distanceKm + " km";
  document.getElementById("statGain").textContent = meta.elevationGainM + " m gain";
  document.getElementById("statDifficulty").textContent = meta.difficulty;
  document.getElementById("trailNote").textContent = meta.note + " " + meta.basedOn;

  if (geoLayer) geoLayer.remove();
  const layers = [];
  const waypoints = data.features
    .filter(f => f.properties.kind === "waypoint")
    .sort((a, b) => a.properties.order - b.properties.order);

  data.features.forEach(f => {
    if (f.properties.kind === "route") {
      const line = L.geoJSON(f, {
        style: { color: "#A8502E", weight: 3, opacity: 0.85, dashArray: "1 8", lineCap: "round" }
      });
      layers.push(line);
    }
  });

  waypoints.forEach(f => {
    const [lng, lat] = f.geometry.coordinates;
    const marker = L.marker([lat, lng], { icon: waypointIcon(f.properties.type, false) });
    const photo = f.properties.image
      ? `<img src="${f.properties.image}" alt="${f.properties.imageCaption || f.properties.name}" class="popup-photo">`
      : "";
    marker.bindPopup(
      `<h3>${f.properties.name}</h3><span class="period">${f.properties.period}</span>${photo}<p>${f.properties.description}</p>`
    );
    marker.on("click", () => activateWaypoint(f.properties.order));
    marker.wpOrder = f.properties.order;
    marker.wpType = f.properties.type;
    layers.push(marker);
  });

  geoLayer = L.layerGroup(layers).addTo(map);
  const bounds = L.geoJSON(data).getBounds();
  map.fitBounds(bounds, { padding: [30, 30] });

  renderWaypointList(waypoints);
}

function renderWaypointList(waypoints) {
  const list = document.getElementById("waypointList");
  list.innerHTML = "";
  waypoints.forEach(f => {
    const p = f.properties;
    const item = document.createElement("div");
    item.className = "waypoint";
    item.dataset.order = p.order;
    const photo = p.image
      ? `<img src="${p.image}" alt="${p.imageCaption || p.name}" class="waypoint__photo">`
      : "";
    item.innerHTML = `
      <div class="waypoint__head">
        <span class="waypoint__order">${String(p.order).padStart(2, "0")}</span>
        <span class="waypoint__name">${p.name}</span>
      </div>
      <div class="waypoint__period">${p.period}</div>
      <div class="waypoint__desc">${photo}${p.description}</div>
    `;
    item.addEventListener("click", () => activateWaypoint(p.order, true));
    list.appendChild(item);
  });
}

function activateWaypoint(order, panToMarker) {
  document.querySelectorAll(".waypoint").forEach(el =>
    el.classList.toggle("active", Number(el.dataset.order) === order)
  );
  geoLayer.eachLayer(layer => {
    if (layer.wpOrder !== undefined) {
      layer.setIcon(waypointIcon(layer.wpType, layer.wpOrder === order));
      if (layer.wpOrder === order && panToMarker) {
        map.panTo(layer.getLatLng());
        layer.openPopup();
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  initTimeline();
  initTiles();
  initMap();
  await selectIsland(ISLANDS[0].id);
});
