/**
 * ResiHub 2.0
 * Application Entry Point
 *
 * Responsibility:
 * - Bootstrap the ResiHub application
 * - Initialize global modules
 * - Detect the current page
 * - Load page-specific modules
 * - Isolate initialization failures
 *
 * This file is an orchestrator.
 *
 * It should NOT:
 * - contain page-specific business logic
 * - contain Supabase queries
 * - manipulate large sections of the DOM
 * - become a giant script
 */

import {
    getState,
    setState,
} from "./state.js";

import {
    getTheme,
} from "./storage.js";

import {
    configureApi,
} from "./api.js";

/**
 * Global modules.
 *
 * These are loaded dynamically so that app.js remains
 * lightweight and individual modules remain responsible
 * for their own behavior.
 */
const GLOBAL_MODULES = [
    {
        name: "accessibility",
        loader: () =>
            import("../ui/accessibility.js"),
    },

    {
        name: "navigation",
        loader: () =>
            import("../ui/navigation.js"),
    },

    {
        name: "theme",
        loader: () =>
            import("../ui/theme.js"),
    },

    {
        name: "animations",
        loader: () =>
            import("../ui/animations.js"),
    },

    {
        name: "modal",
        loader: () =>
            import("../ui/modal.js"),
    },

    {
        name: "toast",
        loader: () =>
            import("../ui/toast.js"),
    },
];

/**
 * Page module registry.
 *
 * IMPORTANT:
 * Only modules that actually exist should be added here.
 *
 * We will expand this registry gradually as the
 * corresponding page modules are implemented.
 */
const PAGE_MODULES = [
    {
        name: "home",
        matches: [
            "/index.htm",
            "/index.html",
            "/general/index.htm",
            "/general/index.html",
        ],
        loader: () =>
            import("../pages/home.js"),
    },

    {
        name: "browse",
        matches: [
            "/browse.htm",
            "/browse.html",
            "/general/browse.htm",
            "/general/browse.html",
            "/browse_rooms.htm",
            "/browse_rooms.html",
        ],
        loader: () =>
            import("../student/student-browse.js"),
    },

    {
        name: "room-details",
        matches: [
            "/room_details.htm",
            "/room_details.html",
            "/general/room_details.htm",
            "/general/room_details.html",
        ],
        loader: () =>
            import("../pages/room-details.js"),
    },

    {
        name: "universities",
        matches: [
            "/universities.htm",
            "/universities.html",
            "/general/universities.htm",
            "/general/universities.html",
        ],
        loader: () =>
            import("../pages/universities.js"),
    },

    {
        name: "student-dashboard",
        matches: [
            "/student_dashboard.htm",
            "/student_dashboard.html",
            "/student/dashboard.htm",
            "/student/dashboard.html",
        ],
        loader: () =>
            import("../student/student-dashboard.js"),
    },

    {
        name: "landlord-dashboard",
        matches: [
            "/landlord_dashboard.htm",
            "/landlord_dashboard.html",
            "/landlord/dashboard.htm",
            "/landlord/dashboard.html",
        ],
        loader: () =>
            import("../landlord/landlord-dashboard.js"),
    },

    {
        name: "admin-dashboard",
        matches: [
            "/admin_dashboard.htm",
            "/admin_dashboard.html",
            "/admin/admin_dashboard.htm",
            "/admin/admin_dashboard.html",
        ],
        loader: () =>
            import("../admin/admin-dashboard.js"),
    },
];

/**
 * Prevent duplicate application initialization.
 */
let initialized = false;

/**
 * Return the current page path.
 *
 * @returns {string}
 */
function getCurrentPath() {
    if (
        typeof window === "undefined" ||
        !window.location
    ) {
        return "";
    }

    return window.location.pathname
        .replace(/\\/g, "/")
        .toLowerCase();
}

/**
 * Check whether a page definition matches the
 * current pathname.
 *
 * @param {Object} page
 * @param {string} pathname
 * @returns {boolean}
 */
function pageMatches(page, pathname) {
    if (
        !page ||
        !Array.isArray(page.matches)
    ) {
        return false;
    }

    return page.matches.some((match) => {
        const normalizedMatch = match
            .replace(/\\/g, "/")
            .toLowerCase();

        return pathname.endsWith(normalizedMatch);
    });
}

/**
 * Safely initialize a module.
 *
 * A failure in one module must not prevent other
 * independent modules from starting.
 *
 * @param {Object} definition
 * @returns {Promise<*>}
 */
async function initializeModule(definition) {
    if (
        !definition ||
        typeof definition.loader !== "function"
    ) {
        return null;
    }

    try {
        const module =
            await definition.loader();

        if (
            module &&
            typeof module.init === "function"
        ) {
            await module.init();
        }

        return module;
    } catch (error) {
        console.error(
            `[ResiHub] Failed to initialize ${definition.name}:`,
            error
        );

        return null;
    }
}

/**
 * Initialize global UI modules.
 *
 * @returns {Promise<void>}
 */
async function initializeGlobalModules() {
    await Promise.all(
        GLOBAL_MODULES.map(
            (module) =>
                initializeModule(module)
        )
    );
}

/**
 * Initialize the page-specific module.
 *
 * Only the matching page module is loaded.
 *
 * @returns {Promise<void>}
 */
async function initializePageModule() {
    const pathname = getCurrentPath();

    const page = PAGE_MODULES.find(
        (definition) =>
            pageMatches(
                definition,
                pathname
            )
    );

    if (!page) {
        return;
    }

    await initializeModule(page);
}

/**
 * Synchronize initial theme state.
 *
 * The theme module remains responsible for the
 * actual DOM theme attribute.
 *
 * State only records the application value.
 */
function initializeThemeState() {
    const theme = getTheme();

    setState({
        theme,
    });
}

/**
 * Initialize basic application state.
 */
function initializeApplicationState() {
    const currentState = getState();

    setState({
        isAuthenticated:
            Boolean(
                currentState.user
            ),
    });
}

/**
 * Initialize the ResiHub application.
 *
 * @returns {Promise<void>}
 */
export async function init() {
    if (initialized) {
        return;
    }

    initialized = true;

    try {
        initializeApplicationState();

        initializeThemeState();

        /*
         * Global modules should initialize independently.
         * A failure in one must not stop another.
         */
        await initializeGlobalModules();

        /*
         * Page-specific functionality is initialized
         * only after the global application layer exists.
         */
        await initializePageModule();

        console.info(
            "[ResiHub] Application initialized."
        );
    } catch (error) {
        /*
         * This is the final safety boundary.
         *
         * Local UI should remain usable even if an
         * application-level initialization problem occurs.
         */
        console.error(
            "[ResiHub] Application initialization failed:",
            error
        );
    }
}

/**
 * Optional API bootstrap hook.
 *
 * The actual Supabase client will be supplied once
 * the project's Supabase configuration is confirmed.
 *
 * We deliberately do NOT create a Supabase client
 * here using guessed credentials.
 *
 * @param {Object|null} supabaseClient
 */
export function configureSupabase(
    supabaseClient
) {
    configureApi(supabaseClient);
}

/**
 * Automatically initialize when this module is
 * loaded in a browser.
 */
if (
    typeof document !== "undefined"
) {
    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            () => {
                init();
            },
            {
                once: true,
            }
        );
    } else {
        init();
    }
}