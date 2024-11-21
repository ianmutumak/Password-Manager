"use strict";

/********* External Imports ********/
const { stringToBuffer, bufferToString, encodeBuffer, decodeBuffer, getRandomBytes } = require("./lib");
const { subtle } = require('crypto').webcrypto;
const crypto = require('crypto');

/********* Constants ********/
const PBKDF2_ITERATIONS = 100000; // Iterations for PBKDF2
const MAX_PASSWORD_LENGTH = 64;   // Max password length
const AES_IV_LENGTH = 12;         // Standard IV length for AES-GCM

/********* Implementation ********/
class Keychain {
    constructor() {
        this.data = { kvs: {} }; // Key-Value Store (KVS)
        this.secrets = {
            master_salt: null,
            master_key: null,
            hmac_key: null,
            hmac_salt: null,
            magic: null
        };
        this.ready = false;
    }

    static async init(password) {
        if (password.length > MAX_PASSWORD_LENGTH) {
            throw new Error("Password too long.");
        }

        const keychain = new Keychain();
        keychain.secrets.master_salt = crypto.randomBytes(32);
        keychain.secrets.master_key = crypto.pbkdf2Sync(password, keychain.secrets.master_salt, PBKDF2_ITERATIONS, 32, 'sha256');

        keychain.secrets.hmac_key = crypto.createHash('sha256').update(keychain.secrets.master_key).digest();
        keychain.secrets.hmac_salt = crypto.randomBytes(32);

        // Create a "magic" value to validate the password
        keychain.secrets.magic = await Keychain.encrypt("Recurse", keychain.secrets.master_key);

        keychain.ready = true;
        return keychain;
    }

    static async load(password, repr, trustedDataCheck) {
		if (password.length > MAX_PASSWORD_LENGTH) {
			throw new Error("Password too long.");
		}
	
		const parsed = JSON.parse(repr);
		const master_salt = decodeBuffer(parsed.secrets.master_salt);
	
		const master_key = crypto.pbkdf2Sync(password, master_salt, PBKDF2_ITERATIONS, 32, 'sha256');
		const magic = await Keychain.decrypt(parsed.secrets.magic, master_key);
	
		if (magic !== "Recurse") {
			throw new Error("Invalid password.");
		}
	
		if (trustedDataCheck !== undefined) {
			const checksum = crypto.createHash('sha256').update(repr).digest('hex');
			if (checksum !== trustedDataCheck) {
				throw new Error("Integrity check failed.");
			}
		}
	
		const keychain = new Keychain();
		keychain.data.kvs = parsed.kvs; // Assign the restored `kvs` to `this.data.kvs`
		keychain.secrets = {
			master_salt,
			master_key,
			hmac_key: crypto.createHash('sha256').update(master_key).digest(),
			hmac_salt: decodeBuffer(parsed.secrets.hmac_salt),
			magic: parsed.secrets.magic
		};
		keychain.ready = true;
		return keychain;
	}
	

	async dump() {
		const serialized = JSON.stringify({
			kvs: this.data.kvs, // Include kvs as a top-level key
			secrets: {
				master_salt: encodeBuffer(this.secrets.master_salt),
				hmac_salt: encodeBuffer(this.secrets.hmac_salt),
				magic: this.secrets.magic
			}
		});
		const checksum = crypto.createHash('sha256').update(serialized).digest('hex');
		return [serialized, checksum];
	}
	

    async get(name) {
        if (!this.ready) {
            throw new Error("Keychain not initialized.");
        }

        const hmac = crypto.createHmac('sha256', this.secrets.hmac_key);
        const hashedName = hmac.update(name).digest('hex');

        if (this.data.kvs[hashedName]) {
            const decrypted = await Keychain.decrypt(this.data.kvs[hashedName], this.secrets.master_key);
            if (!decrypted.startsWith(hashedName)) {
                throw new Error("Data tampering detected.");
            }
            return decrypted.slice(hashedName.length);
        }
        return null;
    }

    async set(name, password) {
        if (!this.ready) {
            throw new Error("Keychain not initialized.");
        }

        const hmac = crypto.createHmac('sha256', this.secrets.hmac_key);
        const hashedName = hmac.update(name).digest('hex');
        const combinedData = hashedName + password;
        const encrypted = await Keychain.encrypt(combinedData, this.secrets.master_key);

        this.data.kvs[hashedName] = encrypted;
    }

    async remove(name) {
        if (!this.ready) {
            throw new Error("Keychain not initialized.");
        }

        const hmac = crypto.createHmac('sha256', this.secrets.hmac_key);
        const hashedName = hmac.update(name).digest('hex');

        if (this.data.kvs[hashedName]) {
            delete this.data.kvs[hashedName];
            return true;
        }
        return false;
    }

    static async encrypt(data, key) {
        const iv = crypto.randomBytes(AES_IV_LENGTH);
        const aesKey = await subtle.importKey(
            "raw",
            key,
            "AES-GCM",
            false,
            ["encrypt"]
        );
        const encrypted = await subtle.encrypt(
            { name: "AES-GCM", iv },
            aesKey,
            stringToBuffer(data)
        );
        return encodeBuffer(iv) + encodeBuffer(encrypted);
    }

    static async decrypt(data, key) {
        const iv = decodeBuffer(data.slice(0, 16));
        const encrypted = decodeBuffer(data.slice(16));
        const aesKey = await subtle.importKey(
            "raw",
            key,
            "AES-GCM",
            false,
            ["decrypt"]
        );
        const decrypted = await subtle.decrypt(
            { name: "AES-GCM", iv },
            aesKey,
            encrypted
        );
        return bufferToString(decrypted);
    }
}

module.exports = { Keychain };
