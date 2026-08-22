import { initAccessibility } from "../ui/accessibility.js";
import { initAnimations } from "../ui/animations.js";
import { initModal } from "../ui/modal.js";
import { initNavigation } from "../ui/navigation.js";
import { initTheme } from "../ui/theme.js";

/*
|--------------------------------------------------------------------------
| Detect current application area
|--------------------------------------------------------------------------
*/

function getPageArea() {
    const path = window.location.pathname
        .replace(/\\/g, "/")
        .toLowerCase();

    const segments = path
        .split("/")
        .filter(Boolean);

    /*
     * Example:
     * /general/browse_rooms.htm
     *              ↑
     *          general
     *
     * /student/inspection_request.htm
     *              ↑
     *          student
     */

    if (segments.includes("admin")) {
        return "admin";
    }

    if (segments.includes("landlord")) {
        return "landlord";
    }

    if (segments.includes("student")) {
        return "student";
    }

    /*
     * Pages inside /general/
     */
    if (segments.includes("general")) {
        return "general";
    }

    /*
     * Root/general pages
     */
    return "general";
}

/*
|--------------------------------------------------------------------------
| Load Header + Footer
|--------------------------------------------------------------------------
*/

async function loadLayout() {
    const area = getPageArea();

    const loaders = {
        admin: "./loadAdmin.js",
        general: "./loadGeneral.js",
        landlord: "./loadLandlord.js",
        student: "./loadStudent.js",
    };

    const loaderPath = loaders[area];

    if (!loaderPath) {
        console.warn(
            `[ResiHub] No layout loader found for area: ${area}`
        );

        return false;
    }

    /*
     * The HTML page must contain these containers.
     */
    const header = document.getElementById("header");
    const footer = document.getElementById("footer");

    if (!header) {
        console.warn(
            '[ResiHub] Header container "#header" was not found.'
        );

        return false;
    }

    if (!footer) {
        console.warn(
            '[ResiHub] Footer container "#footer" was not found.'
        );
    }

    try {
        /*
         * The loader imports component.js and loads
         * the correct header/footer HTML.
         */
        const module = await import(loaderPath);

        /*
         * Explicitly call the correct loader.
         * This avoids relying on top-level await side effects.
         */
        if (area === "admin" && module.loadAdminLayout) {
            await module.loadAdminLayout();
        }

        if (area === "general" && module.loadGeneralLayout) {
            await module.loadGeneralLayout();
        }

        if (area === "landlord" && module.loadLandlordLayout) {
            await module.loadLandlordLayout();
        }

        if (area === "student" && module.loadStudentLayout) {
            await module.loadStudentLayout();
        }

        return true;

    } catch (error) {
        console.error(
            `[ResiHub] Unable to load ${area} layout:`,
            error
        );

        return false;
    }
}

/*
|--------------------------------------------------------------------------
| Initialize Application
|--------------------------------------------------------------------------
|
| Page-specific behavior is NOT handled here. Every HTML page loads its
| own module directly via a second <script type="module" src="../js/
| <page-name>.js"> tag after this file (e.g. room_details.htm loads
| js/room_details.js). That flat-file convention is already established
| across all ~45 pages, so app.js only sets up the global systems that
| every page needs.
|--------------------------------------------------------------------------
*/

async function initApp() {

    try {

        /*
         * Global UI
         */
        initTheme();

        initAccessibility();

        /*
         * IMPORTANT:
         * Header and footer MUST load before
         * navigation is initialized.
         */
        await loadLayout();

        /*
         * Now that the header exists in the DOM,
         * navigation can safely find it.
         */
        initNavigation();

        initModal();

        initAnimations();

        console.info(
            "[ResiHub] Application initialized successfully."
        );

    } catch (error) {

        console.error(
            "[ResiHub] Application initialization failed:",
            error
        );

    }
}

/*
|--------------------------------------------------------------------------
| Start Application
|--------------------------------------------------------------------------
*/

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        initApp,
        {
            once: true,
        }
    );

} else {

    initApp();

}