const state = {
    user: null,
    role: "guest",
    isAuthenticated: false,
    theme: "azure",
    reducedMotion: window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches,
    search: {
        query: "",
        university: "",
        area: "",
        propertyType: "",
        minPrice: null,
        maxPrice: null,
        amenities: [],
        availability: "",
        sortBy: "newest",
        page: 1,
    },
    ui: {
        activeModalId: null,
        activeMenuId: null,
        isNavigationOpen: false,
        isLoading: false,
    },
};

const listeners = new Set();

function notify() {
    const snapshot = getState();

    listeners.forEach((listener) => {
        listener(snapshot);
    });
}

export function getState() {
    return structuredClone(state);
}

export function setState(updates) {
    Object.assign(state, updates);
    notify();
}

export function updateState(path, value) {
    const keys = path.split(".");
    let target = state;

    for (let index = 0; index < keys.length - 1; index += 1) {
        const key = keys[index];

        if (
            typeof target[key] !== "object" ||
            target[key] === null
        ) {
            target[key] = {};
        }

        target = target[key];
    }

    target[keys.at(-1)] = value;
    notify();
}

export function subscribe(listener) {
    listeners.add(listener);

    return () => {
        listeners.delete(listener);
    };
}