import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits

export interface EncryptedData {
  encrypted: string;
  iv: string;
  tag: string;
  algorithm: string;
}

/**
 * Generate a secure encryption key from user password and salt
 */
export function deriveKey(password: string, salt: string): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha256');
}

/**
 * Generate a random salt for key derivation
 */
export function generateSalt(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Encrypt sensitive content for Private Vault
 */
export function encryptContent(content: string, key: Buffer): EncryptedData {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipher(ALGORITHM, key);
    cipher.setAAD(Buffer.from('diary-plus-vault', 'utf8'));

    let encrypted = cipher.update(content, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      algorithm: ALGORITHM
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt content');
  }
}

/**
 * Decrypt content from Private Vault
 */
export function decryptContent(encryptedData: EncryptedData, key: Buffer): string {
  try {
    const { encrypted, iv, tag, algorithm } = encryptedData;
    
    if (algorithm !== ALGORITHM) {
      throw new Error('Unsupported encryption algorithm');
    }

    const decipher = crypto.createDecipher(algorithm, key);
    decipher.setAAD(Buffer.from('diary-plus-vault', 'utf8'));
    decipher.setAuthTag(Buffer.from(tag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt content - invalid key or corrupted data');
  }
}

/**
 * Hash sensitive data for search/indexing while preserving privacy
 */
export function hashForSearch(content: string, salt: string): string {
  return crypto
    .createHash('sha256')
    .update(content + salt)
    .digest('hex')
    .substring(0, 16); // Truncate for storage efficiency
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Validate encryption key strength
 */
export function validateKeyStrength(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 12) {
    score += 2;
  } else if (password.length >= 8) {
    score += 1;
    feedback.push('Consider using a longer password (12+ characters)');
  } else {
    feedback.push('Password must be at least 8 characters long');
  }

  // Character variety
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  // Common patterns
  if (!/(.)\1{2,}/.test(password)) score += 1; // No repeated characters
  if (!/123|abc|qwe/i.test(password)) score += 1; // No common sequences

  const isValid = score >= 6;
  
  if (!isValid) {
    if (!/[a-z]/.test(password)) feedback.push('Add lowercase letters');
    if (!/[A-Z]/.test(password)) feedback.push('Add uppercase letters');
    if (!/[0-9]/.test(password)) feedback.push('Add numbers');
    if (!/[^a-zA-Z0-9]/.test(password)) feedback.push('Add special characters');
  }

  return { isValid, score, feedback };
}

/**
 * Securely wipe sensitive data from memory (best effort)
 */
export function secureWipe(buffer: Buffer): void {
  if (buffer && buffer.length > 0) {
    crypto.randomFillSync(buffer);
    buffer.fill(0);
  }
}

/**
 * Client-side encryption utilities (for browser)
 */
export const clientEncryption = {
  /**
   * Generate key from password on client side
   */
  async deriveKeyAsync(password: string, salt: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode(salt),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  },

  /**
   * Encrypt content on client side
   */
  async encryptAsync(content: string, key: CryptoKey): Promise<EncryptedData> {
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(content)
    );

    return {
      encrypted: Array.from(new Uint8Array(encrypted))
        .map(b => b.toString(16).padStart(2, '0'))
        .join(''),
      iv: Array.from(iv)
        .map(b => b.toString(16).padStart(2, '0'))
        .join(''),
      tag: '', // GCM includes auth tag in encrypted data
      algorithm: 'AES-GCM'
    };
  },

  /**
   * Decrypt content on client side
   */
  async decryptAsync(encryptedData: EncryptedData, key: CryptoKey): Promise<string> {
    const decoder = new TextDecoder();
    
    const encrypted = new Uint8Array(
      encryptedData.encrypted.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
    );
    
    const iv = new Uint8Array(
      encryptedData.iv.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );

    return decoder.decode(decrypted);
  }
};

/**
 * Privacy utilities for data redaction
 */
export const privacyUtils = {
  /**
   * Redact personally identifiable information
   */
  redactPII(content: string): string {
    return content
      // Credit card numbers
      .replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[REDACTED-CARD]')
      // Social Security Numbers
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED-SSN]')
      // Email addresses
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[REDACTED-EMAIL]')
      // Phone numbers
      .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[REDACTED-PHONE]')
      // IP addresses
      .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[REDACTED-IP]');
  },

  /**
   * Anonymize location data
   */
  anonymizeLocation(lat: number, lng: number, precision: number = 2): { lat: number; lng: number } {
    const factor = Math.pow(10, precision);
    return {
      lat: Math.round(lat * factor) / factor,
      lng: Math.round(lng * factor) / factor
    };
  },

  /**
   * Strip EXIF data from image metadata
   */
  stripImageMetadata(imageBuffer: Buffer): Buffer {
    // This would use a library like 'piexifjs' or 'sharp' to remove EXIF data
    // For now, return the buffer as-is (placeholder)
    return imageBuffer;
  }
};
