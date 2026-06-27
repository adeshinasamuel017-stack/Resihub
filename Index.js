function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

document.querySelectorAll('.modal-close').forEach(btn => {
  btn.addEventListener('click', () => closeModal(btn.dataset.close));
});

// ---- Student: login + signup buttons in topbar ----
document.getElementById('studentLoginBtn').addEventListener('click', () => openModal('studentAuthModal'));
document.getElementById('studentSignupBtn').addEventListener('click', () => openModal('studentSignupModal'));

// ---- Student: switch links inside the modals ----
document.getElementById('studentToSignup').addEventListener('click', (e) => {
  e.preventDefault();
  closeModal('studentAuthModal');
  openModal('studentSignupModal');
});
document.getElementById('studentToLogin').addEventListener('click', (e) => {
  e.preventDefault();
  closeModal('studentSignupModal');
  openModal('studentAuthModal');
});

// ---- Landlord: login + signup buttons in topbar ----
document.getElementById('landlordLoginBtn').addEventListener('click', () => openModal('landlordAuthModal'));
document.getElementById('landlordSignupBtn').addEventListener('click', () => openModal('landlordSignupModal'));

// ---- Landlord: switch links inside the modals ----
document.getElementById('landlordToSignup').addEventListener('click', (e) => {
  e.preventDefault();
  closeModal('landlordAuthModal');
  openModal('landlordSignupModal');
});
document.getElementById('landlordToLogin').addEventListener('click', (e) => {
  e.preventDefault();
  closeModal('landlordSignupModal');
  openModal('landlordAuthModal');
});

// ---- Admin stays separate — no shared toggle with student/landlord ----
// (admin login button isn't on the public topbar — see note below)

// ---- Mock data (replace with Supabase later) ----
const mockListings = [
  { id: 1, price: 180000, type: "self-con", area: "Akoka", lat: 6.5185, lng: 3.3860, phone: "2348012345678" },
  { id: 2, price: 250000, type: "1bedroom", area: "Bariga", lat: 6.5302, lng: 3.3795, phone: "2348023456789" },
  { id: 3, price: 120000, type: "shared", area: "Yabatech GRA", lat: 6.5152, lng: 3.3801, phone: "2348034567890" }
];

const mockUsers = [
  { name: "Tunde A.", role: "Landlord", contact: "2348012345678", status: "Active" },
  { name: "Chioma B.", role: "Student", contact: "chioma@email.com", status: "Active" }
];

// ---- Map setup ----
const map = L.map('map').setView([6.5181, 3.3862], 14);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
const markerLayer = L.layerGroup().addTo(map);

let selectedLat = null, selectedLng = null;

map.on('click', (e) => {
  selectedLat = e.latlng.lat;
  selectedLng = e.latlng.lng;
  alert(`Location set: ${selectedLat.toFixed(4)}, ${selectedLng.toFixed(4)} — now fill the listing form.`);
});

function renderMarkers(listings) {
  markerLayer.clearLayers();
  listings.forEach(item => {
    L.marker([item.lat, item.lng])
      .bindPopup(`₦${item.price.toLocaleString()} — ${item.type} (${item.area})`)
      .addTo(markerLayer);
  });
}

