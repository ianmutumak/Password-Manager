# Password-Manager
Cryptography CAT 2
# Password Manager

A secure and lightweight password manager built with **Node.js** and **Express**. This project allows users to securely initialize a keychain, set passwords for various sites, and retrieve them when needed. The frontend is served using **HTML**, **CSS**, and **JavaScript**, and the backend handles encryption and decryption to ensure data security.

## Features

- **Secure Encryption**: Passwords are encrypted using AES-GCM with a master password and securely stored in memory.
- **Keychain Initialization**: A master password initializes the keychain.
- **Set and Retrieve Passwords**: Add or retrieve passwords for different websites.
- **Password Reveal**: Option to toggle visibility of retrieved passwords.

## Installation

Ensure you have the following installed: [Node.js](https://nodejs.org) (v16+ recommended) and [npm](https://www.npmjs.com/) (comes with Node.js). First, clone the repository using `git clone https://github.com/ianmutumak/password-manager.git` and navigate into the directory using `cd password-manager`. Then, install the dependencies by running `npm install`. Finally, start the server using `npm start` and open the application in your browser at `http://localhost:3000`.

