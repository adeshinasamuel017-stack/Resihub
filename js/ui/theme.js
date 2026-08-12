import { getTheme, saveTheme } from "../core/storage.js";
import { updateState } from "../core/state.js";

const VALID_THEMES = new Set([
    "azure",
    "midnight",
    "emerald",
    "sunset",
    "lavender",
]);

export function applyTheme(theme) {
    const selectedTheme = VALID_THEMES.has(theme)
        ? theme
        : "azure";

    document.documentElement.dataset.theme = selectedTheme;

    updateState("theme", selectedTheme);
    saveTheme(selectedTheme);

    document.dispatchEvent(
        new CustomEvent("resihub:theme-change", {
            detail: { theme: selectedTheme },
        })
    );
}

export function initTheme() {
    applyTheme(getTheme());

    document.addEventListener("change", (event) => {
        const control = event.target.closest("[data-theme-select]");

        if (!control) {
            return;
        }

        applyTheme(control.value);
    });
}