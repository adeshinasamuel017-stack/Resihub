export async function loadComponent(file, elementId) {
    const target = document.getElementById(elementId);

    if (!target) {
        console.warn(`Component target "#${elementId}" was not found.`);
        return false;
    }

    try {
        const response = await fetch(file);

        if (!response.ok) {
            throw new Error(`Unable to load ${file} (${response.status})`);
        }

        target.innerHTML = await response.text();

        return true;
    } catch (error) {
        console.error(`Unable to load component "${file}":`, error);

        return false;
    }
}

export async function loadComponents(components) {
    const results = await Promise.all(
        components.map(({ file, elementId }) => loadComponent(file, elementId))
    );

    return results.every(Boolean);
}