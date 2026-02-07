/**
 * Engagement-related semantic patterns.
 * Patterns for rating, reviews (composite), tags, status, title, and description.
 */

import type { SemanticPattern, CompositePattern } from '../types'

/**
 * Pattern for rating/score fields.
 */
export const ratingPattern: SemanticPattern = {
  category: 'rating',
  namePatterns: [
    {
      // English, Spanish, French, German
      regex: /\b(rating|score|stars|puntuacion|note|bewertung|rate|average_rating)\b/i,
      weight: 0.4,
      languages: ['en', 'es', 'fr', 'de'],
    },
  ],
  typeConstraint: {
    allowed: ['number'],
    weight: 0.2,
  },
  valueValidators: [
    {
      name: 'isValidRating',
      validator: (value: unknown): boolean => {
        if (typeof value !== 'number') return false
        // Common rating scales: 0-5, 0-10, 0-100
        return value >= 0 && value <= 100
      },
      weight: 0.25,
    },
  ],
  formatHints: [
    { format: 'float', weight: 0.1 },
    { format: 'double', weight: 0.1 },
  ],
  thresholds: { high: 0.75, medium: 0.50 },
}

/**
 * Composite pattern for reviews arrays.
 * Detects arrays of objects containing both a rating-like field and a comment-like field.
 * This is a CompositePattern, not a SemanticPattern.
 */
export const reviewsPattern: CompositePattern = {
  category: 'reviews',
  namePatterns: [
    {
      // English, Spanish, French, German
      regex: /\b(reviews?|comments?|feedback|opiniones|avis|bewertungen|testimonials?)\b/i,
      weight: 0.4,
      languages: ['en', 'es', 'fr', 'de'],
    },
  ],
  typeConstraint: {
    allowed: ['array'],
    weight: 0.2,
  },
  valueValidators: [],
  formatHints: [],
  thresholds: { high: 0.75, medium: 0.50 },
  // CompositePattern-specific fields:
  requiredFields: [
    { nameRegex: /\b(rating|score|stars)\b/i, type: 'number' },
    { nameRegex: /\b(comment|text|body|content|review|message)\b/i, type: 'string' },
  ],
  minItems: 1,
}

/**
 * Pattern for tags/labels arrays.
 */
export const tagsPattern: SemanticPattern = {
  category: 'tags',
  namePatterns: [
    {
      // English, Spanish
      regex: /\b(tags?|labels?|categories?|keywords?|etiquetas?|topics?)\b/i,
      weight: 0.4,
      languages: ['en', 'es'],
    },
  ],
  typeConstraint: {
    allowed: ['array'],
    weight: 0.2,
  },
  valueValidators: [
    {
      name: 'isStringArray',
      validator: (value: unknown): boolean => {
        if (!Array.isArray(value)) return false
        // All items should be strings
        return value.length > 0 && value.every(item => typeof item === 'string')
      },
      weight: 0.3,
    },
  ],
  formatHints: [],
  thresholds: { high: 0.75, medium: 0.50 },
}

/**
 * Common status values for validation.
 */
const STATUS_VALUES = /^(active|inactive|pending|completed|draft|published|archived|deleted|approved|rejected|processing|cancelled|shipped|delivered|paid|unpaid|open|closed|enabled|disabled)$/i

/**
 * Pattern for status/state fields.
 */
export const statusPattern: SemanticPattern = {
  category: 'status',
  namePatterns: [
    {
      // English, Spanish, French, German
      regex: /\b(status|state|stage|estado|statut|zustand|condition)\b/i,
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
      name: 'isStatusValue',
      validator: (value: unknown): boolean => {
        if (typeof value !== 'string') return false
        return STATUS_VALUES.test(value.trim())
      },
      weight: 0.3,
    },
  ],
  formatHints: [],
  thresholds: { high: 0.75, medium: 0.50 },
}

/**
 * Pattern for title/headline fields.
 */
export const titlePattern: SemanticPattern = {
  category: 'title',
  namePatterns: [
    {
      // English, Spanish, French, German
      regex: /\b(title|headline|subject|heading|titulo|titre|titel|name)\b/i,
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
      name: 'isNonEmptyString',
      validator: (value: unknown): boolean => {
        if (typeof value !== 'string') return false
        return value.trim().length > 0
      },
      weight: 0.3,
    },
  ],
  formatHints: [],
  thresholds: { high: 0.75, medium: 0.50 },
}

/**
 * Pattern for description/content fields.
 */
export const descriptionPattern: SemanticPattern = {
  category: 'description',
  namePatterns: [
    {
      // English, Spanish, German
      regex: /\b(description|desc|summary|content|body|text|descripcion|beschreibung|abstract|details)\b/i,
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
      name: 'isLongerString',
      validator: (value: unknown): boolean => {
        if (typeof value !== 'string') return false
        // Description typically > 20 chars
        return value.trim().length > 20
      },
      weight: 0.3,
    },
  ],
  formatHints: [],
  thresholds: { high: 0.75, medium: 0.50 },
}
