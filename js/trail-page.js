const TRAIL_PLACEHOLDER_IMAGE = 'assets/syros-kastri-trailhead-sign.jpg';
const TRAIL_NAME = window.TRAIL_ISLAND.charAt(0).toUpperCase() + window.TRAIL_ISLAND.slice(1);
const TRAIL_DATA_FILE = `data/${window.TRAIL_ISLAND}.geojson`;

let trailMap;
let waypointFeatures = [];
let markersByOrder = {};
let currentOrder = 1;
let locationMarker = null;
let accuracyCircle = null;
let lastPosition = null;
let locationWatchId = null;
let routeLayer = null;

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function initMap() {
  trailMap = L.map('map', { scrollWheelZoom: false });
  window.trailMap = trailMap;
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(trailMap);
  L.control.zoom({ position: 'topright' }).addTo(trailMap);
  trailMap.whenReady(() => setTimeout(() => trailMap.invalidateSize(), 0));
  window.addEventListener('resize', () => trailMap.invalidateSize());
}

function updateNavActive(order) {
  document.querySelectorAll('.waypoint-nav__item').forEach(button => {
    button.classList.toggle('active', Number(button.dataset.order) === order);
  });
}

function updateMarkerStyles(activeOrder) {
  Object.values(markersByOrder).forEach(marker => {
    marker.setIcon(waypointIcon(marker.wpType, marker.wpOrder === activeOrder));
  });
}

function renderGallery(images) {
  const track = document.getElementById('galleryTrack');
  if (!track) return;
  track.innerHTML = (images || []).map((item, index) => `
    <div class="gallery__slide${index === 0 ? ' active' : ''}" data-index="${index}">
      <img src="${item.src}" alt="${item.caption}">
      <div class="gallery__caption">
        ${item.caption}
        ${item.attribution ? `<div class="gallery__attribution">${item.attribution}</div>` : ''}
      </div>
    </div>
  `).join('');
}

function getGalleryImagesForWaypoint(name) {
  const images = getWaypointImages(TRAIL_NAME, name);
  if (images.length) return images;
  return [
    { src: TRAIL_PLACEHOLDER_IMAGE, caption: `${name} - view`, attribution: '' },
    { src: TRAIL_PLACEHOLDER_IMAGE, caption: `${name} - detail`, attribution: '' },
    { src: TRAIL_PLACEHOLDER_IMAGE, caption: `${name} - context`, attribution: '' }
  ];
}

function selectGallery(index) {
  const slides = Array.from(document.querySelectorAll('.gallery__slide'));
  if (!slides.length) return;
  const nextIndex = (index + slides.length) % slides.length;
  slides.forEach(slide => slide.classList.toggle('active', Number(slide.dataset.index) === nextIndex));
  slides[nextIndex]?.scrollIntoView({ behavior: 'smooth', inline: 'center' });
}

function scrollGallery(direction) {
  const active = document.querySelector('.gallery__slide.active');
  if (!active) return;
  selectGallery(Number(active.dataset.index) + direction);
}

