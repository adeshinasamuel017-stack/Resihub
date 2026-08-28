import {
    supabase,
    getCurrentUser,
    getListing
} from "./core/api.js";


/*
|--------------------------------------------------------------------------
| ResiHub - Edit Listing
|--------------------------------------------------------------------------
| Handles:
| - Authentication
| - Listing loading
| - Listing editing
| - Existing image management
| - New image uploads
| - Listing image records
| - Listing deletion
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| DOM ELEMENTS
|--------------------------------------------------------------------------
*/

const form = document.getElementById("editListingForm");

const listingIdInput = document.getElementById("listingId");

const propertyTitle = document.getElementById("propertyTitle");
const propertyType = document.getElementById("propertyType");
const propertyPrice = document.getElementById("propertyPrice");
const availableRooms = document.getElementById("availableRooms");

const propertyUniversity = document.getElementById("propertyUniversity");
const propertyArea = document.getElementById("propertyArea");
const propertyAddress = document.getElementById("propertyAddress");

const propertyDescription =
    document.getElementById("propertyDescription");

const propertyImages =
    document.getElementById("propertyImages");

const imageUploadZone =
    document.getElementById("imageUploadZone");

const imagePreview =
    document.getElementById("imagePreview");

const updateListingBtn =
    document.getElementById("updateListingBtn");

const deleteListingBtn =
    document.getElementById("deleteListingBtn");


/*
|--------------------------------------------------------------------------
| AMENITY ELEMENTS
|--------------------------------------------------------------------------
*/

const amenityInputs = {
    wifi: document.getElementById("wifiAmenity"),
    water: document.getElementById("waterAmenity"),
    electricity: document.getElementById("electricityAmenity"),
    security: document.getElementById("securityAmenity"),
    parking: document.getElementById("parkingAmenity"),
    kitchen: document.getElementById("kitchenAmenity"),
    bathroom: document.getElementById("bathroomAmenity"),
    furnished: document.getElementById("furnishedAmenity")
};


/*
|--------------------------------------------------------------------------
| STATE
|--------------------------------------------------------------------------
*/

let currentUser = null;
let currentListing = null;

let existingImages = [];
let newImageFiles = [];

let isSubmitting = false;
let isDeleting = false;


/*
|--------------------------------------------------------------------------
| CONSTANTS
|--------------------------------------------------------------------------
*/

const STORAGE_BUCKET = "listing-images";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const MAX_NEW_IMAGES = 10;

const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp"
];


/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function getListingIdFromUrl() {

    const params = new URLSearchParams(
        window.location.search
    );

    return params.get("id");
}


function showMessage(message, type = "error") {

    const existing =
        document.getElementById("editListingMessage");

    if (existing) {
        existing.remove();
    }

    const messageElement =
        document.createElement("div");

    messageElement.id = "editListingMessage";

    messageElement.className =
        `form-message ${type}`;

    messageElement.setAttribute(
        "role",
        "alert"
    );

    messageElement.textContent = message;

    form?.prepend(messageElement);

    messageElement.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

    if (type === "success") {

        setTimeout(() => {

            messageElement.remove();

        }, 5000);
    }
}


