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
      name: 'isNameLike',
      validator: (value: unknown): boolean => {
        if (typeof value !== 'string') return false
        const trimmed = value.trim()
        // 2-100 chars
        if (trimmed.length < 2 || trimmed.length > 100) return false
        // Pure numbers fail
        if (/^\d+$/.test(trimmed)) return false
        // 1-5 words
        const words = trimmed.split(/\s+/)
        if (words.length > 5) return false
        // Each word: only letters, hyphens, apostrophes, periods (for initials)
        return words.every(w => /^[a-zA-Z\u00C0-\u024F][a-zA-Z\u00C0-\u024F'.\-]*$/.test(w))
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
      name: 'isAddressLike',
      validator: (value: unknown): boolean => {
        if (typeof value !== 'string') return false
        const trimmed = value.trim()
        if (trimmed.length < 5) return false
        const lower = trimmed.toLowerCase()
        // Contains known address tokens (multilingual)
        const addressTokens = /\b(st|ave|rd|blvd|street|avenue|road|drive|lane|way|court|plaza|calle|rue|strasse|straße|platz|via|avenida|rua|apt|suite|floor|unit|po box)\b/i
        if (addressTokens.test(lower)) return true
        // Multi-word string with both a number and a letter (e.g., "123 Main St")
        // Single-token strings like "SKU-12345" should NOT match
        if (!/\s/.test(trimmed)) return false
        const hasNumber = /\d/.test(trimmed)
        const hasLetter = /[a-zA-Z]/.test(trimmed)
        return hasNumber && hasLetter
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
