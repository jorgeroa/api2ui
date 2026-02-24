/**
 * Core plugin registration.
 * Registers all built-in field plugins with the PluginRegistry.
 * Called once at app initialization.
 */

import type { FieldPlugin } from '../../types/plugins'
import { DataType, PluginSource } from '../../types/plugins'
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

// Core composite components
import { MapPin } from './composite/MapPin'
import { MapLink } from './composite/MapLink'
import { Coordinates } from './composite/Coordinates'
import { FormattedAddress } from './composite/FormattedAddress'
import { StatCard } from './composite/StatCard'
import { Sparkline } from './composite/Sparkline'

// Core chart components
import { LineChartPlugin } from './charts/LineChartPlugin'
import { BarChartPlugin } from './charts/BarChartPlugin'
import { PieChartPlugin } from './charts/PieChartPlugin'

// Core media components
import { VideoPlayer } from './media/VideoPlayer'
import { AudioPlayer } from './media/AudioPlayer'
import { ImageGallery } from './media/ImageGallery'

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

  // --- Composite components ---
  {
    id: 'core/map-pin',
    name: 'Map Pin',
    description: 'Interactive map with pin marker (OpenStreetMap)',
    icon: '📍',
    accepts: {
      dataTypes: [DataType.Object, DataType.Array],
      semanticHints: ['geo'],
      validate: (value) => {
        if (Array.isArray(value) && value.length === 2) {
          const [a, b] = value
          return typeof a === 'number' && typeof b === 'number' && a >= -90 && a <= 90 && b >= -180 && b <= 180
        }
        if (value && typeof value === 'object') {
          const obj = value as Record<string, unknown>
          const lat = obj.lat ?? obj.latitude ?? obj.Lat ?? obj.Latitude
          const lng = obj.lng ?? obj.lon ?? obj.longitude ?? obj.Lng ?? obj.Lon ?? obj.Longitude
          return typeof lat === 'number' && typeof lng === 'number'
        }
        return false
      },
    },
    component: MapPin,
    source: PluginSource.Core,
    version: '0.6.0',
    tags: ['map', 'geo', 'coordinates', 'location'],
  },
  {
    id: 'core/map-link',
    name: 'Map Link',
    description: 'Open location in Google Maps',
    icon: '🗺️',
    accepts: {
      dataTypes: [DataType.Object, DataType.Array, DataType.String],
      semanticHints: ['geo'],
    },
    component: MapLink,
    source: PluginSource.Core,
    version: '0.6.0',
    tags: ['map', 'link', 'geo', 'location'],
  },
  {
    id: 'core/coordinates',
    name: 'Coordinates',
    description: 'Formatted "40.71°N, 74.01°W" display',
    accepts: {
      dataTypes: [DataType.Object, DataType.Array],
      semanticHints: ['geo'],
    },
    component: Coordinates,
    source: PluginSource.Core,
    version: '0.6.0',
    tags: ['coordinates', 'geo', 'lat', 'lng'],
  },
  {
    id: 'core/formatted-address',
    name: 'Formatted Address',
    description: 'Smart multi-line postal address layout',
    accepts: {
      dataTypes: [DataType.Object],
      validate: (value) => {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return false
        const obj = value as Record<string, unknown>
        const keys = Object.keys(obj).map((k) => k.toLowerCase())
        return keys.some((k) => ['street', 'address', 'city', 'zip', 'zipcode', 'postalcode'].includes(k))
      },
    },
    component: FormattedAddress,
    source: PluginSource.Core,
    version: '0.6.0',
    tags: ['address', 'postal', 'location'],
  },
  {
    id: 'core/stat-card',
    name: 'Stat Card',
    description: 'Big number with label — KPI metric display',
    icon: '📈',
    accepts: { dataTypes: [DataType.Number, DataType.String] },
    component: StatCard,
    source: PluginSource.Core,
    version: '0.6.0',
    tags: ['stat', 'kpi', 'metric', 'number'],
  },
  {
    id: 'core/sparkline',
    name: 'Sparkline',
    description: 'Inline mini line chart for numeric arrays',
    icon: '📉',
    accepts: {
      dataTypes: [DataType.Array],
      validate: (value) => Array.isArray(value) && value.length >= 2 && value.every((v) => typeof v === 'number'),
    },
    component: Sparkline,
    source: PluginSource.Core,
    version: '0.6.0',
    tags: ['sparkline', 'chart', 'trend'],
  },

  // --- Chart components ---
  {
    id: 'core/line-chart',
    name: 'Line Chart',
    description: 'Line chart for time-series or x/y data',
    icon: '📊',
    accepts: {
      dataTypes: [DataType.Array],
      validate: (value) => Array.isArray(value) && value.length >= 2,
    },
    component: LineChartPlugin,
    source: PluginSource.Core,
    version: '0.6.0',
    tags: ['chart', 'line', 'time-series', 'trend'],
  },
  {
    id: 'core/bar-chart',
    name: 'Bar Chart',
    description: 'Bar chart for categorical + numeric data',
    icon: '📊',
    accepts: {
      dataTypes: [DataType.Array],
      validate: (value) => Array.isArray(value) && value.length >= 1 && value.every((v) => v && typeof v === 'object'),
    },
    component: BarChartPlugin,
    source: PluginSource.Core,
    version: '0.6.0',
    tags: ['chart', 'bar', 'categorical'],
  },
  {
    id: 'core/pie-chart',
    name: 'Pie Chart',
    description: 'Pie chart for category + number data (best with ≤8 items)',
    icon: '🥧',
    accepts: {
      dataTypes: [DataType.Array],
      validate: (value) => Array.isArray(value) && value.length >= 1 && value.length <= 12,
    },
    component: PieChartPlugin,
    source: PluginSource.Core,
    version: '0.6.0',
    tags: ['chart', 'pie', 'distribution'],
  },

  // --- Media components ---
  {
    id: 'core/video-player',
    name: 'Video Player',
    description: 'Video embed for MP4/WebM, YouTube, and Vimeo URLs',
    icon: '🎬',
    accepts: {
      dataTypes: [DataType.String],
      semanticHints: ['video'],
      validate: (value) => typeof value === 'string' && /\.(mp4|webm|ogg|mov)|youtube\.com|youtu\.be|vimeo\.com/i.test(value),
    },
    component: VideoPlayer,
    source: PluginSource.Core,
    version: '0.6.0',
    tags: ['video', 'media', 'player'],
  },
  {
    id: 'core/audio-player',
    name: 'Audio Player',
    description: 'Compact audio player for MP3/WAV/OGG URLs',
    icon: '🎵',
    accepts: {
      dataTypes: [DataType.String],
      semanticHints: ['audio'],
      validate: (value) => typeof value === 'string' && /\.(mp3|wav|ogg|flac|aac|m4a|wma|opus)/i.test(value),
    },
    component: AudioPlayer,
    source: PluginSource.Core,
    version: '0.6.0',
    tags: ['audio', 'media', 'player', 'music'],
  },
  {
    id: 'core/image-gallery',
    name: 'Image Gallery',
    description: 'Thumbnail grid with click-to-expand for image URL arrays',
    icon: '🖼️',
    accepts: {
      dataTypes: [DataType.Array],
      validate: (value) => Array.isArray(value) && value.length >= 1 && value.every((v) => typeof v === 'string' && /^https?:\/\//i.test(v)),
    },
    component: ImageGallery,
    source: PluginSource.Core,
    version: '0.6.0',
    tags: ['gallery', 'image', 'media', 'grid'],
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
  registry.setDefault('geo', 'core/map-link')
  registry.setDefault('video', 'core/video-player')
  registry.setDefault('audio', 'core/audio-player')
}
