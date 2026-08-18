import {
    createClient
} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

/*
|--------------------------------------------------------------------------
| SUPABASE CONFIGURATION
|--------------------------------------------------------------------------
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
|--------------------------------------------------------------------------
| STANDARD API HELPERS
|--------------------------------------------------------------------------
*/

function success(data = null) {
    return {
        success: true,
        data,
        error: null
    };
}

function failure(error) {
    console.error(
        "[ResiHub API]",
        error
    );

    return {
        success: false,
        data: null,
        error
    };
}


/*
|--------------------------------------------------------------------------
| AUTHENTICATION
|--------------------------------------------------------------------------
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


export function onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(
        callback
    );
}


/*
|--------------------------------------------------------------------------
| PROFILES
|--------------------------------------------------------------------------
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


export async function updateProfile(
    userId,
    updates = {}
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
            .from("profiles")
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq("id", userId)
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
|--------------------------------------------------------------------------
| UNIVERSITIES
|--------------------------------------------------------------------------
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
|--------------------------------------------------------------------------
| LISTINGS
|--------------------------------------------------------------------------
*/

export async function getListing(listingId) {
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
            .select(`
                *,
                universities (
                    *
                ),
                listing_images (
                    id,
                    listing_id,
                    image_url,
                    display_order,
                    created_at
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
    publicationStatus = "published",
    search = ""
} = {}) {
    try {
        const from =
            (page - 1) * pageSize;

        const to =
            from + pageSize - 1;

        let query = supabase
            .from("listings")
            .select(`
                *,
                universities (
                    *
                ),
                listing_images (
                    id,
                    listing_id,
                    image_url,
                    display_order,
                    created_at
                )
            `, {
                count: "exact"
            })
            .range(from, to)
            .order("created_at", {
                ascending: false
            });

        if (publicationStatus) {
            query = query.eq(
                "publication_status",
                publicationStatus
            );
        }

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

        if (search) {
            query = query.or(
                `title.ilike.%${search}%,area.ilike.%${search}%`
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
|--------------------------------------------------------------------------
| CREATE LISTING
|--------------------------------------------------------------------------
*/

export async function createListing(
    listingData = {}
) {
    try {
        const {
            data: {
                user
            },
            error: userError
        } = await supabase.auth.getUser();

        if (userError) {
            return failure(userError);
        }

        if (!user) {
            return failure(
                new Error(
                    "You must be signed in to create a listing."
                )
            );
        }

        const listing = {
            ...listingData,
            landlord_id: user.id
        };

        const {
            data,
            error
        } = await supabase
            .from("listings")
            .insert(listing)
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
|--------------------------------------------------------------------------
| UPDATE LISTING
|--------------------------------------------------------------------------
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

        const {
            data,
            error
        } = await supabase
            .from("listings")
            .update(updates)
            .eq("id", listingId)
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
|--------------------------------------------------------------------------
| DELETE LISTING
|--------------------------------------------------------------------------
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


/*
|--------------------------------------------------------------------------
| LANDLORD LISTINGS
|--------------------------------------------------------------------------
*/

export async function getLandlordListings(
    landlordId = null
) {
    try {
        if (!landlordId) {
            const {
                data: {
                    user
                }
            } = await supabase.auth.getUser();

            landlordId = user?.id;
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
            .from("listings")
            .select(`
                *,
                universities (
                    *
                ),
                listing_images (
                    *
                )
            `)
            .eq(
                "landlord_id",
                landlordId
            )
            .order("created_at", {
                ascending: false
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
|--------------------------------------------------------------------------
| LISTING IMAGES
|--------------------------------------------------------------------------
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
            .eq(
                "listing_id",
                listingId
            )
            .order("display_order", {
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


export async function addListingImage({
    listingId,
    imageUrl,
    displayOrder = 0
} = {}) {
    try {
        if (!listingId || !imageUrl) {
            return failure(
                new Error(
                    "Listing ID and image URL are required."
                )
            );
        }

        const {
            data,
            error
        } = await supabase
            .from("listing_images")
            .insert({
                listing_id: listingId,
                image_url: imageUrl,
                display_order: displayOrder
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
|--------------------------------------------------------------------------
| STORAGE
|--------------------------------------------------------------------------
*/

export async function uploadListingImage(
    file,
    filePath
) {
    try {
        if (!file) {
            return failure(
                new Error(
                    "An image file is required."
                )
            );
        }

        if (!filePath) {
            return failure(
                new Error(
                    "An image path is required."
                )
            );
        }

        const {
            data,
            error
        } = await supabase.storage
            .from("listing-images")
            .upload(
                filePath,
                file,
                {
                    cacheControl: "3600",
                    upsert: false
                }
            );

        if (error) {
            return failure(error);
        }

        const {
            data: publicData
        } = supabase.storage
            .from("listing-images")
            .getPublicUrl(data.path);

        return success({
            path: data.path,
            url: publicData.publicUrl
        });
    } catch (error) {
        return failure(error);
    }
}


export async function deleteListingImageFile(
    filePath
) {
    try {
        if (!filePath) {
            return failure(
                new Error(
                    "An image path is required."
                )
            );
        }

        const {
            error
        } = await supabase.storage
            .from("listing-images")
            .remove([
                filePath
            ]);

        if (error) {
            return failure(error);
        }

        return success(true);
    } catch (error) {
        return failure(error);
    }
}


/*
|--------------------------------------------------------------------------
| FAVORITES
|--------------------------------------------------------------------------
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
                        *
                    ),
                    listing_images (
                        *
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


/*
|--------------------------------------------------------------------------
| BOOKING REQUESTS
|--------------------------------------------------------------------------
*/

export async function getBookingRequests({
    userId,
    role = "student"
} = {}) {
    try {
        if (!userId) {
            return failure(
                new Error(
                    "A user ID is required."
                )
            );
        }

        let query = supabase
            .from("booking_requests")
            .select(`
                *,
                listings (
                    *
                )
            `);

        if (role === "landlord") {
            query = query.eq(
                "landlord_id",
                userId
            );
        } else {
            query = query.eq(
                "student_id",
                userId
            );
        }

        query = query.order(
            "created_at",
            {
                ascending: false
            }
        );

        const {
            data,
            error
        } = await query;

        if (error) {
            return failure(error);
        }

        return success(data ?? []);
    } catch (error) {
        return failure(error);
    }
}


export async function createBookingRequest(
    requestData = {}
) {
    try {
        const {
            data: {
                user
            },
            error: userError
        } = await supabase.auth.getUser();

        if (userError) {
            return failure(userError);
        }

        if (!user) {
            return failure(
                new Error(
                    "You must be signed in."
                )
            );
        }

        const {
            data,
            error
        } = await supabase
            .from("booking_requests")
            .insert({
                ...requestData,
                student_id: user.id
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


export async function updateBookingRequest(
    requestId,
    updates = {}
) {
    try {
        if (!requestId) {
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
                ...updates,
                updated_at:
                    new Date().toISOString()
            })
            .eq("id", requestId)
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
|--------------------------------------------------------------------------
| MESSAGES
|--------------------------------------------------------------------------
*/

export async function getMessages(
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
            .from("messages")
            .select(`
                *,
                listings (
                    id,
                    title
                )
            `)
            .or(
                `sender_id.eq.${userId},receiver_id.eq.${userId}`
            )
            .order("created_at", {
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


export async function sendMessage({
    receiverId,
    message,
    listingId = null
} = {}) {
    try {
        if (!receiverId || !message) {
            return failure(
                new Error(
                    "Receiver ID and message are required."
                )
            );
        }

        const {
            data: {
                user
            },
            error: userError
        } = await supabase.auth.getUser();

        if (userError) {
            return failure(userError);
        }

        if (!user) {
            return failure(
                new Error(
                    "You must be signed in."
                )
            );
        }

        const {
            data,
            error
        } = await supabase
            .from("messages")
            .insert({
                sender_id: user.id,
                receiver_id: receiverId,
                listing_id: listingId,
                message,
                is_read: false
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


export async function markMessageRead(
    messageId
) {
    try {
        const {
            data,
            error
        } = await supabase
            .from("messages")
            .update({
                is_read: true
            })
            .eq("id", messageId)
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
|--------------------------------------------------------------------------
| NOTIFICATIONS
|--------------------------------------------------------------------------
*/

export async function getNotifications(
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
            .from("notifications")
            .select("*")
            .eq(
                "user_id",
                userId
            )
            .order("created_at", {
                ascending: false
            });

        if (error) {
            return failure(error);
        }

        return success(data ?? []);
    } catch (error) {
        return failure(error);
    }
}


export async function markNotificationRead(
    notificationId
) {
    try {
        const {
            data,
            error
        } = await supabase
            .from("notifications")
            .update({
                is_read: true
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


export async function markAllNotificationsRead(
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
            error
        } = await supabase
            .from("notifications")
            .update({
                is_read: true
            })
            .eq(
                "user_id",
                userId
            )
            .eq(
                "is_read",
                false
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
|--------------------------------------------------------------------------
| REVIEWS
|--------------------------------------------------------------------------
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
            .order("created_at", {
                ascending: false
            });

        if (error) {
            return failure(error);
        }

        return success(data ?? []);
    } catch (error) {
        return failure(error);
    }
}


export async function createReview({
    listingId,
    rating,
    comment = null
} = {}) {
    try {
        if (!listingId || !rating) {
            return failure(
                new Error(
                    "Listing ID and rating are required."
                )
            );
        }

        const {
            data: {
                user
            },
            error: userError
        } = await supabase.auth.getUser();

        if (userError) {
            return failure(userError);
        }

        if (!user) {
            return failure(
                new Error(
                    "You must be signed in."
                )
            );
        }

        const {
            data,
            error
        } = await supabase
            .from("reviews")
            .insert({
                student_id: user.id,
                listing_id: listingId,
                rating,
                comment
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


export async function updateReview(
    reviewId,
    updates = {}
) {
    try {
        const {
            data,
            error
        } = await supabase
            .from("reviews")
            .update({
                ...updates,
                updated_at:
                    new Date().toISOString()
            })
            .eq("id", reviewId)
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


export async function deleteReview(
    reviewId
) {
    try {
        const {
            error
        } = await supabase
            .from("reviews")
            .delete()
            .eq("id", reviewId);

        if (error) {
            return failure(error);
        }

        return success(true);
    } catch (error) {
        return failure(error);
    }
}


/*
|--------------------------------------------------------------------------
| PUBLIC LISTING STATISTICS
|--------------------------------------------------------------------------
*/

export async function getPlatformStats() {
    try {
        const [
            listingsResult,
            studentsResult,
            landlordsResult,
            universitiesResult,
            reviewsResult
        ] = await Promise.all([
            supabase
                .from("listings")
                .select("id", {
                    count: "exact",
                    head: true
                })
                .eq(
                    "availability_status",
                    "available"
                ),

            supabase
                .from("profiles")
                .select("id", {
                    count: "exact",
                    head: true
                })
                .eq(
                    "role",
                    "student"
                ),

            supabase
                .from("profiles")
                .select("id", {
                    count: "exact",
                    head: true
                })
                .eq(
                    "role",
                    "landlord"
                ),

            supabase
                .from("universities")
                .select("id", {
                    count: "exact",
                    head: true
                }),

            supabase
                .from("reviews")
                .select("id", {
                    count: "exact",
                    head: true
                })
        ]);

        const errors = [
            listingsResult.error,
            studentsResult.error,
            landlordsResult.error,
            universitiesResult.error,
            reviewsResult.error
        ].filter(Boolean);

        if (errors.length) {
            return failure(errors[0]);
        }

        return success({
            listingCount:
                listingsResult.count ?? 0,

            studentCount:
                studentsResult.count ?? 0,

            landlordCount:
                landlordsResult.count ?? 0,

            universityCount:
                universitiesResult.count ?? 0,

            reviewCount:
                reviewsResult.count ?? 0
        });
    } catch (error) {
        return failure(error);
    }
}


/*
|--------------------------------------------------------------------------
| DEFAULT API OBJECT
|--------------------------------------------------------------------------
|
| Allows modules to import either:
|
| import { getListings } from "./api.js";
|
| OR:
|
| import { api } from "./api.js";
|
*/

export const api = {
    supabase,

    getCurrentUser,
    getCurrentSession,
    signOut,
    onAuthStateChange,

    getProfile,
    updateProfile,

    getUniversities,

    getListing,
    getListings,
    createListing,
    updateListing,
    deleteListing,
    getLandlordListings,

    getListingImages,
    addListingImage,
    deleteListingImage,

    uploadListingImage,
    deleteListingImageFile,

    getFavorites,
    addFavorite,
    removeFavorite,

    getBookingRequests,
    createBookingRequest,
    updateBookingRequest,

    getMessages,
    sendMessage,
    markMessageRead,

    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,

    getReviews,
    createReview,
    updateReview,
    deleteReview,

    getPlatformStats
};