function renderCards(listings) {
  const container = document.getElementById('listingCards');
  const emptyState = document.getElementById('emptyState');
  container.innerHTML = '';

  if (listings.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  listings.forEach(item => {
    const card = document.createElement('div');
    card.className = 'listing-card';
    card.innerHTML = `
      <p class="card-price">₦${item.price.toLocaleString()}</p>
      <p class="card-type">${item.type} — ${item.area}</p>
      <a class="btn-whatsapp" href="https://wa.me/${item.phone}" target="_blank">Contact via WhatsApp</a>
    `;
    container.appendChild(card);
  });
}

function applyFilters() {
  const campus = document.getElementById('campusFilter').value;
  const maxPrice = Number(document.getElementById('priceFilter').value);
  const filtered = mockListings.filter(item =>
    (campus === 'All' || item.area === campus) && item.price <= maxPrice
  );
  renderMarkers(filtered);
  renderCards(filtered);
}

document.getElementById('campusFilter').addEventListener('change', applyFilters);
document.getElementById('priceFilter').addEventListener('input', (e) => {
  document.getElementById('priceValue').textContent = Number(e.target.value).toLocaleString();
  applyFilters();
});

// ---- Modal helpers ----
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

document.querySelectorAll('.modal-close').forEach(btn => {
  btn.addEventListener('click', () => closeModal(btn.dataset.close));
});

// ---- Student: login + signup ----
document.getElementById('studentLoginBtn').addEventListener('click', () => openModal('studentAuthModal'));
document.getElementById('studentSignupBtn').addEventListener('click', () => openModal('studentSignupModal'));

document.getElementById('studentToSignup').addEventListener('click', (e) => {
  e.preventDefault();
  closeModal('studentAuthModal');
  openModal('studentSignupModal');
});
document.getElementById('studentToLogin').addEventListener('click', (e) => {
  e.preventDefault();
  closeModal('studentSignupModal');
  openModal('studentAuthModal');
});

// ---- Landlord: login + signup ----
document.getElementById('landlordLoginBtn').addEventListener('click', () => openModal('landlordAuthModal'));
document.getElementById('landlordSignupBtn').addEventListener('click', () => openModal('landlordSignupModal'));

document.getElementById('landlordToSignup').addEventListener('click', (e) => {
  e.preventDefault();
  closeModal('landlordAuthModal');
  openModal('landlordSignupModal');
});
document.getElementById('landlordToLogin').addEventListener('click', (e) => {
  e.preventDefault();
  closeModal('landlordSignupModal');
  openModal('landlordAuthModal');
});

// ---- List a room ----
document.getElementById('listBtn').addEventListener('click', () => openModal('listRoomModal'));

// ---- Form submit stubs (no backend yet) ----
document.getElementById('studentAuthForm').addEventListener('submit', (e) => {
  e.preventDefault();
  console.log('Student login submitted — wire to Supabase later');
  closeModal('studentAuthModal');
});

document.getElementById('studentSignupForm').addEventListener('submit', (e) => {
  e.preventDefault();
  console.log('Student signup submitted — wire to Supabase later');
  closeModal('studentSignupModal');
});

document.getElementById('landlordAuthForm').addEventListener('submit', (e) => {
  e.preventDefault();
  console.log('Landlord login submitted — wire to Supabase later');
  closeModal('landlordAuthModal');
});

document.getElementById('landlordSignupForm').addEventListener('submit', (e) => {
  e.preventDefault();
  console.log('Landlord signup submitted — wire to Supabase later');
  closeModal('landlordSignupModal');
});

document.getElementById('listRoomForm').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!selectedLat) {
    alert('Tap a location on the map first.');
    return;
  }
  console.log('New listing submitted — wire to Supabase later', { lat: selectedLat, lng: selectedLng });
  closeModal('listRoomModal');
});

// ---- Admin (no topbar button — accessed via direct URL/hash later) ----
document.getElementById('adminLoginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  closeModal('adminLoginModal');
  document.getElementById('adminPanel').classList.remove('hidden');
  renderAdminTable();
});

