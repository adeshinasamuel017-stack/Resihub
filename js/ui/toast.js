const TOAST_CONTAINER_ID = "toastContainer";
const DEFAULT_DURATION = 4500;
const MAX_TOASTS = 3;

function getContainer() {
    let container = document.getElementById(TOAST_CONTAINER_ID);

    if (container) {
        return container;
    }

    container = document.createElement("div");
    container.id = TOAST_CONTAINER_ID;
    container.className = "toast-container";
    container.setAttribute("aria-live", "polite");
    container.setAttribute("aria-atomic", "true");

    document.body.append(container);

    return container;
}

function removeToast(toast) {
    toast.classList.remove("active");

    toast.addEventListener(
        "transitionend",
        () => toast.remove(),
        { once: true }
    );

    window.setTimeout(() => toast.remove(), 350);
}

export function showToast(message, options = {}) {
    const {
        type = "info",
        duration = DEFAULT_DURATION,
    } = options;

    const container = getContainer();

    while (container.children.length >= MAX_TOASTS) {
        container.firstElementChild?.remove();
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.setAttribute("role", type === "error" ? "alert" : "status");

    const text = document.createElement("p");
    text.className = "toast-message";
    text.textContent = message;

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "toast-close";
    closeButton.setAttribute("aria-label", "Dismiss notification");
    closeButton.textContent = "×";

    closeButton.addEventListener("click", () => removeToast(toast));

    toast.append(text, closeButton);
    container.append(toast);

    window.requestAnimationFrame(() => {
        toast.classList.add("active");
    });

    if (duration > 0) {
        window.setTimeout(() => removeToast(toast), duration);
    }

    return toast;
}