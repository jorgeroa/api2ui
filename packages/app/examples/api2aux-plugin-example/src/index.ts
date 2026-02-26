/**
 * api2aux-plugin-example — Confidence Gauge plugin
 *
 * Demonstrates both detection strategies:
 * 1. semanticHints: overrides the core 'rating' category
 * 2. customCategories: declares a new '@example/percentage' category
 *
 * Export format: named `plugins` array (preferred by the loader).
 */

import { ConfidenceGauge } from './ConfidenceGauge'
import type { FieldPlugin } from './types'
import { DataType, PluginSource } from './types'

export const plugins: FieldPlugin[] = [
  {
    id: '@example/confidence-gauge',
    name: 'Confidence Gauge',
    description: 'Semicircular SVG gauge that fills red → yellow → green for 0-100 values',
    icon: '📊',

    accepts: {
      dataTypes: [DataType.Number],
      semanticHints: ['rating'],
      validate: (value) => typeof value === 'number' && value >= 0 && value <= 100,
    },

    component: ConfidenceGauge,
    source: PluginSource.Community,
    version: '1.0.0',
    author: 'api2aux',
    tags: ['gauge', 'percentage', 'confidence', 'visualization'],

    customCategories: [
      {
        id: '@example/percentage',
        name: 'Percentage Value',
        description: 'Numeric value between 0 and 100 representing a percentage',
        namePatterns: [/percent/i, /confidence/i, /progress/i, /completion/i, /score/i],
        nameKeywords: ['percent', 'pct', 'confidence', 'progress', 'completion', 'score', 'accuracy'],
        validate: (value) => typeof value === 'number' && value >= 0 && value <= 100,
      },
    ],
  },
]