function setButtonLoading(button, loading, text) {

    if (!button) {
        return;
    }

    if (loading) {

        button.disabled = true;

        button.dataset.originalText =
            button.innerHTML;

        button.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"
               aria-hidden="true"></i>
            ${text}
        `;

    } else {

        button.disabled = false;

        if (button.dataset.originalText) {

            button.innerHTML =
                button.dataset.originalText;

            delete button.dataset.originalText;
        }
    }
}


function escapeHtml(value) {

    const div = document.createElement("div");

    div.textContent = value ?? "";

    return div.innerHTML;
}


/*
|--------------------------------------------------------------------------
| AUTHENTICATION
|--------------------------------------------------------------------------
*/

async function requireLandlord() {

    const result =
        await getCurrentUser();

    if (!result.success || !result.data) {

        window.location.href =
            "../auth/landlord_login.htm";

        return false;
    }

    currentUser = result.data;

    return true;
}


/*
|--------------------------------------------------------------------------
| LOAD LISTING
|--------------------------------------------------------------------------
*/

async function loadListing() {

    const listingId =
        getListingIdFromUrl();

    if (!listingId) {

        showMessage(
            "No listing ID was provided."
        );

        disableForm();

        return false;
    }

    listingIdInput.value =
        listingId;

    const result =
        await getListing(listingId);

    if (!result.success) {

        console.error(
            "Unable to load listing:",
            result.error
        );

        showMessage(
            "Unable to load this listing."
        );

        disableForm();

        return false;
    }

    if (!result.data) {

        showMessage(
            "This listing could not be found."
        );

        disableForm();

        return false;
    }

    currentListing =
        result.data;


    /*
     * SECURITY CHECK
     *
     * This prevents the current user from editing
     * another landlord's listing through the interface.
     *
     * Supabase RLS MUST also enforce this server-side.
     */

    if (
        currentListing.landlord_id !==
        currentUser.id
    ) {

        showMessage(
            "You do not have permission to edit this listing."
        );

        disableForm();

        return false;
    }


    populateListing(currentListing);

    return true;
}


/*
|--------------------------------------------------------------------------
| POPULATE FORM
|--------------------------------------------------------------------------
*/

function populateListing(listing) {

    propertyTitle.value =
        listing.title ?? "";

    propertyType.value =
        listing.property_type ?? "";

    propertyPrice.value =
        listing.price ?? "";

    availableRooms.value =
        listing.available_rooms ?? "";

    propertyArea.value =
        listing.area ?? "";

    propertyAddress.value =
        listing.address ?? "";

    propertyDescription.value =
        listing.description ?? "";


    /*
     * University
     */

    if (listing.universities) {

        propertyUniversity.value =
            listing.universities.name ?? "";

    } else {

        propertyUniversity.value = "";
    }


    /*
     * Amenities
     */

    populateAmenities(
        listing.amenities
    );


    /*
     * Existing Images
     */

    existingImages =
        Array.isArray(listing.listing_images)
            ? [...listing.listing_images]
            : [];

    existingImages.sort(
        (a, b) =>
            (a.display_order ?? 0) -
            (b.display_order ?? 0)
    );

    renderImages();
}


/*
|--------------------------------------------------------------------------
| AMENITIES
|--------------------------------------------------------------------------
*/

function populateAmenities(amenities) {

    Object.values(amenityInputs)
        .forEach(input => {

            if (input) {
                input.checked = false;
            }

        });


    if (!amenities) {
        return;
    }


    /*
     * Supports:
     *
     * {
     *   wifi: true,
     *   water: true
     * }
     */

    if (
        typeof amenities === "object" &&
        !Array.isArray(amenities)
    ) {

        Object.entries(amenities)
            .forEach(([key, value]) => {

                const input =
                    amenityInputs[key];

                if (input) {
                    input.checked =
                        Boolean(value);
                }

            });

        return;
    }


    /*
     * Also supports:
     *
     * ["wifi", "water", "security"]
     */

    if (Array.isArray(amenities)) {

        amenities.forEach(key => {

            const input =
                amenityInputs[key];

            if (input) {
                input.checked = true;
            }

        });
    }
}


function collectAmenities() {

    const amenities = {};

    Object.entries(amenityInputs)
        .forEach(([key, input]) => {

            if (input) {
                amenities[key] =
                    input.checked;
            }

        });

    return amenities;
}


/*
|--------------------------------------------------------------------------
| IMAGE VALIDATION
|--------------------------------------------------------------------------
*/

function validateImage(file) {

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {

        return {
            valid: false,
            message:
                `${file.name} is not a supported image type.`
        };
    }


    if (file.size > MAX_IMAGE_SIZE) {

        return {
            valid: false,
            message:
                `${file.name} is larger than 5MB.`
        };
    }


    return {
        valid: true
    };
}


/*
|--------------------------------------------------------------------------
| IMAGE SELECTION
|--------------------------------------------------------------------------
*/

function handleImageSelection(files) {

    const selectedFiles =
        Array.from(files);

    if (!selectedFiles.length) {
        return;
    }


    const remainingSlots =
        MAX_NEW_IMAGES -
        newImageFiles.length;


    if (remainingSlots <= 0) {

        showMessage(
            `You can upload a maximum of ${MAX_NEW_IMAGES} new images.`
        );

        return;
    }


    const filesToAdd =
        selectedFiles.slice(
            0,
            remainingSlots
        );


    for (const file of filesToAdd) {

        const validation =
            validateImage(file);

        if (!validation.valid) {

            showMessage(
                validation.message
            );

            continue;
        }

        newImageFiles.push(file);
    }


    renderImages();

    /*
     * Reset input so selecting
     * the same file again works.
     */

    propertyImages.value = "";
}


/*
|--------------------------------------------------------------------------
| IMAGE PREVIEW
|--------------------------------------------------------------------------
*/

function renderImages() {

    if (!imagePreview) {
        return;
    }

    imagePreview.innerHTML = "";


    /*
     * Existing images
     */

    existingImages.forEach(
        (image, index) => {

            const wrapper =
                createImagePreview(
                    image.image_url,
                    `Existing image ${index + 1}`,
                    () => removeExistingImage(index),
                    "Existing"
                );

            imagePreview.appendChild(
                wrapper
            );
        }
    );


    /*
     * New images
     */

    newImageFiles.forEach(
        (file, index) => {

            const objectUrl =
                URL.createObjectURL(file);

            const wrapper =
                createImagePreview(
                    objectUrl,
                    file.name,
                    () => removeNewImage(index),
                    "New"
                );

            wrapper.dataset.objectUrl =
                objectUrl;

            imagePreview.appendChild(
                wrapper
            );
        }
    );
}


function createImagePreview(
    src,
    alt,
    removeHandler,
    badgeText
) {

    const wrapper =
        document.createElement("div");

    wrapper.className =
        "image-preview-item";


    const image =
        document.createElement("img");

    image.src = src;

    image.alt = escapeHtml(alt);

    image.loading = "lazy";


    const badge =
        document.createElement("span");

    badge.className =
        "image-preview-badge";

    badge.textContent =
        badgeText;


    const removeButton =
        document.createElement("button");

    removeButton.type = "button";

    removeButton.className =
        "remove-image-btn";

    removeButton.setAttribute(
        "aria-label",
        `Remove ${alt}`
    );

    removeButton.innerHTML =
        `<i class="fa-solid fa-xmark"
            aria-hidden="true"></i>`;


    removeButton.addEventListener(
        "click",
        removeHandler
    );


    wrapper.appendChild(image);

    wrapper.appendChild(badge);

    wrapper.appendChild(removeButton);


    return wrapper;
}


/*
|--------------------------------------------------------------------------
| REMOVE EXISTING IMAGE
|--------------------------------------------------------------------------
*/

function removeExistingImage(index) {

    if (
        index < 0 ||
        index >= existingImages.length
    ) {
        return;
    }

    const confirmed =
        window.confirm(
            "Remove this image from the listing?"
        );

    if (!confirmed) {
        return;
    }

    existingImages.splice(
        index,
        1
    );

    renderImages();
}


/*
|--------------------------------------------------------------------------
| REMOVE NEW IMAGE
|--------------------------------------------------------------------------
*/

function removeNewImage(index) {

    if (
        index < 0 ||
        index >= newImageFiles.length
    ) {
        return;
    }

    newImageFiles.splice(
        index,
        1
    );

    renderImages();
}


/*
|--------------------------------------------------------------------------
| IMAGE UPLOAD
|--------------------------------------------------------------------------
*/

async function uploadNewImages(listingId) {

    const uploadedRecords = [];


    for (
        let index = 0;
        index < newImageFiles.length;
        index++
    ) {

        const file =
            newImageFiles[index];


        const extension =
            file.name
                .split(".")
                .pop()
                .toLowerCase();


        /*
         * Store images inside a folder
         * belonging to the listing.
         *
         * Example:
         *
         * listings/123/uuid.webp
         */

        const uniqueName =
            `${crypto.randomUUID()}.${extension}`;


        const filePath =
            `listings/${listingId}/${uniqueName}`;


        const {
            error: uploadError
        } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(
                filePath,
                file,
                {
                    cacheControl: "3600",
                    upsert: false,
                    contentType: file.type
                }
            );


        if (uploadError) {

            throw uploadError;
        }


        const {
            data: publicUrlData
        } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(
                filePath
            );


        const imageUrl =
            publicUrlData?.publicUrl;


        if (!imageUrl) {

            throw new Error(
                "Unable to generate image URL."
            );
        }


        uploadedRecords.push({

            listing_id: listingId,

            image_url: imageUrl,

            display_order:
                existingImages.length +
                uploadedRecords.length

        });
    }


    return uploadedRecords;
}


/*
|--------------------------------------------------------------------------
| SAVE IMAGE RECORDS
|--------------------------------------------------------------------------
*/

async function saveImageRecords(
    listingId,
    uploadedRecords
) {

    if (!uploadedRecords.length) {
        return;
    }


    const {
        error
    } = await supabase
        .from("listing_images")
        .insert(
            uploadedRecords
        );


    if (error) {

        throw error;
    }
}


/*
|--------------------------------------------------------------------------
| REMOVE OLD IMAGE RECORDS
|--------------------------------------------------------------------------
*/

async function syncExistingImages(
    listingId
) {

    /*
     * Get the IDs that should remain.
     */

    const remainingIds =
        existingImages
            .map(image => image.id)
            .filter(Boolean);


    /*
     * Get all database records
     * belonging to this listing.
     */

    const {
        data,
        error
    } = await supabase
        .from("listing_images")
        .select(
            "id, image_url"
        )
        .eq(
            "listing_id",
            listingId
        );


    if (error) {
        throw error;
    }


    const recordsToDelete =
        (data ?? []).filter(
            image =>
                !remainingIds.includes(
                    image.id
                )
        );


    if (!recordsToDelete.length) {
        return;
    }


    const ids =
        recordsToDelete.map(
            image => image.id
        );


    const {
        error: deleteError
    } = await supabase
        .from("listing_images")
        .delete()
        .in("id", ids);


    if (deleteError) {

        throw deleteError;
    }


    /*
     * Attempt to remove the actual
     * storage objects too.
     */

    await deleteStorageFiles(
        recordsToDelete
    );
}


/*
|--------------------------------------------------------------------------
| DELETE STORAGE FILES
|--------------------------------------------------------------------------
*/

async function deleteStorageFiles(
    imageRecords
) {

    if (!imageRecords.length) {
        return;
    }


    const paths = [];


    for (
        const record of imageRecords
    ) {

        const path =
            extractStoragePath(
                record.image_url
            );

        if (path) {
            paths.push(path);
        }
    }


    if (!paths.length) {
        return;
    }


    const {
        error
    } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove(paths);


    if (error) {

        /*
         * Do not fail the whole update
         * if storage cleanup fails.
         */

        console.warn(
            "Storage cleanup failed:",
            error
        );
    }
}


/*
|--------------------------------------------------------------------------
| EXTRACT STORAGE PATH
|--------------------------------------------------------------------------
*/

function extractStoragePath(
    publicUrl
) {

    if (!publicUrl) {
        return null;
    }


    const marker =
        `/storage/v1/object/public/${STORAGE_BUCKET}/`;


    const index =
        publicUrl.indexOf(marker);


    if (index === -1) {
        return null;
    }


    return decodeURIComponent(
        publicUrl.substring(
            index + marker.length
        )
    );
}


/*
|--------------------------------------------------------------------------
| UPDATE IMAGE ORDER
|--------------------------------------------------------------------------
*/

async function updateImageOrder(
    listingId
) {

    /*
     * Existing images
     */

    for (
        let index = 0;
        index < existingImages.length;
        index++
    ) {

        const image =
            existingImages[index];


        if (!image.id) {
            continue;
        }


        const {
            error
        } = await supabase
            .from("listing_images")
            .update({
                display_order: index
            })
            .eq(
                "id",
                image.id
            )
            .eq(
                "listing_id",
                listingId
            );


        if (error) {
            throw error;
        }
    }
}


/*
|--------------------------------------------------------------------------
| COLLECT FORM DATA
|--------------------------------------------------------------------------
*/

function collectFormData() {

    return {

        title:
            propertyTitle.value.trim(),

        property_type:
            propertyType.value.trim(),

        price:
            propertyPrice.value
                ? Number(propertyPrice.value)
                : null,

        available_rooms:
            availableRooms.value
                ? Number(availableRooms.value)
                : null,

        area:
            propertyArea.value.trim(),

        address:
            propertyAddress.value.trim(),

        description:
            propertyDescription.value.trim(),

        amenities:
            collectAmenities()
    };
}


/*
|--------------------------------------------------------------------------
| VALIDATE FORM
|--------------------------------------------------------------------------
*/

function validateForm(data) {

    if (!data.title) {

        return "Property title is required.";
    }


    if (!data.property_type) {

        return "Please select a property type.";
    }


    if (
        data.price !== null &&
        (
            !Number.isFinite(data.price) ||
            data.price < 0
        )
    ) {

        return "Please enter a valid property price.";
    }


    if (
        data.available_rooms !== null &&
        (
            !Number.isInteger(
                data.available_rooms
            ) ||
            data.available_rooms < 0
        )
    ) {

        return "Please enter a valid number of available rooms.";
    }


    if (!data.area) {

        return "Area is required.";
    }


    if (!data.address) {

        return "Property address is required.";
    }


    if (!data.description) {

        return "Property description is required.";
    }


    return null;
}


/*
|--------------------------------------------------------------------------
| UPDATE LISTING
|--------------------------------------------------------------------------
*/

async function handleUpdate(event) {

    event.preventDefault();


    if (
        isSubmitting ||
        !currentListing ||
        !currentUser
    ) {
        return;
    }


    isSubmitting = true;

    setButtonLoading(
        updateListingBtn,
        true,
        "Saving..."
    );


    try {

        /*
         * Re-check authentication
         */

        const authResult =
            await getCurrentUser();


        if (
            !authResult.success ||
            !authResult.data
        ) {

            throw new Error(
                "Your session has expired. Please sign in again."
            );
        }


        currentUser =
            authResult.data;


        /*
         * Ownership check
         */

        if (
            currentListing.landlord_id !==
            currentUser.id
        ) {

            throw new Error(
                "You do not have permission to edit this listing."
            );
        }


        const data =
            collectFormData();


        const validationError =
            validateForm(data);


        if (validationError) {

            throw new Error(
                validationError
            );
        }


        /*
         * Update listing
         */

        const {
            data: updatedListing,
            error: updateError
        } = await supabase
            .from("listings")
            .update({
                title: data.title,

                description:
                    data.description,

                price:
                    data.price,

                property_type:
                    data.property_type,

                area:
                    data.area,

                address:
                    data.address,

                available_rooms:
                    data.available_rooms,

                amenities:
                    data.amenities,

                updated_at:
                    new Date().toISOString()
            })
            .eq(
                "id",
                currentListing.id
            )
            .eq(
                "landlord_id",
                currentUser.id
            )
            .select()
            .single();


        if (updateError) {

            throw updateError;
        }


        if (!updatedListing) {

            throw new Error(
                "The listing could not be updated."
            );
        }


        /*
         * Remove deleted image records
         */

        await syncExistingImages(
            currentListing.id
        );


        /*
         * Upload new images
         */

        if (newImageFiles.length) {

            const uploadedRecords =
                await uploadNewImages(
                    currentListing.id
                );


            /*
             * Create listing_images records
             */

            await saveImageRecords(
                currentListing.id,
                uploadedRecords
            );
        }


        /*
         * Update image ordering
         */

        await updateImageOrder(
            currentListing.id
        );


        /*
         * Refresh listing state
         */

        currentListing =
            updatedListing;


        newImageFiles = [];


        /*
         * Reload listing so the UI
         * reflects the database.
         */

        const refreshed =
            await getListing(
                currentListing.id
            );


        if (
            refreshed.success &&
            refreshed.data
        ) {

            currentListing =
                refreshed.data;

            existingImages =
                Array.isArray(
                    refreshed.data.listing_images
                )
                    ? [...refreshed.data.listing_images]
                    : [];

            existingImages.sort(
                (a, b) =>
                    (a.display_order ?? 0) -
                    (b.display_order ?? 0)
            );

            renderImages();
        }


        showMessage(
            "Listing updated successfully.",
            "success"
        );


    } catch (error) {

        console.error(
            "Listing update failed:",
            error
        );


        showMessage(
            getFriendlyError(
                error,
                "Unable to update your listing."
            )
        );


    } finally {

        isSubmitting = false;

        setButtonLoading(
            updateListingBtn,
            false
        );
    }
}


/*
|--------------------------------------------------------------------------
| DELETE LISTING
|--------------------------------------------------------------------------
*/

async function handleDelete() {

    if (
        isDeleting ||
        !currentListing ||
        !currentUser
    ) {
        return;
    }


    const confirmed =
        window.confirm(
            "Are you sure you want to delete this listing? This action cannot be undone."
        );


    if (!confirmed) {
        return;
    }


    isDeleting = true;


    setButtonLoading(
        deleteListingBtn,
        true,
        "Deleting..."
    );


    try {

        /*
         * Re-check authentication.
         */

        const authResult =
            await getCurrentUser();


        if (
            !authResult.success ||
            !authResult.data
        ) {

            throw new Error(
                "Your session has expired."
            );
        }


        currentUser =
            authResult.data;


        /*
         * Ownership check.
         */

        if (
            currentListing.landlord_id !==
            currentUser.id
        ) {

            throw new Error(
                "You do not have permission to delete this listing."
            );
        }


        /*
         * Collect image records first.
         */

        const {
            data: images,
            error: imageFetchError
        } = await supabase
            .from("listing_images")
            .select(
                "id, image_url"
            )
            .eq(
                "listing_id",
                currentListing.id
            );


        if (imageFetchError) {
            throw imageFetchError;
        }


        /*
         * Delete listing.
         *
         * RLS should ensure that
         * only the owner can delete it.
         */

        const {
            error: deleteError
        } = await supabase
            .from("listings")
            .delete()
            .eq(
                "id",
                currentListing.id
            )
            .eq(
                "landlord_id",
                currentUser.id
            );


        if (deleteError) {

            throw deleteError;
        }


        /*
         * Delete image records.
         *
         * If your database has ON DELETE CASCADE,
         * these records may already be gone.
         */

        if (images?.length) {

            const imageIds =
                images.map(
                    image => image.id
                );


            const {
                error: imageDeleteError
            } = await supabase
                .from("listing_images")
                .delete()
                .in(
                    "id",
                    imageIds
                );


            if (imageDeleteError) {

                console.warn(
                    "Unable to clean listing image records:",
                    imageDeleteError
                );
            }


            /*
             * Storage cleanup.
             */

            await deleteStorageFiles(
                images
            );
        }


        showMessage(
            "Listing deleted successfully.",
            "success"
        );


        /*
         * Return landlord to dashboard.
         */

        setTimeout(() => {

            window.location.href =
                "./landlord_dashboard.htm";

        }, 1200);


    } catch (error) {

        console.error(
            "Listing deletion failed:",
            error
        );


        showMessage(
            getFriendlyError(
                error,
                "Unable to delete this listing."
            )
        );


    } finally {

        isDeleting = false;

        setButtonLoading(
            deleteListingBtn,
            false
        );
    }
}


/*
|--------------------------------------------------------------------------
| FRIENDLY SUPABASE ERRORS
|--------------------------------------------------------------------------
*/

function getFriendlyError(
    error,
    fallback
) {

    if (!error) {
        return fallback;
    }


    if (
        error.code === "42501"
    ) {

        return "You do not have permission to perform this action.";
    }


    if (
        error.code === "23503"
    ) {

        return "This listing is connected to other records and cannot be changed right now.";
    }


    if (
        error.code === "23505"
    ) {

        return "A duplicate record already exists.";
    }


    if (
        error.message
    ) {

        return error.message;
    }


    return fallback;
}


/*
|--------------------------------------------------------------------------
| DISABLE FORM
|--------------------------------------------------------------------------
*/

function disableForm() {

    if (!form) {
        return;
    }

    form.querySelectorAll(
        "input, select, textarea, button"
    ).forEach(
        element => {

            element.disabled = true;

        }
    );
}


/*
|--------------------------------------------------------------------------
| DRAG & DROP
|--------------------------------------------------------------------------
*/

function initDragAndDrop() {

    if (!imageUploadZone) {
        return;
    }


    [
        "dragenter",
        "dragover"
    ].forEach(eventName => {

        imageUploadZone.addEventListener(
            eventName,
            event => {

                event.preventDefault();

                event.stopPropagation();

                imageUploadZone.classList.add(
                    "drag-over"
                );
            }
        );
    });


    [
        "dragleave",
        "drop"
    ].forEach(eventName => {

        imageUploadZone.addEventListener(
            eventName,
            event => {

                event.preventDefault();

                event.stopPropagation();

                imageUploadZone.classList.remove(
                    "drag-over"
                );
            }
        );
    });


    imageUploadZone.addEventListener(
        "drop",
        event => {

            const files =
                event.dataTransfer?.files;

            if (files?.length) {

                handleImageSelection(
                    files
                );
            }
        }
    );
}


/*
|--------------------------------------------------------------------------
| FILE INPUT
|--------------------------------------------------------------------------
*/

function initImageInput() {

    propertyImages?.addEventListener(
        "change",
        event => {

            handleImageSelection(
                event.target.files
            );
        }
    );
}


/*
|--------------------------------------------------------------------------
| FORM EVENTS
|--------------------------------------------------------------------------
*/

function initEvents() {

    form?.addEventListener(
        "submit",
        handleUpdate
    );


    deleteListingBtn?.addEventListener(
        "click",
        handleDelete
    );
}


/*
|--------------------------------------------------------------------------
| CLEANUP OBJECT URLS
|--------------------------------------------------------------------------
*/

function cleanupObjectUrls() {

    if (!imagePreview) {
        return;
    }


    imagePreview
        .querySelectorAll(
            "[data-object-url]"
        )
        .forEach(element => {

            const url =
                element.dataset.objectUrl;

            if (url) {

                URL.revokeObjectURL(
                    url
                );
            }
        });
}


/*
|--------------------------------------------------------------------------
| INITIALIZATION
|--------------------------------------------------------------------------
*/

async function init() {

    if (!form) {
        return;
    }


    /*
     * Events can safely initialize
     * before the async database calls.
     */

    initEvents();

    initImageInput();

    initDragAndDrop();


    /*
     * Authentication
     */

    const authenticated =
        await requireLandlord();


    if (!authenticated) {
        return;
    }


    /*
     * Load listing
     */

    await loadListing();
}


/*
|--------------------------------------------------------------------------
| PAGE CLEANUP
|--------------------------------------------------------------------------
*/

window.addEventListener(
    "beforeunload",
    cleanupObjectUrls
);


/*
|--------------------------------------------------------------------------
| START
|--------------------------------------------------------------------------
*/

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        init,
        {
            once: true
        }
    );

} else {

    init();
}