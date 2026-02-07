/**
 * Identity-related semantic patterns.
 * Patterns for email, phone, UUID, name, address, and URL fields.
 */

import type { SemanticPattern } from '../types'

/**
 * Pattern for email address fields.
 */
export const emailPattern: SemanticPattern = {
  category: 'email',
  namePatterns: [
    {
      // English, Spanish, French
      regex: /\b(email|e_mail|email_address|correo|courriel|mail)\b/i,
      weight: 0.4,
      languages: ['en', 'es', 'fr'],
    },
  ],
  typeConstraint: {
    allowed: ['string'],
    weight: 0.2,
  },
  valueValidators: [
    {
      name: 'isEmailFormat',
      validator: (value: unknown): boolean => {
        if (typeof value !== 'string') return false
        // Basic email regex
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
      },
      weight: 0.25,
    },
  ],
  formatHints: [
    { format: 'email', weight: 0.15 },
  ],
  thresholds: { high: 0.75, medium: 0.50 },
}

/**
 * Pattern for phone number fields.
 */
export const phonePattern: SemanticPattern = {
  category: 'phone',
  namePatterns: [
    {
      // English, Spanish, German
      regex: /\b(phone|tel|telephone|mobile|cell|telefono|telefon|phone_number|cellphone)\b/i,
      weight: 0.4,
      languages: ['en', 'es', 'de'],
    },
  ],
  typeConstraint: {
    allowed: ['string'],
    weight: 0.2,
  },
  valueValidators: [
    {
      name: 'isPhoneFormat',
      validator: (value: unknown): boolean => {
        if (typeof value !== 'string') return false
        // E.164-like format with flexibility
        return /^\+?[\d\s\-()]{7,20}$/.test(value.trim())
      },
      weight: 0.25,
    },
  ],
  formatHints: [
    { format: 'phone', weight: 0.15 },
  ],
  thresholds: { high: 0.75, medium: 0.50 },
}

/**
 * Pattern for UUID/GUID fields.
 */
export const uuidPattern: SemanticPattern = {
  category: 'uuid',
  namePatterns: [
    {
      // 'id' alone has lower weight - needs value validation
      regex: /\b(uuid|guid|unique_id)\b/i,
      weight: 0.4,
      languages: ['en'],
    },
    {
      // 'id' alone - lower weight, relies on value validation
      regex: /\bid\b/i,
      weight: 0.2,
      languages: ['en'],
    },
  ],
  typeConstraint: {
    allowed: ['string'],
    weight: 0.2,
  },
  valueValidators: [
    {
      name: 'isUUIDv4Format',
      validator: (value: unknown): boolean => {
        if (typeof value !== 'string') return false
        // UUID v4 format (case-insensitive)
        return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.trim())
      },
      weight: 0.3,
    },
  ],
  formatHints: [
    { format: 'uuid', weight: 0.1 },
  ],
  thresholds: { high: 0.75, medium: 0.50 },
}

/**
 * Pattern for name fields (person names, usernames).
 */
export const namePattern: SemanticPattern = {
  category: 'name',
  namePatterns: [
    {
      // English, Spanish, French
      regex: /\b(name|nombre|nom|fullname|full_name|username|first_name|last_name|firstname|lastname|display_name)\b/i,
      weight: 0.4,
      languages: ['en', 'es', 'fr'],
    },
  ],
  typeConstraint: {
    allowed: ['string'],
    weight: 0.2,
  },
  valueValidators: [
    {
      name: 'isNonEmptyString',
      validator: (value: unknown): boolean => {
        if (typeof value !== 'string') return false
        const trimmed = value.trim()
        // Reasonable name length (1-100 chars)
        return trimmed.length > 0 && trimmed.length <= 100
      },
      weight: 0.3,
    },
  ],
  formatHints: [],
  thresholds: { high: 0.75, medium: 0.50 },
}

/**
 * Pattern for address fields.
 */
export const addressPattern: SemanticPattern = {
  category: 'address',
  namePatterns: [
    {
      // English, Spanish, French, German
      regex: /\b(address|street|city|zip|postal|direccion|adresse|location|addr|street_address|postal_code|zip_code)\b/i,
      weight: 0.4,
      languages: ['en', 'es', 'fr', 'de'],
    },
  ],
  typeConstraint: {
    allowed: ['string'],
    weight: 0.2,
  },
  valueValidators: [
    {
      name: 'isString',
      validator: (value: unknown): boolean => {
        return typeof value === 'string' && value.trim().length > 0
      },
      weight: 0.3,
    },
  ],
  formatHints: [],
  thresholds: { high: 0.75, medium: 0.50 },
}

/**
 * Pattern for URL fields.
 */
export const urlPattern: SemanticPattern = {
  category: 'url',
  namePatterns: [
    {
      regex: /\b(url|link|href|website|webpage|uri|homepage|web_url)\b/i,
      weight: 0.4,
      languages: ['en'],
    },
  ],
  typeConstraint: {
    allowed: ['string'],
    weight: 0.2,
  },
  valueValidators: [
    {
      name: 'isURLFormat',
      validator: (value: unknown): boolean => {
        if (typeof value !== 'string') return false
        const trimmed = value.trim()
        return trimmed.startsWith('http://') || trimmed.startsWith('https://')
      },
      weight: 0.25,
    },
  ],
  formatHints: [
    { format: 'uri', weight: 0.1 },
    { format: 'url', weight: 0.1 },
  ],
  thresholds: { high: 0.75, medium: 0.50 },
}
