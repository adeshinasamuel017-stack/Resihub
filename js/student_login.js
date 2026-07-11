// ===============================
// Student Login
// ===============================

const loginForm = document.getElementById("studentAuthForm");

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Get the input elements
        const emailInput = document.getElementById("email");
        const passwordInput = document.getElementById("password");

        // Defensive check – prevent "null.value" errors
        if (!emailInput || !passwordInput) {
            console.error("Email or password input not found in the DOM.");
            alert("Login form is incomplete. Please reload the page.");
            return;
        }

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // Basic validation (optional)
        if (!email || !password) {
            alert("Please enter both email and password.");
            return;
        }

        // Sign in with Supabase
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            alert(error.message);
            return;
        }

        // Verify the user is a student
        const { data: profile, error: profileError } = await supabaseClient
            .from("profiles")
            .select("*")
            .eq("id", data.user.id)
            .single();

        if (profileError) {
            alert(profileError.message);
            return;
        }

        // IMPORTANT: role is stored as 'Student' (capital S) in your database
        if (profile.role !== "Student") {
            alert("This account is not registered as a student.");
            await supabaseClient.auth.signOut();
            return;
        }

        alert("Login successful!");
        window.location.href = "index.htm";
    });
}