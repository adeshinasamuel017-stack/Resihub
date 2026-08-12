import { getState } from "../core/state.js";

const REVEAL_SELECTOR = ".reveal";
const REVEALED_CLASS = "revealed";

function prefersReducedMotion() {
    return getState().reducedMotion;
}

function revealImmediately(elements) {
    elements.forEach((element) => {
        element.classList.add(REVEALED_CLASS);
    });
}

function initScrollReveal() {
    const elements = [...document.querySelectorAll(REVEAL_SELECTOR)];

    if (!elements.length) {
        return;
    }

    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
        revealImmediately(elements);
        return;
    }

    const observer = new IntersectionObserver(
        (entries, activeObserver) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                entry.target.classList.add(REVEALED_CLASS);
                activeObserver.unobserve(entry.target);
            });
        },
        {
            root: null,
            rootMargin: "0px 0px -8%",
            threshold: 0.1,
        }
    );

    elements.forEach((element) => {
        observer.observe(element);
    });
}

function initScrollProgress() {
    const progress = document.getElementById("scrollProgress");

    if (!progress) {
        return;
    }

    let framePending = false;

    const updateProgress = () => {
        const scrollableHeight =
            document.documentElement.scrollHeight - window.innerHeight;

        const percentage = scrollableHeight > 0
            ? (window.scrollY / scrollableHeight) * 100
            : 0;

        progress.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
        framePending = false;
    };

    const requestUpdate = () => {
        if (framePending) {
            return;
        }

        framePending = true;
        window.requestAnimationFrame(updateProgress);
    };

    updateProgress();

    window.addEventListener("scroll", requestUpdate, {
        passive: true,
    });

    window.addEventListener("resize", requestUpdate);
}

export function initAnimations() {
    initScrollReveal();
    initScrollProgress();
}