function metersBetween(lat1, lng1, lat2, lng2) {
  const toRad = deg => deg * Math.PI / 180;
  const radius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function refreshLocationPanel() {
  const activeWaypoint = waypointFeatures.find(waypoint => waypoint.properties.order === currentOrder) || waypointFeatures[0];
  setText('nextWaypointName', activeWaypoint ? activeWaypoint.properties.name : 'Unknown');

  if (!lastPosition || !activeWaypoint) {
    setText('distanceToNext', '—');
    return;
  }

  const { latitude, longitude } = lastPosition.coords;
  const [lng, lat] = activeWaypoint.geometry.coordinates;
  setText('distanceToNext', `${Math.round(metersBetween(latitude, longitude, lat, lng))} m`);
}

function updateLocationPanel(position) {
  lastPosition = position;
  setText(
    'locationStatus',
    `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)} (±${Math.round(position.coords.accuracy)} m)`
  );
  refreshLocationPanel();
}

function updateTrackingMarkers(position) {
  const lat = position.coords.latitude;
  const lng = position.coords.longitude;

  if (!locationMarker) {
    locationMarker = L.circleMarker([lat, lng], {
      radius: 8,
      color: '#7B2456',
      fillColor: '#7B2456',
      fillOpacity: 0.8,
      weight: 2
    }).addTo(trailMap);

    accuracyCircle = L.circle([lat, lng], {
      radius: position.coords.accuracy,
      color: '#7B2456',
      fillColor: '#7B2456',
      fillOpacity: 0.1,
      weight: 1
    }).addTo(trailMap);
  } else {
    locationMarker.setLatLng([lat, lng]);
    accuracyCircle.setLatLng([lat, lng]).setRadius(position.coords.accuracy);
  }
}

function startLocationTracking() {
  if (!navigator.geolocation) {
    setText('locationStatus', 'Geolocation unavailable');
    return;
  }

  locationWatchId = navigator.geolocation.watchPosition(position => {
    updateLocationPanel(position);
    updateTrackingMarkers(position);
  }, error => {
    setText('locationStatus', `GPS error: ${error.message}`);
  }, {
    enableHighAccuracy: true,
    maximumAge: 5000,
    timeout: 10000
  });
}

function focusWaypoint(order) {
  const waypoint = waypointFeatures.find(item => item.properties.order === order);
  const marker = markersByOrder[order];
  if (!waypoint || !marker) return;

  currentOrder = order;
  marker.openPopup();
  trailMap.flyTo(marker.getLatLng(), 16, { duration: 0.8 });
  updateNavActive(order);
  updateMarkerStyles(order);
  setText('detailTitle', waypoint.properties.name);
  setText(
    'detailText',
    waypoint.properties.description || 'Placeholder text about this waypoint and its importance along the route.'
  );

  renderGallery(getGalleryImagesForWaypoint(waypoint.properties.name));
  refreshLocationPanel();
}

function renderNav() {
  const nav = document.getElementById('waypointNav');
  if (!nav) return;

  nav.innerHTML = waypointFeatures.map(waypoint => `
    <button class="waypoint-nav__item" type="button" data-order="${waypoint.properties.order}">
      <span>${String(waypoint.properties.order).padStart(2, '0')} ${waypoint.properties.name}</span>
      <span class="waypoint-nav__order">${waypoint.properties.period}</span>
    </button>
  `).join('');

  nav.querySelectorAll('.waypoint-nav__item').forEach(button => {
    button.addEventListener('click', () => focusWaypoint(Number(button.dataset.order)));
  });
}

function applyTrailMeta(props) {
  document.title = `${props.island || TRAIL_NAME} Trail — Geo-Archaeo Hiking`;
  setText('trailIsland', props.island || TRAIL_NAME);
  setText('trailTitle', props.trailName || `${TRAIL_NAME} Trail`);
  setText('trailSummary', props.summary || '');
  setText('statDistance', props.distanceKm ? `${Number(props.distanceKm).toFixed(2)} km` : '');
  setText('statGain', props.elevationGainM ? `${props.elevationGainM} m` : '');
  setText('statTime', props.estimatedTime || '');
  setText('statDifficulty', props.difficulty || '');
  setText('trailNote', props.note || '');
}

function fitTrailBounds(route, data) {
  const center = Array.isArray(data.properties?.center) && data.properties.center.length === 2
    ? [data.properties.center[1], data.properties.center[0]]
    : null;
  const defaultZoom = Number(data.properties?.zoom) || 14;

  const routeBounds = routeLayer ? routeLayer.getBounds() : null;
  const waypointBounds = waypointFeatures.length
    ? L.latLngBounds(waypointFeatures.map(waypoint => {
        const [lng, lat] = waypoint.geometry.coordinates;
        return [lat, lng];
      }))
    : null;

  if (routeBounds && routeBounds.isValid()) {
    if (waypointBounds && waypointBounds.isValid()) {
      trailMap.fitBounds(routeBounds.extend(waypointBounds), { padding: [24, 24] });
      return;
    }
    trailMap.fitBounds(routeBounds, { padding: [24, 24] });
    return;
  }

  if (waypointBounds && waypointBounds.isValid()) {
    trailMap.fitBounds(waypointBounds, { padding: [24, 24] });
    return;
  }

  if (center) {
    trailMap.setView(center, defaultZoom);
  }
}

async function loadTrail() {
  const response = await fetch(TRAIL_DATA_FILE);
  const data = await response.json();
  const props = data.properties || {};
  const route = data.features.find(item => item.properties.kind === 'route');

  waypointFeatures = data.features
    .filter(item => item.properties.kind === 'waypoint')
    .sort((a, b) => a.properties.order - b.properties.order);
  markersByOrder = {};

  applyTrailMeta(props);

  if (routeLayer) {
    routeLayer.remove();
    routeLayer = null;
  }

  if (route) {
    routeLayer = L.geoJSON(route, {
      style: { color: '#8B0000', weight: 6, opacity: 1, lineCap: 'round', lineJoin: 'round' }
    }).addTo(trailMap);
    routeLayer.bringToFront();
  }

  waypointFeatures.forEach(waypoint => {
    const [lng, lat] = waypoint.geometry.coordinates;
    const marker = L.marker([lat, lng], { icon: waypointIcon(waypoint.properties.type, false) });
    marker.wpOrder = waypoint.properties.order;
    marker.wpType = waypoint.properties.type;
    marker.addTo(trailMap);
    marker.bindPopup(`
      <h3>${waypoint.properties.name}</h3>
      <span class="period">${waypoint.properties.period}</span>
      <p>${waypoint.properties.description}</p>
    `);
    marker.on('click', () => focusWaypoint(waypoint.properties.order));
    markersByOrder[waypoint.properties.order] = marker;
  });

  renderNav();
  fitTrailBounds(route, data);

  if (waypointFeatures.length) {
    focusWaypoint(waypointFeatures[0].properties.order);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadImageAttribs();
  window.scrollTo(0, 0);
  initMap();
  await loadTrail();
  startLocationTracking();

  document.getElementById('galleryPrev')?.addEventListener('click', () => scrollGallery(-1));
  document.getElementById('galleryNext')?.addEventListener('click', () => scrollGallery(1));

  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');
  menuToggle?.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', isOpen);
  });
});
