/**
 * AeroMate Secure Travel Wallet - Offline Encrypted Storage Service
 *
 * Implements client-side AES-GCM-256 encryption via Web Crypto API with PBKDF2 key derivation.
 * Stores encrypted document metadata & payloads in IndexedDB (`aeromate_wallet_db`).
 * Kept completely separate from Service Worker Cache Storage to guarantee privacy.
 */

const DB_NAME = 'aeromate_wallet_db';
const DB_VERSION = 1;
const STORE_DOCS = 'offline_documents';
const STORE_SECURITY = 'wallet_security';

/**
 * Open or upgrade IndexedDB database
 */
function openWalletDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported on this browser or platform.'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_DOCS)) {
        db.createObjectStore(STORE_DOCS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SECURITY)) {
        db.createObjectStore(STORE_SECURITY, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open wallet database'));
  });
}

/**
 * Derive AES-GCM 256-bit encryption key from a user PIN using PBKDF2 (100,000 rounds)
 */
async function deriveKeyFromPin(pin, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    'PBKDF2',
    false,
    ['deriveKey', 'deriveBits']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Get or generate device security salt
 */
async function getDeviceSalt(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SECURITY, 'readwrite');
    const store = tx.objectStore(STORE_SECURITY);
    const req = store.get('salt');

    req.onsuccess = () => {
      if (req.result && req.result.value) {
        resolve(new Uint8Array(req.result.value));
      } else {
        const newSalt = window.crypto.getRandomValues(new Uint8Array(16));
        store.put({ key: 'salt', value: Array.from(newSalt) });
        resolve(newSalt);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Check if a Wallet PIN is set
 */
export async function isWalletPinSet() {
  try {
    const db = await openWalletDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_SECURITY, 'readonly');
      const store = tx.objectStore(STORE_SECURITY);
      const req = store.get('pin_verifier');
      req.onsuccess = () => resolve(!!req.result);
      req.onerror = () => resolve(false);
    });
  } catch (err) {
    return false;
  }
}

/**
 * Set or change the Wallet Security PIN
 */
export async function setWalletPin(newPin) {
  if (!newPin || newPin.length < 4) {
    throw new Error('PIN must be at least 4 digits');
  }

  const db = await openWalletDB();
  const salt = await getDeviceSalt(db);
  const key = await deriveKeyFromPin(newPin, salt);

  // Encrypt a known verification string to test PIN correctness later
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const verificationPayload = enc.encode('AEROMATE_PIN_VALIDATED_' + Date.now());

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    verificationPayload
  );

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SECURITY, 'readwrite');
    const store = tx.objectStore(STORE_SECURITY);
    store.put({
      key: 'pin_verifier',
      iv: Array.from(iv),
      verifier: Array.from(new Uint8Array(ciphertext)),
      updatedAt: new Date().toISOString()
    });

    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Verify user entered PIN
 */
export async function verifyWalletPin(pin) {
  try {
    const db = await openWalletDB();
    const verifierRecord = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SECURITY, 'readonly');
      const store = tx.objectStore(STORE_SECURITY);
      const req = store.get('pin_verifier');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    if (!verifierRecord) return true; // No PIN configured yet

    const salt = await getDeviceSalt(db);
    const key = await deriveKeyFromPin(pin, salt);

    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(verifierRecord.iv) },
      key,
      new Uint8Array(verifierRecord.verifier)
    );

    const dec = new TextDecoder();
    const str = dec.decode(decrypted);
    return str.startsWith('AEROMATE_PIN_VALIDATED_');
  } catch (err) {
    return false; // Decryption failed or incorrect PIN
  }
}

/**
 * Encrypt and store document for offline use
 * @param {Object} document - Complete document object including files
 * @param {string} pin - User's wallet security PIN
 */
