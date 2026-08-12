import { loadComponents } from "./components.js";

export async function loadAdminLayout() {
    return loadComponents([
        {
            file: "../components/admin_header.htm",
            elementId: "header",
        },
        {
            file: "../components/admin_footer.htm",
            elementId: "footer",
        },
    ]);
}

await loadAdminLayout();