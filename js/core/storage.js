const STORAGE_PREFIX = "resihub:";
const THEME_KEY = "theme";
const VALID_THEMES = new Set([
    "azure",
    "midnight",
    "emerald",
    "sunset",
    "lavender",
]);

function getStorage() {
    try {
        const testKey = `${STORAGE_PREFIX}available`;

        window.localStorage.setItem(testKey, "1");
        window.localStorage.removeItem(testKey);

        return window.localStorage;
    } catch {
        return null;
    }
}

function buildKey(key) {
    return `${STORAGE_PREFIX}${key}`;
}

export function getItem(key, fallback = null) {
    const storage = getStorage();

    if (!storage) {
        return fallback;
    }

    try {
        const value = storage.getItem(buildKey(key));

        return value === null ? fallback : JSON.parse(value);
    } catch {
        return fallback;
    }
}

export function setItem(key, value) {
    const storage = getStorage();

    if (!storage) {
        return false;
    }

    try {
        storage.setItem(buildKey(key), JSON.stringify(value));

        return true;
    } catch {
        return false;
    }
}

export function removeItem(key) {
    const storage = getStorage();

    if (!storage) {
        return false;
    }

    try {
        storage.removeItem(buildKey(key));

        return true;
    } catch {
        return false;
    }
}

export function getTheme() {
    const theme = getItem(THEME_KEY, "azure");

    return VALID_THEMES.has(theme) ? theme : "azure";
}

export function saveTheme(theme) {
    if (!VALID_THEMES.has(theme)) {
        return false;
    }

    return setItem(THEME_KEY, theme);
}

export function getRecentlyViewed() {
    const listings = getItem("recently-viewed", []);

    return Array.isArray(listings) ? listings : [];
}

export function saveRecentlyViewed(listingId) {
    if (!listingId) {
        return false;
    }

    const listings = getRecentlyViewed()
        .filter((id) => id !== listingId);

    listings.unshift(listingId);

    return setItem("recently-viewed", listings.slice(0, 10));
}