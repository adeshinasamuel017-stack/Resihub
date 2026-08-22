import {
    createClient
} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


/*
 * ============================================================
 * SUPABASE CONFIGURATION
 * ============================================================
 */

const SUPABASE_URL =
    "https://gesbeavhazlydxriojkk.supabase.co";

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
 * ============================================================
 * STANDARD RESULT HELPERS
 * ============================================================
 */

function success(data = null) {
    return {
        success: true,
        data,
        error: null
    };
}


function failure(error) {
    const normalizedError =
        error instanceof Error
            ? error
            : new Error(
                error?.message ||
                String(error || "Unknown error.")
            );

    console.error(
        "[ResiHub API]",
        normalizedError
    );

    return {
        success: false,
        data: null,
        error: normalizedError
    };
}


/*
 * ============================================================
 * AUTHENTICATION
 * ============================================================
 */


/**
 * Get currently authenticated user.
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

        return success(data?.user ?? null);

    } catch (error) {

        return failure(error);
    }
}


/**
 * Get current Supabase session.
 */
export async function getCurrentSession() {

    try {

        const {
            data,
            error
        } = await supabase.auth.getSession();

        if (error) {
            return failure(error);
        }

        return success(data?.session ?? null);

    } catch (error) {

        return failure(error);
    }
}


/**
 * Sign out current user.
 */
export async function signOut() {

    try {

        const {
            error
        } = await supabase.auth.signOut();

        if (error) {
            return failure(error);
        }

        return success(true);

    } catch (error) {

        return failure(error);
    }
}


/**
 * Listen for authentication changes.
 *
 * Returns the Supabase subscription object.
 */
export function onAuthStateChange(callback) {

    if (typeof callback !== "function") {
        return null;
    }

    const {
        data
    } = supabase.auth.onAuthStateChange(
        callback
    );

    return data?.subscription ?? null;
}


/*
 * ============================================================
 * PROFILES
 * ============================================================
 */


/**
 * Get profile by user ID.
 */
