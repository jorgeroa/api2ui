/**
 * Core plugin registration.
 * Registers all built-in field plugins with the PluginRegistry.
 * Called once at app initialization.
 */

import type { FieldPlugin } from '../../types/plugins'
import { DataType, PluginSource } from '../../types/plugins'
import { SemanticCategory } from '../../services/semantic/types'
import { registry } from '../../components/registry/pluginRegistry'

// Core field components
import { TextValue } from './fields/TextValue'
import { NumberValue } from './fields/NumberValue'
import { BooleanBadge } from './fields/BooleanBadge'
import { StatusBadgePlugin } from './fields/StatusBadgePlugin'
import { StarRatingPlugin } from './fields/StarRatingPlugin'
import { CurrencyPlugin } from './fields/CurrencyPlugin'
import { FormattedDatePlugin } from './fields/FormattedDatePlugin'
import { EmailLink } from './fields/EmailLink'
import { LinkValue } from './fields/LinkValue'
import { ImageValue } from './fields/ImageValue'
import { ColorSwatch } from './fields/ColorSwatch'
import { CodeBlock } from './fields/CodeBlock'
import { Copyable } from './fields/Copyable'
import { ProgressBar } from './fields/ProgressBar'
import { Percentage } from './fields/Percentage'
import { CompactNumber } from './fields/CompactNumber'
import { DotIndicator } from './fields/DotIndicator'
import { PhoneLink } from './fields/PhoneLink'
import { Markdown } from './fields/Markdown'
import { RelativeTime } from './fields/RelativeTime'
import { CheckboxField } from './fields/CheckboxField'

