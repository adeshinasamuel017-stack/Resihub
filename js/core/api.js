import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

/*
 * ResiHub Supabase Configuration
 */

const SUPABASE_URL = "https://gesbeavhazlydxriojkk.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_YzRc-2clLnwttApINTzPNQ_yl2_XW8g";

export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    }
);


/*
 * Standard API result helpers
 */

function success(data = null) {
    return {
        success: true,
        data,
        error: null
    };
}

function failure(error) {
    console.error("[ResiHub API]", error);

    return {
        success: false,
        data: null,
        error
    };
}


/*
 * Authentication
 */

export async function getCurrentUser() {
    try {
        const {
            data,
            error
        } = await supabase.auth.getUser();

        if (error) {
            return failure(error);
        }

        return success(data.user);
    } catch (error) {
        return failure(error);
    }
}


export async function getCurrentSession() {
    try {
        const {
            data,
            error
        } = await supabase.auth.getSession();

        if (error) {
            return failure(error);
        }

        return success(data.session);
    } catch (error) {
        return failure(error);
    }
}


export async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();

        if (error) {
            return failure(error);
        }

        return success(true);
    } catch (error) {
        return failure(error);
    }
}


/*
 * Profiles
 */

export async function getProfile(userId) {
    try {
        if (!userId) {
            return failure(
                new Error("A user ID is required.")
            );
        }

        const {
            data,
            error
        } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .maybeSingle();

        if (error) {
            return failure(error);
        }

        return success(data);
    } catch (error) {
        return failure(error);
    }
}


/*
 * Universities
 */

export async function getUniversities() {
    try {
        const {
            data,
            error
        } = await supabase
            .from("universities")
            .select("*")
            .order("name", {
                ascending: true
            });

        if (error) {
            return failure(error);
        }

        return success(data ?? []);
    } catch (error) {
        return failure(error);
    }
}


/*
 * Listings
 */

export async function getListing(listingId) {
    try {
        if (!listingId) {
            return failure(
                new Error("A listing ID is required.")
            );
        }

        const {
            data,
            error
        } = await supabase
            .from("listings")
            .select(`
                *,
                universities (
                    id,
                    name,
                    location,
                    description,
                    logo_url
                ),
                listing_images (
                    id,
                    image_url,
                    display_order
                )
            `)
            .eq("id", listingId)
            .maybeSingle();

        if (error) {
            return failure(error);
        }

        return success(data);
    } catch (error) {
        return failure(error);
    }
}


export async function getListings({
    page = 1,
    pageSize = 12,
    universityId = null,
    area = null,
    propertyType = null,
    minPrice = null,
    maxPrice = null,
    availabilityStatus = "available",
    publicationStatus = "published"
} = {}) {
    try {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
            .from("listings")
            .select(`
                *,
                universities (
                    id,
                    name,
                    location,
                    logo_url
                ),
                listing_images (
                    id,
                    image_url,
                    display_order
                )
            `, {
                count: "exact"
            })
            .eq("publication_status", publicationStatus)
            .range(from, to)
            .order("created_at", {
                ascending: false
            });

        if (availabilityStatus) {
            query = query.eq(
                "availability_status",
                availabilityStatus
            );
        }

        if (universityId) {
            query = query.eq(
                "university_id",
                universityId
            );
        }

        if (area) {
            query = query.ilike(
                "area",
                `%${area}%`
            );
        }

        if (propertyType) {
            query = query.eq(
                "property_type",
                propertyType
            );
        }

        if (minPrice !== null) {
            query = query.gte(
                "price",
                minPrice
            );
        }

        if (maxPrice !== null) {
            query = query.lte(
                "price",
                maxPrice
            );
        }

        const {
            data,
            error,
            count
        } = await query;

        if (error) {
            return failure(error);
        }

        return success({
            listings: data ?? [],
            count: count ?? 0,
            page,
            pageSize
        });
    } catch (error) {
        return failure(error);
    }
}


/*
 * Favorites
 */

export async function getFavorites(userId) {
    try {
        if (!userId) {
            return failure(
                new Error("A user ID is required.")
            );
        }

        const {
            data,
            error
        } = await supabase
            .from("favorites")
            .select(`
                *,
                listings (
                    *,
                    universities (
                        id,
                        name,
                        location,
                        logo_url
                    ),
                    listing_images (
                        id,
                        image_url,
                        display_order
                    )
                )
            `)
            .eq("student_id", userId);

        if (error) {
            return failure(error);
        }

        return success(data ?? []);
    } catch (error) {
        return failure(error);
    }
}


export async function addFavorite(studentId, listingId) {
    try {
        if (!studentId || !listingId) {
            return failure(
                new Error(
                    "Student ID and listing ID are required."
                )
            );
        }

        const {
            data,
            error
        } = await supabase
            .from("favorites")
            .insert({
                student_id: studentId,
                listing_id: listingId
            })
            .select()
            .single();

        if (error) {
            return failure(error);
        }

        return success(data);
    } catch (error) {
        return failure(error);
    }
}


export async function removeFavorite(studentId, listingId) {
    try {
        if (!studentId || !listingId) {
            return failure(
                new Error(
                    "Student ID and listing ID are required."
                )
            );
        }

        const {
            error
        } = await supabase
            .from("favorites")
            .delete()
            .eq("student_id", studentId)
            .eq("listing_id", listingId);

        if (error) {
            return failure(error);
        }

        return success(true);
    } catch (error) {
        return failure(error);
    }
}