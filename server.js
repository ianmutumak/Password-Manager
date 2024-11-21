const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const { Keychain } = require("./password-manager");

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());

// Serve Static Files
app.use(express.static(path.join(__dirname, "public")));

// Serve index.html at "/"
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Global Keychain Instance
let keychain = null;
let trustedDataCheck = null;

// Initialize Keychain
app.post("/initialize", async (req, res) => {
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ message: "Password is required." });
    }

    try {
        keychain = await Keychain.init(password);
        const [serialized, checksum] = await keychain.dump();
        trustedDataCheck = checksum;
        res.json({ message: "Keychain initialized successfully." });
    } catch (error) {
        console.error("Error initializing keychain:", error);
        res.status(500).json({ message: "Failed to initialize keychain." });
    }
});

// Set Password for a Site
app.post("/set-password", async (req, res) => {
    const { site, password } = req.body;

    if (!keychain) {
        return res.status(400).json({ message: "Keychain is not initialized." });
    }

    if (!site || !password) {
        return res.status(400).json({ message: "Site and password are required." });
    }

    try {
        await keychain.set(site, password);
        res.json({ message: `Password for ${site} has been saved.` });
    } catch (error) {
        console.error("Error setting password for site:", error);
        res.status(500).json({ message: "Failed to save password." });
    }
});

// Get Password for a Site
app.post("/get-password", async (req, res) => {
    const { site } = req.body;

    if (!keychain) {
        return res.status(400).json({ message: "Keychain is not initialized." });
    }

    if (!site) {
        return res.status(400).json({ message: "Site is required." });
    }

    try {
        const password = await keychain.get(site);
        if (password) {
            res.json({ password });
        } else {
            res.status(404).json({ message: "Password not found for the site." });
        }
    } catch (error) {
        console.error("Error getting password for site:", error);
        res.status(500).json({ message: "Failed to retrieve password." });
    }
});

// View All Passwords
app.get("/view-passwords", async (req, res) => {
    if (!keychain) {
        return res.status(400).json({ message: "Keychain is not initialized." });
    }

    try {
        const passwords = [];
        for (const hashedName in keychain.data.kvs) {
            const encrypted = keychain.data.kvs[hashedName];
            const decrypted = await Keychain.decrypt(encrypted, keychain.secrets.master_key);
            const site = decrypted.slice(0, hashedName.length); // Extract site name
            const password = decrypted.slice(hashedName.length); // Extract password
            passwords.push({ site, password });
        }
        res.json({ passwords });
    } catch (error) {
        console.error("Error viewing passwords:", error);
        res.status(500).json({ message: "Failed to retrieve passwords." });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
