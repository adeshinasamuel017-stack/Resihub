// ---- Listings rendering (Live Database Data) ----
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

  listings.forEach(listing => {
    const card = document.createElement('div');
    card.className = 'listing-card animate-fade-in';

    // Fallback image if no photo array is present
    const mainImage = (listing.photo_urls && listing.photo_urls.length > 0)
      ? listing.photo_urls[0]
      : 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80';

    card.innerHTML = `
      <img src="${mainImage}" alt="${listing.type} in ${listing.area}" class="card-img" loading="lazy">
      <div class="card-body">
        <div class="card-price">₦${Number(listing.price).toLocaleString()}/yr</div>
        <div class="card-details">
          <span><i class="fa-solid fa-house"></i> ${listing.type}</span>
          <span><i class="fa-solid fa-location-dot"></i> ${listing.area}</span>
        </div>
        <a href="https://wa.me/${listing.phone.replace(/[^0-9]/g, '')}" target="_blank" class="btn-whatsapp">
          <i class="fa-brands fa-whatsapp"></i> Contact Landlord
        </a>
      </div>
    `;
    container.appendChild(card);
  });
}

// ---- Live Fetch & Filter from Database ----
async function applyFilters() {
  const campusEl = document.getElementById('campusFilter');
  const priceEl = document.getElementById('priceFilter');
  if (!campusEl || !priceEl) return;

  const campus = campusEl.value;
  const maxPrice = Number(priceEl.value);

  // FIXED: Changed priceVal to priceValue to match your HTML ID exactly
  const priceValueEl = document.getElementById('priceValue');
  if (priceValueEl) {
    priceValueEl.textContent = maxPrice.toLocaleString();
  }

  // FIXED: Changed 'supabase' to 'supabaseClient'
  let query = supabaseClient
    .from('listings')
    .select('*')
    .lte('price', maxPrice);

  if (campus !== 'All') {
    query = query.eq('area', campus);
  }

  const { data: listings, error } = await query;

  if (error) {
    console.error('Error loading listings:', error.message);
    return;
  }

  renderCards(listings);
}

// ---- Modals Logic ----
function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove('flex');
  modal.classList.add('hidden');
}

// ---- Event Listeners Initialization ----
document.addEventListener('DOMContentLoaded', () => {
  // Initial load of home listings
  if (document.getElementById('listingCards')) {
    applyFilters();
  }

  // Filter Listeners
  if (document.getElementById('campusFilter')) {
    document.getElementById('campusFilter').addEventListener('change', applyFilters);
  }
  if (document.getElementById('priceFilter')) {
    document.getElementById('priceFilter').addEventListener('input', applyFilters);
  }

  // Trigger Listing Modal
  if (document.getElementById('listBtn')) {
    document.getElementById('listBtn').addEventListener('click', () => openModal('listRoomModal'));
  }

  // Close modals clicking cross buttons
  document.querySelectorAll('[data-close]').forEach(button => {
    button.addEventListener('click', () => {
      closeModal(button.getAttribute('data-close'));
    });
  });

  // Handle Adding New Room Listings to Database
  const roomForm = document.getElementById('listRoomForm');
  if (roomForm) {
    roomForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const phone = e.target.querySelector('input[type="tel"]').value;
      const price = Number(e.target.querySelector('input[type="number"]').value);
      const type = e.target.querySelectorAll('select')[0].value;
      const area = e.target.querySelectorAll('select')[1].value;

      // FIXED: Changed 'supabase' to 'supabaseClient'
      const { error } = await supabaseClient
        .from('listings')
        .insert([{ price, type, area, phone, photo_urls: [] }]);

      if (error) {
        alert('Failed to save listing: ' + error.message);
      } else {
        alert('Listing submitted successfully!');
        roomForm.reset();
        closeModal('listRoomModal');
        applyFilters(); // Refresh home UI grid
      }
    });
  }

  // Setup Form Route Transitions & Validation
  handleAuthAnimations();
  validatePasswordMatch('studentSignupForm', 3, 4);
  validatePasswordMatch('landlordSignupForm', 3, 4);
});

// ---- Theme Switcher ----
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
  });
}

function updateThemeIcon(theme) {
  const icon = themeToggle.querySelector('i');
  if (theme === 'dark') {
    icon.className = 'fa-solid fa-sun';
  } else {
    icon.className = 'fa-solid fa-moon';
  }
}

// ---- Route & Auth Transitions ----
function handleAuthAnimations() {
  const urlParams = new URLSearchParams(window.location.search);
  const direction = urlParams.get("dir");
  const authBox = document.querySelector(".auth-box");

  if (authBox && direction) {
    authBox.classList.remove("enter-default");

    if (direction === "forward") {
      authBox.classList.add("enter-right");
    } else if (direction === "back") {
      authBox.classList.add("enter-left");
    }
  }

  document.querySelectorAll(".auth-switch a").forEach(link => {
    link.addEventListener("click", function (e) {
      e.preventDefault();

      if (!authBox) {
        window.location.href = this.href;
        return;
      }

      const goingToSignup = this.href.includes("signup");

      authBox.classList.remove(
        "enter-default",
        "enter-right",
        "enter-left",
        "exit-left",
        "exit-right"
      );

      authBox.classList.add(
        goingToSignup ? "exit-left" : "exit-right"
      );

      setTimeout(() => {
        const url = new URL(this.href, window.location.origin);

        url.searchParams.set(
          "dir",
          goingToSignup ? "forward" : "back"
        );

        window.location.href = url.toString();
      }, 280);
    });
  });
}

// ---- Mobile hamburger menu ----
if (document.getElementById('menuToggle')) {
  document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('topbarActions').classList.toggle('open');
  });
}

// ---- Password match validation ----
function validatePasswordMatch(formId, pass1Index, pass2Index) {
  const form = document.getElementById(formId);
  if (!form) return;

  form.addEventListener('submit', (e) => {
    const inputs = form.querySelectorAll('input[type=\"password\"]');
    if (inputs.length < 2) return;

    const pass1 = inputs[pass1Index - 3]?.value || inputs[0].value;
    const pass2 = inputs[pass2Index - 3]?.value || inputs[1].value;

    const existingError = form.querySelector('.field-error');
    if (existingError) existingError.remove();

    if (pass1 !== pass2) {
      e.preventDefault();
      const error = document.createElement('p');
      error.className = 'field-error';
      error.textContent = 'Passwords do not match.';
      inputs[inputs.length - 1].insertAdjacentElement('afterend', error);
      inputs[inputs.length - 1].classList.add('shake');

      setTimeout(() => inputs[inputs.length - 1].classList.remove('shake'), 500);
    }
  });
}