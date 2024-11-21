// Initialize Keychain
document.getElementById("initializeBtn").addEventListener("click", async () => {
    const password = document.getElementById("password").value;
    const messageElement = document.getElementById("message");

    console.log("Initialize button clicked. Password:", password); // Debug log

    try {
        const response = await fetch("/initialize", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ password }),
        });

        const data = await response.json();
        console.log("Response from server:", data); // Debug log

        if (response.ok) {
            messageElement.textContent = data.message;
        } else {
            messageElement.textContent = data.message;
        }
    } catch (error) {
        console.error("Error initializing keychain:", error);
        messageElement.textContent = "Error initializing keychain.";
    }
});

// Set Password for a Site
document.getElementById("setPasswordBtn").addEventListener("click", async () => {
    const site = document.getElementById("site").value;
    const password = document.getElementById("sitePassword").value;
    const messageElement = document.getElementById("message");

    console.log("Set password button clicked. Site:", site, "Password:", password); // Debug log

    try {
        const response = await fetch("/set-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ site, password }),
        });

        const data = await response.json();
        console.log("Response from server:", data); // Debug log

        if (response.ok) {
            messageElement.textContent = data.message;
        } else {
            messageElement.textContent = data.message;
        }
    } catch (error) {
        console.error("Error setting password for site:", error);
        messageElement.textContent = "Error setting password for site.";
    }
});

// Get Password for a Site
document.getElementById("getPasswordBtn").addEventListener("click", async () => {
    const site = document.getElementById("getSite").value;
    const messageElement = document.getElementById("message");

    console.log("Get password button clicked. Site:", site); // Debug log

    try {
        const response = await fetch("/get-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ site }),
        });

        const data = await response.json();
        console.log("Response from server:", data); // Debug log

        if (response.ok) {
            messageElement.textContent = `Password for ${site}: ${data.password}`;
            console.log("Decrypted data:", data.password); // Log decrypted data
        } else {
            messageElement.textContent = data.message;
        }
    } catch (error) {
        console.error("Error getting password for site:", error);
        messageElement.textContent = "Error getting password for site.";
    }
});

// View All Passwords
document.getElementById("viewPasswordsBtn").addEventListener("click", async () => {
    const passwordsElement = document.getElementById("passwords");

    console.log("View all passwords button clicked."); // Debug log

    try {
        const response = await fetch("/view-passwords", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        const data = await response.json();
        console.log("Response from server:", data); // Debug log

        if (response.ok) {
            passwordsElement.innerHTML = "<h3>Saved Passwords:</h3>";
            data.passwords.forEach((entry) => {
                passwordsElement.innerHTML += `<p>Site: ${entry.site}, Password: ${entry.password}</p>`;
                console.log("Decrypted data for site:", entry.site, "Password:", entry.password); // Log decrypted data
            });
        } else {
            passwordsElement.textContent = data.message;
        }
    } catch (error) {
        console.error("Error viewing passwords:", error);
        passwordsElement.textContent = "Error viewing passwords.";
    }
});

// Reveal Password
document.getElementById("revealPasswordBtn").addEventListener("click", () => {
    const passwordContainer = document.getElementById("password-container");

    // Toggle password visibility
    if (passwordContainer.style.fontWeight === "600") {
        passwordContainer.style.fontWeight = "normal"; // Hide password (if revealed)
    } else {
        passwordContainer.style.fontWeight = "600"; // Reveal password
    }
});

// Function to log and display character strength
function logCharacterStrength(password) {
    const length = password.length;
    let strength = "Weak";

    if (length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) {
        strength = "Strong";
    } else if (length >= 6) {
        strength = "Moderate";
    }

    console.log("Character strength:", strength); // Log character strength

    // Update the password strength element in the GUI
    const passwordStrengthElement = document.getElementById("passwordStrength");
    passwordStrengthElement.textContent = `Password Strength: ${strength}`;
}

// Example usage of logCharacterStrength function
document.getElementById("sitePassword").addEventListener("input", (event) => {
    logCharacterStrength(event.target.value);
});
