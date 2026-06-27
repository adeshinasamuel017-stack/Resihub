// ---- Mock data (replace with Supabase later) ----
const mockListings = [
  { id: 1, price: 180000, type: "self-con", area: "Akoka", phone: "2348012345678" },
  { id: 2, price: 250000, type: "1bedroom", area: "Bariga", phone: "2348023456789" },
  { id: 3, price: 120000, type: "shared", area: "Yabatech GRA", phone: "2348034567890" }
];

const mockUsers = [
  { name: "Tunde A.", role: "Landlord", contact: "2348012345678", status: "Active" },
  { name: "Chioma B.", role: "Student", contact: "chioma@email.com", status: "Active" }
];

// ---- Listings rendering (only runs if #listingCards exists, i.e. homepage) ----
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
      <a class="btn-whatsapp" href="https://wa.me/${item.phone}" target="_blank">
        <i class="fa-brands fa-whatsapp"></i> Contact via WhatsApp
      </a>
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

    const photos = document.getElementById('listingPhotos').files;
    if (photos.length < 2) {
      alert('Please upload at least 2 photos of the room.');
      return;
    }

    console.log('New listing submitted — wire to Supabase later', { photoCount: photos.length });
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
        <button data-index="${i}" class="blacklistBtn"><i class="fa-solid fa-ban"></i> Blacklist</button>
        <button data-index="${i}" class="removeBtn"><i class="fa-solid fa-trash"></i> Remove</button>
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

// ---- Theme toggle (runs on every page) ----
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('themeToggle');
  if (btn) btn.innerHTML = theme === 'dark'
    ? '<i class="fa-solid fa-sun"></i>'
    : '<i class="fa-solid fa-moon"></i>';
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

// ---- Initial render ----
applyFilters();
// ---- Sliding transition between login <-> signup ----
const authBox = document.querySelector('.auth-box');
if (authBox) {
  const params = new URLSearchParams(window.location.search);
  const dir = params.get('dir');

  authBox.classList.remove('enter-default');
  if (dir === 'forward') authBox.classList.add('enter-right');
  else if (dir === 'back') authBox.classList.add('enter-left');
  else authBox.classList.add('enter-default');

  document.querySelectorAll('.auth-switch a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const goingToSignup = link.getAttribute('href').includes('signup');
      authBox.classList.add(goingToSignup ? 'exit-left' : 'exit-right');

      const url = new URL(link.href, window.location.href);
      url.searchParams.set('dir', goingToSignup ? 'forward' : 'back');

      setTimeout(() => { window.location.href = url.toString(); }, 280);
    });
  });
}
// ---- Mobile hamburger menu ----
if (document.getElementById('menuToggle')) {
  document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('topbarActions').classList.toggle('open');
  });
}

// ---- Password match validation on signup forms ----
function validatePasswordMatch(formId, pass1Index, pass2Index) {
  const form = document.getElementById(formId);
  if (!form) return;

  form.addEventListener('submit', (e) => {
    const inputs = form.querySelectorAll('input[type="password"]');
    const pass1 = inputs[pass1Index].value;
    const pass2 = inputs[pass2Index].value;

    const existingError = form.querySelector('.field-error');
    if (existingError) existingError.remove();

    if (pass1 !== pass2) {
      e.preventDefault();
      const error = document.createElement('p');
      error.className = 'field-error';
      error.textContent = 'Passwords do not match.';
      inputs[pass2Index].insertAdjacentElement('afterend', error);
      inputs[pass2Index].classList.add('shake');
      setTimeout(() => inputs[pass2Index].classList.remove('shake'), 400);
    }
  });
}

validatePasswordMatch('studentSignupForm', 0, 1);
validatePasswordMatch('landlordSignupForm', 0, 1);