export async function getProfile(userId) {

    try {

        if (!userId) {
            return failure(
                new Error(
                    "A user ID is required."
                )
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


/**
 * Update current user's profile.
 *
 * RLS:
 * auth.uid() = id
 */
export async function updateProfile(updates = {}) {

    try {

        if (
            !updates ||
            typeof updates !== "object" ||
            Array.isArray(updates)
        ) {
            return failure(
                new Error(
                    "Profile updates must be an object."
                )
            );
        }

        const {
            data: userData,
            error: userError
        } = await supabase.auth.getUser();

        if (userError) {
            return failure(userError);
        }

        const user = userData?.user;

        if (!user) {
            return failure(
                new Error(
                    "You must be authenticated."
                )
            );
        }

        const allowedFields = [
            "full_name",
            "phone",
            "avatar_url"
        ];

        const payload = {};

        allowedFields.forEach((field) => {

            if (
                Object.prototype.hasOwnProperty.call(
                    updates,
                    field
                )
            ) {
                payload[field] = updates[field];
            }

        });

        payload.updated_at =
            new Date().toISOString();

        const {
            data,
            error
        } = await supabase
            .from("profiles")
            .update(payload)
            .eq("id", user.id)
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


/*
 * ============================================================
 * UNIVERSITIES
 * ============================================================
 */


/**
 * Get all universities.
 */
export async function getUniversities() {

    try {

        const {
            data,
            error
        } = await supabase
            .from("universities")
            .select("*")
            .order(
                "name",
                {
                    ascending: true
                }
            );

        if (error) {
            return failure(error);
        }

        return success(data ?? []);

    } catch (error) {

        return failure(error);
    }
}


/**
 * Get one university.
 */
export async function getUniversity(
    universityId
) {

    try {

        if (!universityId) {
            return failure(
                new Error(
                    "A university ID is required."
                )
            );
        }

        const {
            data,
            error
        } = await supabase
            .from("universities")
            .select("*")
            .eq("id", universityId)
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
 * ============================================================
 * LISTINGS
 * ============================================================
 */


/**
 * Standard listing relationship.
 */
const LISTING_SELECT = `
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
        display_order,
        created_at
    )
`;


/**
 * Get a single listing.
 */
export async function getListing(
    listingId
) {

    try {

        if (!listingId) {
            return failure(
                new Error(
                    "A listing ID is required."
                )
            );
        }

        const {
            data,
            error
        } = await supabase
            .from("listings")
            .select(LISTING_SELECT)
            .eq("id", listingId)
            .maybeSingle();

        if (error) {
            return failure(error);
        }

        if (!data) {
            return failure(
                new Error(
                    "Listing not found."
                )
            );
        }

        return success(data);

    } catch (error) {

        return failure(error);
    }
}


/**
 * Get listings with filters and pagination.
 */
export async function getListings({

    page = 1,

    pageSize = 12,

    universityId = null,

    area = null,

    propertyType = null,

    minPrice = null,

    maxPrice = null,

    availabilityStatus = "available",

    publicationStatus = "published",

    sortBy = "newest"

} = {}) {

    try {

        page = Math.max(
            1,
            Number(page) || 1
        );

        pageSize = Math.min(
            50,
            Math.max(
                1,
                Number(pageSize) || 12
            )
        );

        const from =
            (page - 1) * pageSize;

        const to =
            from + pageSize - 1;

        let query = supabase
            .from("listings")
            .select(
                LISTING_SELECT,
                {
                    count: "exact"
                }
            )
            .range(from, to);


        /*
         * Publication status
         */

        if (publicationStatus) {

            query = query.eq(
                "publication_status",
                publicationStatus
            );

        }


        /*
         * Availability
         */

        if (availabilityStatus) {

            query = query.eq(
                "availability_status",
                availabilityStatus
            );

        }


        /*
         * University
         */

        if (universityId) {

            query = query.eq(
                "university_id",
                universityId
            );

        }


        /*
         * Area
         */

        if (area?.trim()) {

            query = query.ilike(
                "area",
                `%${area.trim()}%`
            );

        }


        /*
         * Property type
         */

        if (propertyType) {

            query = query.eq(
                "property_type",
                propertyType
            );

        }


        /*
         * Minimum price
         */

        if (
            minPrice !== null &&
            minPrice !== "" &&
            Number.isFinite(Number(minPrice))
        ) {

            query = query.gte(
                "price",
                Number(minPrice)
            );

        }


        /*
         * Maximum price
         */

        if (
            maxPrice !== null &&
            maxPrice !== "" &&
            Number.isFinite(Number(maxPrice))
        ) {

            query = query.lte(
                "price",
                Number(maxPrice)
            );

        }


        /*
         * Sorting
         */

        switch (sortBy) {

            case "price-low":
                query = query.order(
                    "price",
                    {
                        ascending: true,
                        nullsFirst: false
                    }
                );
                break;


            case "price-high":
                query = query.order(
                    "price",
                    {
                        ascending: false,
                        nullsFirst: false
                    }
                );
                break;


            case "oldest":
                query = query.order(
                    "created_at",
                    {
                        ascending: true
                    }
                );
                break;


            case "newest":
            default:
                query = query.order(
                    "created_at",
                    {
                        ascending: false
                    }
                );
                break;
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

            pageSize,

            totalPages:
                Math.ceil(
                    (count ?? 0) /
                    pageSize
                )

        });

    } catch (error) {

        return failure(error);
    }
}


/**
 * Create a listing for the authenticated landlord.
 *
 * RLS:
 * auth.uid() = landlord_id
 */
export async function createListing(
    listingData = {}
) {

    try {

        const {
            data: userData,
            error: userError
        } = await supabase.auth.getUser();

        if (userError) {
            return failure(userError);
        }

        const user = userData?.user;

        if (!user) {
            return failure(
                new Error(
                    "You must be logged in as a landlord."
                )
            );
        }


        const payload = {

            landlord_id: user.id,

            university_id:
                listingData.university_id ||
                null,

            title:
                listingData.title?.trim(),

            description:
                listingData.description?.trim() ||
                null,

            price:
                listingData.price !== undefined &&
                    listingData.price !== ""
                    ? Number(listingData.price)
                    : null,

            property_type:
                listingData.property_type,

            area:
                listingData.area?.trim(),

            address:
                listingData.address?.trim() ||
                null,

            phone:
                listingData.phone?.trim() ||
                null,

            availability_status:
                listingData.availability_status ||
                "available",

            available_rooms:
                listingData.available_rooms !== undefined &&
                    listingData.available_rooms !== ""
                    ? Number(
                        listingData.available_rooms
                    )
                    : null,

            amenities:
                listingData.amenities || {},

            publication_status:
                listingData.publication_status ||
                "published"

        };


        if (!payload.title) {
            return failure(
                new Error(
                    "Property title is required."
                )
            );
        }

        if (!payload.property_type) {
            return failure(
                new Error(
                    "Property type is required."
                )
            );
        }

        if (!payload.area) {
            return failure(
                new Error(
                    "Property area is required."
                )
            );
        }


        const {
            data,
            error
        } = await supabase
            .from("listings")
            .insert(payload)
            .select(LISTING_SELECT)
            .single();

        if (error) {
            return failure(error);
        }

        return success(data);

    } catch (error) {

        return failure(error);
    }
}


/**
 * Update landlord's own listing.
 *
 * RLS:
 * auth.uid() = landlord_id
 */
export async function updateListing(
    listingId,
    updates = {}
) {

    try {

        if (!listingId) {
            return failure(
                new Error(
                    "A listing ID is required."
                )
            );
        }

        const allowedFields = [

            "university_id",

            "title",

            "description",

            "price",

            "property_type",

            "area",

            "address",

            "phone",

            "availability_status",

            "available_rooms",

            "amenities",

            "publication_status"

        ];

        const payload = {};

        allowedFields.forEach(
            (field) => {

                if (
                    Object.prototype.hasOwnProperty.call(
                        updates,
                        field
                    )
                ) {
                    payload[field] =
                        updates[field];
                }

            }
        );

        payload.updated_at =
            new Date().toISOString();


        const {
            data,
            error
        } = await supabase
            .from("listings")
            .update(payload)
            .eq("id", listingId)
            .select(LISTING_SELECT)
            .single();

        if (error) {
            return failure(error);
        }

        return success(data);

    } catch (error) {

        return failure(error);
    }
}


/**
 * Delete landlord's own listing.
 */
export async function deleteListing(
    listingId
) {

    try {

        if (!listingId) {
            return failure(
                new Error(
                    "A listing ID is required."
                )
            );
        }

        const {
            error
        } = await supabase
            .from("listings")
            .delete()
            .eq("id", listingId);

        if (error) {
            return failure(error);
        }

        return success(true);

    } catch (error) {

        return failure(error);
    }
}


/**
 * Get listings owned by current landlord.
 */
export async function getMyListings() {

    try {

        const {
            data: userData,
            error: userError
        } = await supabase.auth.getUser();

        if (userError) {
            return failure(userError);
        }

        const user = userData?.user;

        if (!user) {
            return failure(
                new Error(
                    "You must be authenticated."
                )
            );
        }


        const {
            data,
            error
        } = await supabase
            .from("listings")
            .select(LISTING_SELECT)
            .eq("landlord_id", user.id)
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

        if (error) {
            return failure(error);
        }

        return success(data ?? []);

    } catch (error) {

        return failure(error);
    }
}


/*
 * ============================================================
 * LISTING IMAGES
 * ============================================================
 */


/**
 * Get images for a listing.
 */
export async function getListingImages(
    listingId
) {

    try {

        if (!listingId) {
            return failure(
                new Error(
                    "A listing ID is required."
                )
            );
        }

        const {
            data,
            error
        } = await supabase
            .from("listing_images")
            .select("*")
            .eq("listing_id", listingId)
            .order(
                "display_order",
                {
                    ascending: true
                }
            );

        if (error) {
            return failure(error);
        }

        return success(data ?? []);

    } catch (error) {

        return failure(error);
    }
}


/**
 * Save an image URL against a listing.
 *
 * The actual file upload will be handled separately
 * once the Storage bucket and policies are confirmed.
 */
export async function addListingImage({

    listingId,

    imageUrl,

    displayOrder = 0

} = {}) {

    try {

        if (!listingId) {
            return failure(
                new Error(
                    "A listing ID is required."
                )
            );
        }

        if (!imageUrl) {
            return failure(
                new Error(
                    "An image URL is required."
                )
            );
        }

        const {
            data,
            error
        } = await supabase
            .from("listing_images")
            .insert({

                listing_id:
                    listingId,

                image_url:
                    imageUrl,

                display_order:
                    Number(displayOrder) || 0

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


/**
 * Delete a listing image.
 *
 * RLS ensures the landlord owns the listing.
 */
export async function deleteListingImage(
    imageId
) {

    try {

        if (!imageId) {
            return failure(
                new Error(
                    "An image ID is required."
                )
            );
        }

        const {
            error
        } = await supabase
            .from("listing_images")
            .delete()
            .eq("id", imageId);

        if (error) {
            return failure(error);
        }

        return success(true);

    } catch (error) {

        return failure(error);
    }
}


/*
 * ============================================================
 * FAVORITES
 * ============================================================
 */


/**
 * Get current student's favorites.
 */
export async function getFavorites(
    userId
) {

    try {

        if (!userId) {
            return failure(
                new Error(
                    "A user ID is required."
                )
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
            .eq(
                "student_id",
                userId
            );

        if (error) {
            return failure(error);
        }

        return success(data ?? []);

    } catch (error) {

        return failure(error);
    }
}


/**
 * Add listing to student's favorites.
 */
export async function addFavorite(
    studentId,
    listingId
) {

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

                student_id:
                    studentId,

                listing_id:
                    listingId

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


/**
 * Remove listing from favorites.
 */
export async function removeFavorite(
    studentId,
    listingId
) {

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
            .eq(
                "student_id",
                studentId
            )
            .eq(
                "listing_id",
                listingId
            );

        if (error) {
            return failure(error);
        }

        return success(true);

    } catch (error) {

        return failure(error);
    }
}


/**
 * Check whether a listing is favorited.
 */
export async function isFavorite(
    studentId,
    listingId
) {

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
            .select("id")
            .eq(
                "student_id",
                studentId
            )
            .eq(
                "listing_id",
                listingId
            )
            .maybeSingle();

        if (error) {
            return failure(error);
        }

        return success(Boolean(data));

    } catch (error) {

        return failure(error);
    }
}


/*
 * ============================================================
 * BOOKING REQUESTS
 * ============================================================
 */


/**
 * Create inspection / booking request.
 *
 * RLS:
 * auth.uid() = student_id
 */
export async function createBookingRequest({

    listingId,

    landlordId,

    inspectionDate = null,

    message = null

} = {}) {

    try {

        const {
            data: userData,
            error: userError
        } = await supabase.auth.getUser();

        if (userError) {
            return failure(userError);
        }

        const user = userData?.user;

        if (!user) {
            return failure(
                new Error(
                    "You must be authenticated as a student."
                )
            );
        }


        if (!listingId) {
            return failure(
                new Error(
                    "A listing ID is required."
                )
            );
        }

        if (!landlordId) {
            return failure(
                new Error(
                    "A landlord ID is required."
                )
            );
        }


        const {
            data,
            error
        } = await supabase
            .from("booking_requests")
            .insert({

                student_id:
                    user.id,

                listing_id:
                    listingId,

                landlord_id:
                    landlordId,

                inspection_date:
                    inspectionDate,

                message:
                    message?.trim() ||
                    null,

                status:
                    "pending"

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


/**
 * Get student's booking requests.
 */
export async function getMyBookingRequests() {

    try {

        const {
            data: userData,
            error: userError
        } = await supabase.auth.getUser();

        if (userError) {
            return failure(userError);
        }

        const user = userData?.user;

        if (!user) {
            return failure(
                new Error(
                    "You must be authenticated."
                )
            );
        }


        const {
            data,
            error
        } = await supabase
            .from("booking_requests")
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
            .eq(
                "student_id",
                user.id
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

        if (error) {
            return failure(error);
        }

        return success(data ?? []);

    } catch (error) {

        return failure(error);
    }
}


/**
 * Get booking requests for current landlord.
 */
export async function getLandlordBookingRequests() {

    try {

        const {
            data: userData,
            error: userError
        } = await supabase.auth.getUser();

        if (userError) {
            return failure(userError);
        }

        const user = userData?.user;

        if (!user) {
            return failure(
                new Error(
                    "You must be authenticated."
                )
            );
        }


        const {
            data,
            error
        } = await supabase
            .from("booking_requests")
            .select(`
                *,
                listings (
                    id,
                    title,
                    price,
                    area,
                    property_type
                )
            `)
            .eq(
                "landlord_id",
                user.id
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

        if (error) {
            return failure(error);
        }

        return success(data ?? []);

    } catch (error) {

        return failure(error);
    }
}


/**
 * Update booking request as landlord.
 */
export async function updateBookingRequest(
    bookingId,
    status
) {

    try {

        if (!bookingId) {
            return failure(
                new Error(
                    "A booking request ID is required."
                )
            );
        }

        if (!status) {
            return failure(
                new Error(
                    "A booking status is required."
                )
            );
        }


        const {
            data,
            error
        } = await supabase
            .from("booking_requests")
            .update({

                status,

                updated_at:
                    new Date().toISOString()

            })
            .eq(
                "id",
                bookingId
            )
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


/**
 * Cancel student's booking request.
 */
export async function cancelBookingRequest(
    bookingId
) {

    try {

        if (!bookingId) {
            return failure(
                new Error(
                    "A booking request ID is required."
                )
            );
        }


        const {
            data,
            error
        } = await supabase
            .from("booking_requests")
            .update({

                status:
                    "cancelled",

                updated_at:
                    new Date().toISOString()

            })
            .eq(
                "id",
                bookingId
            )
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


/*
 * ============================================================
 * MESSAGES
 * ============================================================
 */


/**
 * Get current user's messages.
 */
export async function getMessages() {

    try {

        const {
            data: userData,
            error: userError
        } = await supabase.auth.getUser();

        if (userError) {
            return failure(userError);
        }

        const user = userData?.user;

        if (!user) {
            return failure(
                new Error(
                    "You must be authenticated."
                )
            );
        }


        const {
            data,
            error
        } = await supabase
            .from("messages")
            .select(`
                *,
                listings (
                    id,
                    title,
                    area,
                    price
                )
            `)
            .or(
                `sender_id.eq.${user.id},receiver_id.eq.${user.id}`
            )
            .order(
                "created_at",
                {
                    ascending: true
                }
            );

        if (error) {
            return failure(error);
        }

        return success(data ?? []);

    } catch (error) {

        return failure(error);
    }
}


/**
 * Send a message.
 *
 * RLS:
 * auth.uid() = sender_id
 */
export async function sendMessage({

    receiverId,

    message,

    listingId = null

} = {}) {

    try {

        const {
            data: userData,
            error: userError
        } = await supabase.auth.getUser();

        if (userError) {
            return failure(userError);
        }

        const user = userData?.user;

        if (!user) {
            return failure(
                new Error(
                    "You must be authenticated."
                )
            );
        }


        if (!receiverId) {
            return failure(
                new Error(
                    "A receiver ID is required."
                )
            );
        }

        if (!message?.trim()) {
            return failure(
                new Error(
                    "Message cannot be empty."
                )
            );
        }


        const {
            data,
            error
        } = await supabase
            .from("messages")
            .insert({

                sender_id:
                    user.id,

                receiver_id:
                    receiverId,

                listing_id:
                    listingId,

                message:
                    message.trim(),

                is_read:
                    false

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


/**
 * Mark a received message as read.
 */
export async function markMessageAsRead(
    messageId
) {

    try {

        if (!messageId) {
            return failure(
                new Error(
                    "A message ID is required."
                )
            );
        }


        const {
            data,
            error
        } = await supabase
            .from("messages")
            .update({

                is_read:
                    true

            })
            .eq(
                "id",
                messageId
            )
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


/*
 * ============================================================
 * NOTIFICATIONS
 * ============================================================
 */


/**
 * Get current user's notifications.
 */
export async function getNotifications() {

    try {

        const {
            data: userData,
            error: userError
        } = await supabase.auth.getUser();

        if (userError) {
            return failure(userError);
        }

        const user = userData?.user;

        if (!user) {
            return failure(
                new Error(
                    "You must be authenticated."
                )
            );
        }


        const {
            data,
            error
        } = await supabase
            .from("notifications")
            .select("*")
            .eq(
                "user_id",
                user.id
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

        if (error) {
            return failure(error);
        }

        return success(data ?? []);

    } catch (error) {

        return failure(error);
    }
}


/**
 * Mark notification as read.
 */
export async function markNotificationAsRead(
    notificationId
) {

    try {

        if (!notificationId) {
            return failure(
                new Error(
                    "A notification ID is required."
                )
            );
        }


        const {
            data,
            error
        } = await supabase
            .from("notifications")
            .update({

                is_read:
                    true

            })
            .eq(
                "id",
                notificationId
            )
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


/*
 * ============================================================
 * REVIEWS
 * ============================================================
 */


/**
 * Get reviews for a listing.
 */
export async function getReviews(
    listingId
) {

    try {

        if (!listingId) {
            return failure(
                new Error(
                    "A listing ID is required."
                )
            );
        }


        const {
            data,
            error
        } = await supabase
            .from("reviews")
            .select(`
                *,
                profiles (
                    id,
                    full_name,
                    avatar_url
                )
            `)
            .eq(
                "listing_id",
                listingId
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

        if (error) {
            return failure(error);
        }

        return success(data ?? []);

    } catch (error) {

        return failure(error);
    }
}


/**
 * Create a review.
 *
 * RLS:
 * auth.uid() = student_id
 */
export async function createReview({

    listingId,

    rating,

    comment = null

} = {}) {

    try {

        const {
            data: userData,
            error: userError
        } = await supabase.auth.getUser();

        if (userError) {
            return failure(userError);
        }

        const user = userData?.user;

        if (!user) {
            return failure(
                new Error(
                    "You must be authenticated."
                )
            );
        }


        if (!listingId) {
            return failure(
                new Error(
                    "A listing ID is required."
                )
            );
        }


        const numericRating =
            Number(rating);


        if (
            !Number.isInteger(
                numericRating
            ) ||
            numericRating < 1 ||
            numericRating > 5
        ) {
            return failure(
                new Error(
                    "Rating must be an integer from 1 to 5."
                )
            );
        }


        const {
            data,
            error
        } = await supabase
            .from("reviews")
            .insert({

                student_id:
                    user.id,

                listing_id:
                    listingId,

                rating:
                    numericRating,

                comment:
                    comment?.trim() ||
                    null

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


/**
 * Update student's own review.
 */
export async function updateReview(
    reviewId,
    updates = {}
) {

    try {

        if (!reviewId) {
            return failure(
                new Error(
                    "A review ID is required."
                )
            );
        }


        const payload = {};


        if (
            Object.prototype.hasOwnProperty.call(
                updates,
                "rating"
            )
        ) {

            const rating =
                Number(updates.rating);

            if (
                !Number.isInteger(rating) ||
                rating < 1 ||
                rating > 5
            ) {
                return failure(
                    new Error(
                        "Rating must be between 1 and 5."
                    )
                );
            }

            payload.rating = rating;
        }


        if (
            Object.prototype.hasOwnProperty.call(
                updates,
                "comment"
            )
        ) {

            payload.comment =
                updates.comment?.trim() ||
                null;
        }


        payload.updated_at =
            new Date().toISOString();


        const {
            data,
            error
        } = await supabase
            .from("reviews")
            .update(payload)
            .eq(
                "id",
                reviewId
            )
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


/**
 * Delete student's own review.
 */
export async function deleteReview(
    reviewId
) {

    try {

        if (!reviewId) {
            return failure(
                new Error(
                    "A review ID is required."
                )
            );
        }


        const {
            error
        } = await supabase
            .from("reviews")
            .delete()
            .eq(
                "id",
                reviewId
            );

        if (error) {
            return failure(error);
        }

        return success(true);

    } catch (error) {

        return failure(error);
    }
}


/*
 * ============================================================
 * END OF API
 * ============================================================
 */