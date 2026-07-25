export async function loadComponent(file, elementId) {

    try {

        const response = await fetch(file);

        if (!response.ok) {

            throw new Error(`Unable to load ${file}`);

        }

        document.getElementById(elementId).innerHTML =
            await response.text();

    } catch (error) {

        console.error(error);

    }

}