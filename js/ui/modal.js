let activeModal = null;
let lastFocusedElement = null;

const FOCUSABLE_SELECTOR = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
].join(",");

function getFocusableElements(modal) {
    return [...modal.querySelectorAll(FOCUSABLE_SELECTOR)];
}

function trapFocus(event) {
    if (event.key !== "Tab" || !activeModal) {
        return;
    }

    const focusable = getFocusableElements(activeModal);

    if (!focusable.length) {
        event.preventDefault();
        return;
    }

    const firstElement = focusable[0];
    const lastElement = focusable.at(-1);

    if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
    }

    if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
    }
}

export function openModal(modalId) {
    const modal = document.getElementById(modalId);

    if (!modal) {
        console.warn(`Modal "#${modalId}" was not found.`);
        return false;
    }

    if (activeModal) {
        closeModal();
    }

    lastFocusedElement = document.activeElement;
    activeModal = modal;

    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    const focusable = getFocusableElements(modal);
    focusable[0]?.focus();

    return true;
}

export function closeModal() {
    if (!activeModal) {
        return;
    }

    activeModal.classList.remove("active");
    activeModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");

    activeModal = null;
    lastFocusedElement?.focus();
    lastFocusedElement = null;
}

export function initModal() {
    document.addEventListener("click", (event) => {
        const openButton = event.target.closest("[data-modal-open]");

        if (openButton) {
            openModal(openButton.dataset.modalOpen);
            return;
        }

        if (
            event.target.closest("[data-modal-close]") ||
            event.target === activeModal
        ) {
            closeModal();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeModal();
            return;
        }

        trapFocus(event);
    });
}