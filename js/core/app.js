import { initAccessibility } from "../ui/accessibility.js";
import { initAnimations } from "../ui/animations.js";
import { initModal } from "../ui/modal.js";
import { initNavigation } from "../ui/navigation.js";
import { initTheme } from "../ui/theme.js";

function getPageArea() {
    const segments = window.location.pathname
        .toLowerCase()
        .split("/")
        .filter(Boolean);

    return segments.at(-2) || "general";
}

async function loadLayout() {
    const area = getPageArea();

    const loaders = {
        admin: "./loadAdmin.js",
        general: "./loadGeneral.js",
        landlord: "./loadLandlord.js",
        student: "./loadStudent.js",
        system: "./loadGeneral.js",
    };

    const loaderPath = loaders[area];

    if (!loaderPath || !document.getElementById("header")) {
        return false;
    }

    try {
        await import(loaderPath);
        return true;
    } catch (error) {
        console.error("Unable to load ResiHub layout:", error);
        return false;
    }
}

async function initPageModule() {
    /*
      Page modules will be added here later.
  
      Example:
      if (getPageArea() === "general" &&
          window.location.pathname.endsWith("browse_rooms.htm")) {
        const { initBrowseRooms } = await import(
          "../pages/general/browse-rooms.js"
        );
  
        initBrowseRooms();
      }
    */
}

async function initApp() {
    try {
        initTheme();
        initAccessibility();

        await loadLayout();

        initNavigation();
        initModal();
        initAnimations();

        await initPageModule();
    } catch (error) {
        console.error("ResiHub could not finish initializing:", error);
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp, {
        once: true,
    });
} else {
    initApp();
}