/** All core field plugins */
export const corePlugins: FieldPlugin[] = [
  {
    id: 'core/text',
    name: 'Text',
    description: 'Plain text with truncation',
    accepts: { dataTypes: [DataType.String] },
    component: TextValue,
    source: PluginSource.Core,
    version: '0.6.0',
    tags: ['text', 'default'],
  },
  {
    id: 'core/number',
    name: 'Number',
    description: 'Locale-formatted number',
    accepts: { dataTypes: [DataType.Number] },
    component: NumberValue,
    source: PluginSource.Core,
    version: '0.6.0',
    tags: ['number', 'default'],
  },
  {
    id: 'core/boolean-badge',
    name: 'Boolean Badge',
    description: 'True/False colored badge',
    accepts: { dataTypes: [DataType.Boolean] },
    component: BooleanBadge,
    source: PluginSource.Core,
    version: '0.6.0',
    tags: ['boolean', 'default'],
  },
  {
    id: 'core/status-badge',
    name: 'Status Badge',
    description: 'Colored badge for status values (active, pending, error, etc.)',
    icon: '🏷️',
    accepts: {
      dataTypes: [DataType.String, DataType.Boolean],
      semanticHints: ['status'],
    },
    component: StatusBadgePlugin,
    source: PluginSource.Core,
    version: '0.6.0',
    tags: ['status', 'badge'],
  },
  {
    id: 'core/star-rating',
    name: 'Star Rating',
    description: 'Filled/empty stars with half-star support',
    icon: '⭐',
    accepts: {
      dataTypes: [DataType.Number],
      semanticHints: ['rating'],
    },
    component: StarRatingPlugin,
    source: PluginSource.Core,
    version: '0.6.0',
    tags: ['rating', 'stars'],
  },
  {
    id: 'core/currency',
    name: 'Currency',
    description: 'Price with locale-aware currency symbol',
    icon: '💲',
    accepts: {
      dataTypes: [DataType.Number, DataType.String],
      semanticHints: ['price'],
    },
    component: CurrencyPlugin,
    source: PluginSource.Core,
    version: '0.6.0',
    tags: ['currency', 'price', 'money'],
  },
  {
    id: 'core/formatted-date',
    name: 'Formatted Date',
    description: 'Localized date with optional time',
    icon: '📅',
    accepts: {
      dataTypes: [DataType.String, DataType.Date],
      semanticHints: ['date', 'timestamp'],
    },
    component: FormattedDatePlugin,
    source: PluginSource.Core,
    version: '0.6.0',
    tags: ['date', 'time', 'temporal'],
  },
  {
    id: 'core/email-link',
    name: 'Email Link',
    description: 'Clickable mailto: link',
    icon: '✉️',
    accepts: {
      dataTypes: [DataType.String],
      semanticHints: ['email'],
    },
    component: EmailLink,
    source: PluginSource.Core,
    version: '0.6.0',
    tags: ['email', 'link'],
  },
  {
    id: 'core/link',
    name: 'Link',
    description: 'Clickable URL that opens in a new tab',
    icon: '🔗',
    accepts: {
      dataTypes: [DataType.String],
      semanticHints: ['url'],
    },
    component: LinkValue,
    source: PluginSource.Core,
    version: '0.6.0',
    tags: ['url', 'link'],
  },
  {
    id: 'core/image',
    name: 'Image',
    description: 'Inline image with error fallback',
    icon: '🖼️',
    accepts: {
      dataTypes: [DataType.String],
      semanticHints: ['image', 'thumbnail', 'avatar'],
    },
    component: ImageValue,
    source: PluginSource.Core,
    version: '0.6.0',
    tags: ['image', 'media'],
  },
  {
    id: 'core/color-swatch',
    name: 'Color Swatch',
    description: 'Color preview swatch with hex/rgb code',
    icon: '🎨',
    accepts: { dataTypes: [DataType.String] },
    component: ColorSwatch,
    source: PluginSource.Core,
    version: '0.6.0',
    tags: ['color'],
  },
  {
    id: 'core/code-block',
    name: 'Code Block',
    description: 'Monospace code display',
    icon: '💻',
    accepts: { dataTypes: [DataType.String] },
    component: CodeBlock,
    source: PluginSource.Core,
    version: '0.6.0',
    tags: ['code', 'monospace'],
  },
  {
    id: 'core/copyable',
    name: 'Copyable',
    description: 'Text with click-to-copy button for IDs and tokens',
    icon: '📋',
    accepts: {
      dataTypes: [DataType.String],
      semanticHints: ['uuid'],
    },
    component: Copyable,
    source: PluginSource.Core,
    version: '0.6.0',
    tags: ['copy', 'id', 'uuid', 'token'],
  },
  {
    id: 'core/progress-bar',
    name: 'Progress Bar',
    description: 'Horizontal bar fill for 0-100 or 0-1 values',
    icon: '📊',
    accepts: { dataTypes: [DataType.Number] },
    component: ProgressBar,
    source: PluginSource.Core,
    version: '0.6.0',
    tags: ['progress', 'bar', 'percentage'],
  },
  {
    id: 'core/percentage',
    name: 'Percentage',
    description: 'Number displayed as percentage with auto 0-1 detection',
    accepts: { dataTypes: [DataType.Number] },
    component: Percentage,
    source: PluginSource.Core,
    version: '0.6.0',
    tags: ['percentage', 'number'],
  },
  {
    id: 'core/compact-number',
    name: 'Compact Number',
    description: 'Abbreviated large numbers: 1.2K, 3.4M, 1.5B',
    accepts: { dataTypes: [DataType.Number] },
    component: CompactNumber,
    source: PluginSource.Core,
    version: '0.6.0',
    tags: ['number', 'compact', 'abbreviation'],
  },
  {
    id: 'core/dot-indicator',
    name: 'Dot Indicator',
    description: 'Small colored dot + text for compact status display',
    accepts: {
      dataTypes: [DataType.String],
      semanticHints: ['status'],
    },
    component: DotIndicator,
    source: PluginSource.Core,
    version: '0.6.0',
    tags: ['status', 'dot', 'indicator'],
  },
  {
    id: 'core/phone-link',
    name: 'Phone Link',
    description: 'Clickable tel: link for phone numbers',
    icon: '📞',
    accepts: {
      dataTypes: [DataType.String],
      semanticHints: ['phone'],
    },
    component: PhoneLink,
    source: PluginSource.Core,
    version: '0.6.0',
    tags: ['phone', 'link', 'tel'],
  },
  {
    id: 'core/markdown',
    name: 'Markdown',
    description: 'Rendered markdown content with prose styling',
    accepts: { dataTypes: [DataType.String] },
    component: Markdown,
    source: PluginSource.Core,
    version: '0.6.0',
    tags: ['markdown', 'rich-text'],
  },
  {
    id: 'core/relative-time',
    name: 'Relative Time',
    description: 'Relative time display: "3 days ago", "in 2 hours"',
    icon: '🕐',
    accepts: {
      dataTypes: [DataType.String, DataType.Date],
      semanticHints: ['timestamp'],
    },
    component: RelativeTime,
    source: PluginSource.Core,
    version: '0.6.0',
    tags: ['time', 'relative', 'ago'],
  },
  {
    id: 'core/checkbox',
    name: 'Checkbox',
    description: 'Read-only checkbox icon for boolean values',
    accepts: { dataTypes: [DataType.Boolean] },
    component: CheckboxField,
    source: PluginSource.Core,
    version: '0.6.0',
    tags: ['boolean', 'checkbox'],
  },
]

/**
 * Register all core plugins and set up default semantic mappings.
 */
export function registerCorePlugins(): void {
  // Register all core plugins
  for (const plugin of corePlugins) {
    registry.register(plugin)
  }

  // Set default mappings: semantic category → default plugin ID
  registry.setDefault('rating', 'core/star-rating')
  registry.setDefault('price', 'core/currency')
  registry.setDefault('status', 'core/status-badge')
  registry.setDefault('email', 'core/email-link')
  registry.setDefault('url', 'core/link')
  registry.setDefault('image', 'core/image')
  registry.setDefault('thumbnail', 'core/image')
  registry.setDefault('avatar', 'core/image')
  registry.setDefault('date', 'core/formatted-date')
  registry.setDefault('timestamp', 'core/formatted-date')
  registry.setDefault('phone', 'core/phone-link')
  registry.setDefault('uuid', 'core/copyable')
}