function renderAdminTable() {
  const tbody = document.querySelector('#usersTable tbody');
  tbody.innerHTML = '';
  mockUsers.forEach((user, i) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${user.name}</td>
      <td>${user.role}</td>
      <td>${user.contact}</td>
      <td>${user.status}</td>
      <td>
        <button data-index="${i}" class="blacklistBtn">Blacklist</button>
        <button data-index="${i}" class="removeBtn">Remove</button>
      </td>
    `;
    tbody.appendChild(row);
  });

  tbody.querySelectorAll('.blacklistBtn').forEach(btn => {
    btn.addEventListener('click', () => {
      mockUsers[btn.dataset.index].status = 'Blacklisted';
      renderAdminTable();
    });
  });
  tbody.querySelectorAll('.removeBtn').forEach(btn => {
    btn.addEventListener('click', () => {
      mockUsers.splice(btn.dataset.index, 1);
      renderAdminTable();
    });
  });
}

// ---- Initial render ----
applyFilters();
// ---- Mock data (replace with Supabase later) ----
const mockListings = [
  { id: 1, price: 180000, type: "self-con", area: "Akoka", lat: 6.5185, lng: 3.3860, phone: "2348012345678" },
  { id: 2, price: 250000, type: "1bedroom", area: "Bariga", lat: 6.5302, lng: 3.3795, phone: "2348023456789" },
  { id: 3, price: 120000, type: "shared", area: "Yabatech GRA", lat: 6.5152, lng: 3.3801, phone: "2348034567890" }
];

const mockUsers = [
  { name: "Tunde A.", role: "Landlord", contact: "2348012345678", status: "Active" },
  { name: "Chioma B.", role: "Student", contact: "chioma@email.com", status: "Active" }
];

// ---- Map setup (only runs if #map exists on this page) ----
let map, markerLayer, selectedLat = null, selectedLng = null;

if (document.getElementById('map')) {
  map = L.map('map').setView([6.5181, 3.3862], 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
  markerLayer = L.layerGroup().addTo(map);

  map.on('click', (e) => {
    selectedLat = e.latlng.lat;
    selectedLng = e.latlng.lng;
    alert(`Location set: ${selectedLat.toFixed(4)}, ${selectedLng.toFixed(4)} — now fill the listing form.`);
  });
}

function renderMarkers(listings) {
  if (!markerLayer) return;
  markerLayer.clearLayers();
  listings.forEach(item => {
    L.marker([item.lat, item.lng])
      .bindPopup(`₦${item.price.toLocaleString()} — ${item.type} (${item.area})`)
      .addTo(markerLayer);
  });
}

function renderCards(listings) {
  const container = document.getElementById('listingCards');
  if (!container) return;
  const emptyState = document.getElementById('emptyState');
  container.innerHTML = '';

  if (listings.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  listings.forEach(item => {
    const card = document.createElement('div');
    card.className = 'listing-card';
    card.innerHTML = `
      <p class="card-price">₦${item.price.toLocaleString()}</p>
      <p class="card-type">${item.type} — ${item.area}</p>
      <a class="btn-whatsapp" href="https://wa.me/${item.phone}" target="_blank">Contact via WhatsApp</a>
    `;
    container.appendChild(card);
  });
}

function applyFilters() {
  const campusEl = document.getElementById('campusFilter');
  const priceEl = document.getElementById('priceFilter');
  if (!campusEl || !priceEl) return;

  const campus = campusEl.value;
  const maxPrice = Number(priceEl.value);
  const filtered = mockListings.filter(item =>
    (campus === 'All' || item.area === campus) && item.price <= maxPrice
  );
  renderMarkers(filtered);
  renderCards(filtered);
}

if (document.getElementById('campusFilter')) {
  document.getElementById('campusFilter').addEventListener('change', applyFilters);
  document.getElementById('priceFilter').addEventListener('input', (e) => {
    document.getElementById('priceValue').textContent = Number(e.target.value).toLocaleString();
    applyFilters();
  });
}

// ---- Modal helpers ----
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

document.querySelectorAll('.modal-close').forEach(btn => {
  btn.addEventListener('click', () => closeModal(btn.dataset.close));
});

// ---- List a room (only on homepage) ----
if (document.getElementById('listBtn')) {
  document.getElementById('listBtn').addEventListener('click', () => openModal('listRoomModal'));
}

if (document.getElementById('listRoomForm')) {
  document.getElementById('listRoomForm').addEventListener('submit', (e) => {
    e.preventDefault();

    if (!selectedLat) {
      alert('Tap a location on the map first.');
      return;
    }

    const photos = document.getElementById('listingPhotos').files;
    if (photos.length < 2) {
      alert('Please upload at least 2 photos of the room.');
      return;
    }

    console.log('New listing submitted — wire to Supabase later', {
      lat: selectedLat,
      lng: selectedLng,
      photoCount: photos.length
    });
    closeModal('listRoomModal');
  });
}

// ---- Student auth forms (only exist on their own pages) ----
if (document.getElementById('studentAuthForm')) {
  document.getElementById('studentAuthForm').addEventListener('submit', (e) => {
    e.preventDefault();
    console.log('Student login submitted — wire to Supabase later');
  });
}

if (document.getElementById('studentSignupForm')) {
  document.getElementById('studentSignupForm').addEventListener('submit', (e) => {
    e.preventDefault();
    console.log('Student signup submitted — wire to Supabase later');
  });
}

// ---- Landlord auth forms (only exist on their own pages) ----
if (document.getElementById('landlordAuthForm')) {
  document.getElementById('landlordAuthForm').addEventListener('submit', (e) => {
    e.preventDefault();
    console.log('Landlord login submitted — wire to Supabase later');
  });
}

if (document.getElementById('landlordSignupForm')) {
  document.getElementById('landlordSignupForm').addEventListener('submit', (e) => {
    e.preventDefault();
    console.log('Landlord signup submitted — wire to Supabase later');
  });
}

// ---- Admin (no topbar button — accessed separately) ----
if (document.getElementById('adminLoginForm')) {
  document.getElementById('adminLoginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    closeModal('adminLoginModal');
    document.getElementById('adminPanel').classList.remove('hidden');
    renderAdminTable();
  });
}

function renderAdminTable() {
  const tbody = document.querySelector('#usersTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  mockUsers.forEach((user, i) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${user.name}</td>
      <td>${user.role}</td>
      <td>${user.contact}</td>
      <td>${user.status}</td>
      <td>
        <button data-index="${i}" class="blacklistBtn">Blacklist</button>
        <button data-index="${i}" class="removeBtn">Remove</button>
      </td>
    `;
    tbody.appendChild(row);
  });

  tbody.querySelectorAll('.blacklistBtn').forEach(btn => {
    btn.addEventListener('click', () => {
      mockUsers[btn.dataset.index].status = 'Blacklisted';
      renderAdminTable();
    });
  });
  tbody.querySelectorAll('.removeBtn').forEach(btn => {
    btn.addEventListener('click', () => {
      mockUsers.splice(btn.dataset.index, 1);
      renderAdminTable();
    });
  });
}

// ---- Initial render ----
applyFilters();
// ---- Theme toggle ----
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

const savedTheme = localStorage.getItem('resihub-theme') || 'light';
applyTheme(savedTheme);

if (document.getElementById('themeToggle')) {
  document.getElementById('themeToggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    localStorage.setItem('resihub-theme', current);
    applyTheme(current);
  });
}