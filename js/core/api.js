let client = null;

export function configureApi(supabaseClient) {
    client = supabaseClient || null;
}

export function isApiConfigured() {
    return client !== null;
}

function createUnavailableError() {
    const error = new Error(
        "ResiHub data services are not configured yet."
    );

    error.code = "API_NOT_CONFIGURED";

    return error;
}

function normalizeResult({ data, error }) {
    if (error) {
        throw error;
    }

    return data;
}

async function request(executor) {
    if (!client) {
        throw createUnavailableError();
    }

    try {
        return await executor(client);
    } catch (error) {
        console.error("ResiHub API request failed:", error);

        throw error;
    }
}

/*
  Add Supabase-backed methods here only after the database schema
  and Row Level Security policies have been defined.
*/

export const api = {
    async getSession() {
        return request(async (supabase) => {
            const result = await supabase.auth.getSession();

            return normalizeResult(result);
        });
    },

    async getCurrentUser() {
        return request(async (supabase) => {
            const result = await supabase.auth.getUser();

            return normalizeResult(result);
        });
    },

    async signOut() {
        return request(async (supabase) => {
            const result = await supabase.auth.signOut();

            return normalizeResult(result);
        });
    },
};