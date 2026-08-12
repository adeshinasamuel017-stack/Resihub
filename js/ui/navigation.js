import { updateState } from "../core/state.js";

const MOBILE_BREAKPOINT = window.matchMedia("(max-width: 768px)");

function getHeaderElements() {
    const header = document.querySelector(".main-header");
    const toggle = header?.querySelector(".menu-toggle");
    const navigation = header?.querySelector(".main-nav");
    const profileDropdown = header?.querySelector(".profile-dropdown");
    const profileButton = profileDropdown?.querySelector(".profile-btn");
    const profileMenu = profileDropdown?.querySelector(".dropdown-menu");

    return {
        header,
        toggle,
        navigation,
        profileDropdown,
        profileButton,
        profileMenu,
    };
}

function setMenuState(toggle, navigation, isOpen) {
    navigation.classList.toggle("active", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));

    updateState("ui.isNavigationOpen", isOpen);
}

function closeProfileMenu(profileButton, profileMenu) {
    if (!profileMenu) {
        return;
    }

    profileMenu.classList.remove("active");
    profileButton?.setAttribute("aria-expanded", "false");
}

function setActiveLink(navigation) {
    const currentPage = window.location.pathname
        .split("/")
        .pop()
        ?.toLowerCase();

    if (!currentPage) {
        return;
    }

    navigation?.querySelectorAll("a[href]").forEach((link) => {
        const linkPage = link.getAttribute("href")
            ?.split("/")
            .pop()
            ?.toLowerCase();

        const isActive = linkPage === currentPage;

        link.classList.toggle("active", isActive);

        if (isActive) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
    });
}

export function initNavigation() {
    const {
        header,
        toggle,
        navigation,
        profileDropdown,
        profileButton,
        profileMenu,
    } = getHeaderElements();

    if (!header || !toggle || !navigation) {
        return;
    }

    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-controls", navigation.id);

    setActiveLink(navigation);

    toggle.addEventListener("click", () => {
        const isOpen = !navigation.classList.contains("active");

        setMenuState(toggle, navigation, isOpen);
        closeProfileMenu(profileButton, profileMenu);
    });

    navigation.addEventListener("click", (event) => {
        if (
            MOBILE_BREAKPOINT.matches &&
            event.target.closest("a")
        ) {
            setMenuState(toggle, navigation, false);
        }
    });

    profileButton?.setAttribute("aria-expanded", "false");

    profileButton?.addEventListener("click", () => {
        const isOpen = !profileMenu?.classList.contains("active");

        profileMenu?.classList.toggle("active", isOpen);
        profileButton.setAttribute("aria-expanded", String(isOpen));

        setMenuState(toggle, navigation, false);
    });

    document.addEventListener("click", (event) => {
        if (!header.contains(event.target)) {
            setMenuState(toggle, navigation, false);
            closeProfileMenu(profileButton, profileMenu);
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") {
            return;
        }

        const menuWasOpen = navigation.classList.contains("active");

        setMenuState(toggle, navigation, false);
        closeProfileMenu(profileButton, profileMenu);

        if (menuWasOpen) {
            toggle.focus();
        }
    });

    const updateScrolledState = () => {
        header.classList.toggle("scrolled", window.scrollY > 12);
    };

    updateScrolledState();

    window.addEventListener("scroll", updateScrolledState, {
        passive: true,
    });
}