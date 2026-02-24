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
        // Common rating scales: 0-5, 0-10 (excludes percentages, ages, temperatures)
        return value >= 0 && value <= 10
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
 * Pattern for status/state fields.
 * Uses heuristic detection instead of hardcoded English enum so
 * multilingual status values (e.g., "activo", "actif", "aktiv") pass.
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
      name: 'isStatusLike',
      validator: (value: unknown): boolean => {
        if (typeof value !== 'string') return false
        const trimmed = value.trim()
        // Heuristic: short, single-token, alphabetic with underscores/hyphens
        // Covers English "active", Spanish "activo", French "actif", German "aktiv", etc.
        if (trimmed.length === 0 || trimmed.length > 30) return false
        // Must be a single token — no spaces allowed
        if (/\s/.test(trimmed)) return false
        // Only letters, underscores, hyphens (e.g., "in-progress", "not_started")
        return /^[a-zA-Z][a-zA-Z_-]*$/.test(trimmed)
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
      name: 'isTitleLike',
      validator: (value: unknown): boolean => {
        if (typeof value !== 'string') return false
        const trimmed = value.trim()
        // 2-200 characters
        if (trimmed.length < 2 || trimmed.length > 200) return false
        // Not a URL
        if (/^https?:\/\//i.test(trimmed)) return false
        // Not an email
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return false
        // At least 2 words, OR a single capitalized word
        const words = trimmed.split(/\s+/)
        if (words.length >= 2) return true
        // Single word: must start with uppercase
        return /^[A-Z]/.test(trimmed)
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
      name: 'isDescriptionLike',
      validator: (value: unknown): boolean => {
        if (typeof value !== 'string') return false
        const trimmed = value.trim()
        // Description: sentence/paragraph, not a code string or ID
        // Must be > 50 chars and contain spaces (multiple words)
        return trimmed.length > 50 && /\s/.test(trimmed)
      },
      weight: 0.3,
    },
  ],
  formatHints: [],
  thresholds: { high: 0.75, medium: 0.50 },
}
