/**
 * ResiHub 2.0
 * Central API Layer
 *
 * Responsibility:
 * - Provide one communication boundary between the
 *   frontend application and Supabase.
 * - Centralize API configuration.
 * - Normalize common Supabase responses.
 * - Provide predictable errors.
 * - Prevent unconfigured API calls from crashing
 *   unrelated application features.
 *
 * This module does NOT:
 * - manipulate the DOM
 * - render UI
 * - manage page layouts
 * - contain passwords
 * - contain service-role keys
 * - enforce authorization
 * - invent database tables or columns
 *
 * Supabase Row Level Security remains the real
 * authorization boundary.
 */

let client = null;

/**
 * Configure the API layer with the application's
 * Supabase client.
 *
 * The Supabase client itself should be created by
 * the application's bootstrap/integration layer.
 *
 * @param {Object|null} supabaseClient
 */
export function configureApi(supabaseClient) {
    client = supabaseClient || null;
}

/**
 * Determine whether the API layer has been configured.
 *
 * @returns {boolean}
 */
export function isApiConfigured() {
    return client !== null;
}

/**
 * Return the currently configured Supabase client.
 *
 * This is intentionally not exported publicly.
 *
 * @returns {Object|null}
 */
function getClient() {
    return client;
}

/**
 * Create a predictable error for an unavailable API.
 *
 * @returns {Error}
 */
function createUnavailableError() {
    const error = new Error(
        "ResiHub data services are currently unavailable."
    );

    error.name = "ApiConfigurationError";
    error.code = "API_NOT_CONFIGURED";

    return error;
}

/**
 * Create a normalized API error.
 *
 * We preserve useful developer information while
 * avoiding database implementation details in the
 * user-facing message.
 *
 * @param {*} originalError
 * @returns {Error}
 */
function normalizeError(originalError) {
    if (originalError instanceof Error) {
        return originalError;
    }

    const error = new Error(
        "The ResiHub data request could not be completed."
    );

    if (
        originalError &&
        typeof originalError === "object"
    ) {
        if ("code" in originalError) {
            error.code = originalError.code;
        }

        if ("status" in originalError) {
            error.status = originalError.status;
        }
    }

    return error;
}

/**
 * Normalize a Supabase response.
 *
 * Supabase commonly returns:
 *
 * {
 *     data,
 *     error
 * }
 *
 * If an error exists, reject the request.
 *
 * @param {Object} result
 * @returns {*}
 */
function normalizeResult(result) {
    if (!result || typeof result !== "object") {
        return result;
    }

    const {
        data,
        error,
    } = result;

    if (error) {
        throw normalizeError(error);
    }

    return data;
}

/**
 * Execute an API request through the configured
 * Supabase client.
 *
 * All Supabase communication should eventually
 * pass through this boundary.
 *
 * @param {Function} executor
 * @returns {Promise<*>}
 */
async function request(executor) {
    if (!client) {
        throw createUnavailableError();
    }

    if (typeof executor !== "function") {
        throw new TypeError(
            "API request executor must be a function."
        );
    }

    try {
        return await executor(getClient());
    } catch (error) {
        const normalizedError = normalizeError(error);

        console.error(
            "[ResiHub API] Request failed:",
            {
                code: normalizedError.code,
                status: normalizedError.status,
                message: normalizedError.message,
            }
        );

        throw normalizedError;
    }
}

/**
 * Execute an API operation without throwing.
 *
 * This helper is useful for non-critical UI features
 * where the page should continue functioning even
 * if Supabase is unavailable.
 *
 * Example:
 *
 * const result = await tryRequest(
 *     () => api.getSession()
 * );
 *
 * @param {Function} executor
 * @param {*} fallback
 * @returns {Promise<*>}
 */
export async function tryRequest(
    executor,
    fallback = null
) {
    try {
        return await executor();
    } catch (error) {
        console.warn(
            "[ResiHub API] Optional request failed:",
            error
        );

        return fallback;
    }
}

/**
 * Authentication API.
 *
 * Only authentication operations that are already
 * supported by the known frontend/backend contract
 * belong here for now.
 */
export const api = Object.freeze({
    /**
     * Retrieve the current Supabase session.
     *
     * @returns {Promise<Object|null>}
     */
    async getSession() {
        return request(async (supabase) => {
            const result =
                await supabase.auth.getSession();

            return normalizeResult(result);
        });
    },

    /**
     * Retrieve the currently authenticated user.
     *
     * Supabase remains authoritative for the user.
     *
     * @returns {Promise<Object|null>}
     */
    async getCurrentUser() {
        return request(async (supabase) => {
            const result =
                await supabase.auth.getUser();

            return normalizeResult(result);
        });
    },

    /**
     * Sign the current user out.
     *
     * @returns {Promise<null>}
     */
    async signOut() {
        return request(async (supabase) => {
            const result =
                await supabase.auth.signOut();

            return normalizeResult(result);
        });
    },
});