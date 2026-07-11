// ===============================
// Student Signup
// ===============================

const signupForm = document.getElementById("studentSignupForm");

if (signupForm) {

    signupForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const inputs = signupForm.querySelectorAll("input");

        const fullName = inputs[0].value.trim();
        const email = inputs[1].value.trim();
        const phone = inputs[2].value.trim();
        const password = inputs[3].value;
        const confirmPassword = inputs[4].value;

        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        const { data, error } =
            await supabaseClient.auth.signUp({

                email,
                password

            });

        if (error) {

            alert(error.message);

            return;

        }

        const user = data.user;

        if (!user) {

            alert("Unable to create account.");

            return;

        }

        const { error: profileError } =
            await supabaseClient
                .from("profiles")
                .insert([

                    {

                        id: user.id,
                        full_name: fullName,
                        email: email,
                        phone: phone,
                        role: "student"

                    }

                ]);

        if (profileError) {

            alert(profileError.message);

            return;

        }

        alert("Signup successful!");

        window.location.href = "student_login.htm";

    });

}