export async function saveDocumentOffline(document, pin = '1234', userId = null) {
  if (!document || !document.id) {
    throw new Error('Valid document with an ID is required.');
  }

  const db = await openWalletDB();
  const salt = await getDeviceSalt(db);
  const key = await deriveKeyFromPin(pin, salt);

  // Encrypt the full document payload including files, base64 or URLs
  const enc = new TextEncoder();
  const rawPayload = enc.encode(JSON.stringify(document));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    rawPayload
  );

  // Store unencrypted safe summary (no sensitive IDs) for list views, and encrypted payload
  const offlineRecord = {
    id: document.id,
    user_id: userId || document.user_id || 'anonymous',
    title: document.title,
    category: document.category,
    doc_type: document.doc_type,
    issuing_country: document.issuing_country,
    expiry_date: document.expiry_date,
    masked_number: document.masked_number || null,
    is_offline_available: true,
    saved_offline_at: new Date().toISOString(),
    // Encrypted binary store
    encrypted_payload: {
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(ciphertext))
    }
  };

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_DOCS, 'readwrite');
      const store = tx.objectStore(STORE_DOCS);
      const req = store.put(offlineRecord);

      req.onsuccess = () => resolve(offlineRecord);
      req.onerror = () => {
        if (req.error && req.error.name === 'QuotaExceededError') {
          reject(new Error('Device storage quota exceeded. Please free up space on your device.'));
        } else {
          reject(req.error || new Error('Could not save document offline.'));
        }
      };
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Retrieve all offline documents list (metadata) strictly for the authenticated user
 */
export async function getOfflineDocumentsList(userId = null) {
  try {
    const db = await openWalletDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_DOCS, 'readonly');
      const store = tx.objectStore(STORE_DOCS);
      const req = store.getAll();

      req.onsuccess = () => {
        let records = req.result || [];
        if (userId) {
          records = records.filter(r => r.user_id === userId);
        }
        // Map to document summary items
        resolve(records.map(r => ({
          id: r.id,
          user_id: r.user_id,
          title: r.title,
          category: r.category,
          doc_type: r.doc_type,
          issuing_country: r.issuing_country,
          expiry_date: r.expiry_date,
          masked_number: r.masked_number,
          is_offline_available: true,
          saved_offline_at: r.saved_offline_at
        })));
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not read offline documents list:', err);
    return [];
  }
}

/**
 * Decrypt and retrieve a full offline document
 */
export async function getOfflineDocument(id, pin = '1234', userId = null) {
  const db = await openWalletDB();
  const record = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DOCS, 'readonly');
    const store = tx.objectStore(STORE_DOCS);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  if (!record || !record.encrypted_payload) {
    throw new Error('Offline document not found on this device.');
  }

  if (userId && record.user_id && record.user_id !== userId) {
    throw new Error('Unauthorized: This document belongs to another passenger account.');
  }

  const salt = await getDeviceSalt(db);
  const key = await deriveKeyFromPin(pin, salt);

  try {
    const decryptedBytes = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(record.encrypted_payload.iv) },
      key,
      new Uint8Array(record.encrypted_payload.data)
    );

    const dec = new TextDecoder();
    const jsonStr = dec.decode(decryptedBytes);
    return JSON.parse(jsonStr);
  } catch (err) {
    throw new Error('Failed to decrypt offline document. Incorrect PIN or corrupted data.');
  }
}

/**
 * Remove an offline copy from device IndexedDB
 */
export async function removeOfflineDocument(id) {
  try {
    const db = await openWalletDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_DOCS, 'readwrite');
      const store = tx.objectStore(STORE_DOCS);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Error removing offline document:', err);
    return false;
  }
}

/**
 * Clear all locally stored offline documents
 */
export async function clearAllOfflineWalletData() {
  try {
    const db = await openWalletDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_DOCS, STORE_SECURITY], 'readwrite');
      tx.objectStore(STORE_DOCS).clear();
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Error clearing offline wallet data:', err);
    return false;
  }
}
