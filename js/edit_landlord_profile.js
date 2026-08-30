// js/landlord_Profile_edit.js

import {
    supabase,
    getCurrentUser,
    getProfile
} from "./core/api.js";

import { showToast } from "./ui/toast.js";

let currentUser = null;
let currentProfile = null;

const profilePreview =
    document.getElementById("profilePreview");

const profileImage =
    document.getElementById("profileImage");

const saveButton =
    document.getElementById("saveProfileBtn");

const cancelButton =
    document.getElementById("cancelEditBtn");

const fields = {
    fullName: document.getElementById("fullName"),
    phone: document.getElementById("phone"),
    gender: document.getElementById("gender"),
    dob: document.getElementById("dob"),
    businessName: document.getElementById("businessName"),
    cacNumber: document.getElementById("cacNumber"),
    businessDescription:
        document.getElementById("businessDescription"),
    emergencyName:
        document.getElementById("emergencyName"),
    emergencyRelationship:
        document.getElementById("emergencyRelationship"),
    emergencyPhone:
        document.getElementById("emergencyPhone")
};

const email = document.getElementById("email");

function setLoading(loading) {
    if (!saveButton) return;

    saveButton.disabled = loading;

    saveButton.dataset.originalText ??=
        saveButton.innerHTML;

    saveButton.innerHTML = loading
        ? `<i class="fa-solid fa-spinner fa-spin"></i> Saving...`
        : saveButton.dataset.originalText;
}

function setValues(profile, user) {
    fields.fullName.value =
        profile.full_name || "";

    email.value =
        user.email || "";

    fields.phone.value =
        profile.phone || "";

    fields.gender.value =
        profile.gender || "";

    fields.dob.value =
        profile.date_of_birth || "";

    fields.businessName.value =
        profile.business_name || "";

    fields.cacNumber.value =
        profile.cac_number || "";

    fields.businessDescription.value =
        profile.business_description || "";

    fields.emergencyName.value =
        profile.emergency_contact_name || "";

    fields.emergencyRelationship.value =
        profile.emergency_contact_relationship || "";

    fields.emergencyPhone.value =
        profile.emergency_contact_phone || "";

    profilePreview.src =
        profile.avatar_url ||
        "../assets/images/default-avatar.png";
}

async function init() {
    const result = await getCurrentUser();

    if (!result.success || !result.data) {
        window.location.href =
            "../auth/landlord_login.htm";
        return;
    }

    currentUser = result.data;

    const profileResult =
        await getProfile(currentUser.id);

    if (!profileResult.success) {
        showToast("Unable to load your profile.", {
            type: "error"
        });
        return;
    }

    currentProfile =
        profileResult.data || {};

    setValues(
        currentProfile,
        currentUser
    );

    profileImage?.addEventListener(
        "change",
        previewImage
    );

    saveButton?.addEventListener(
        "click",
        saveProfile
    );

    cancelButton?.addEventListener(
        "click",
        () => window.history.back()
    );
}

function previewImage() {
    const file = profileImage.files?.[0];

    if (!file) return;

    const allowed = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!allowed.includes(file.type)) {
        showToast(
            "Please select a JPG, PNG or WebP image.",
            { type: "error" }
        );
        profileImage.value = "";
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showToast(
            "Profile image must be 5 MB or smaller.",
            { type: "error" }
        );
        profileImage.value = "";
        return;
    }

    profilePreview.src =
        URL.createObjectURL(file);
}

async function uploadAvatar(file) {
    if (!file) {
        return currentProfile.avatar_url || null;
    }

    const extension =
        file.name.split(".").pop().toLowerCase();

    const path =
        `${currentUser.id}/avatar.${extension}`;

    const { error: uploadError } =
        await supabase.storage
            .from("profile-images")
            .upload(
                path,
                file,
                {
                    upsert: true,
                    contentType: file.type
                }
            );

    if (uploadError) {
        throw uploadError;
    }

    const { data } =
        supabase.storage
            .from("profile-images")
            .getPublicUrl(path);

    return data.publicUrl;
}

async function saveProfile() {
    try {
        setLoading(true);

        const avatarUrl =
            await uploadAvatar(
                profileImage.files?.[0]
            );

        const updates = {
            full_name:
                fields.fullName.value.trim() || null,

            phone:
                fields.phone.value.trim() || null,

            gender:
                fields.gender.value || null,

            date_of_birth:
                fields.dob.value || null,

            business_name:
                fields.businessName.value.trim() || null,

            cac_number:
                fields.cacNumber.value.trim() || null,

            business_description:
                fields.businessDescription.value.trim() || null,

            emergency_contact_name:
                fields.emergencyName.value.trim() || null,

            emergency_contact_relationship:
                fields.emergencyRelationship.value.trim() || null,

            emergency_contact_phone:
                fields.emergencyPhone.value.trim() || null,

            avatar_url:
                avatarUrl
        };

        const { error } =
            await supabase
                .from("profiles")
                .update(updates)
                .eq("id", currentUser.id);

        if (error) {
            throw error;
        }

        showToast(
            "Profile updated successfully.",
            { type: "success" }
        );

        currentProfile = {
            ...currentProfile,
            ...updates
        };

        profileImage.value = "";

    } catch (error) {
        console.error(error);

        showToast(
            "Unable to save your profile.",
            { type: "error" }
        );
    } finally {
        setLoading(false);
    }
}

init();