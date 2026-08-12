import { updateState } from "../core/state.js";

const reducedMotionQuery = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
);

function updateReducedMotionPreference() {
    const prefersReducedMotion = reducedMotionQuery.matches;

    document.documentElement.dataset.reducedMotion = String(
        prefersReducedMotion
    );

    updateState("reducedMotion", prefersReducedMotion);
}

export function initAccessibility() {
    updateReducedMotionPreference();

    reducedMotionQuery.addEventListener(
        "change",
        updateReducedMotionPreference
    );

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Tab") {
            return;
        }

        document.body.classList.add("keyboard-navigation");
    });

    document.addEventListener("pointerdown", () => {
        document.body.classList.remove("keyboard-navigation");
    });
}