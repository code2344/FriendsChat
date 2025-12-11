const CryptoJS = require('crypto-js');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default_key_for_development_only';

/**
 * Encrypt a message
 * @param {string} message - The plain text message
 * @returns {string} - The encrypted message
 */
function encryptMessage(message) {
  return CryptoJS.AES.encrypt(message, ENCRYPTION_KEY).toString();
}

/**
 * Decrypt a message
 * @param {string} encryptedMessage - The encrypted message
 * @returns {string} - The decrypted message
 */
function decryptMessage(encryptedMessage) {
  const bytes = CryptoJS.AES.decrypt(encryptedMessage, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

module.exports = {
  encryptMessage,
  decryptMessage
};
