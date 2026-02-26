/**
 * Shared mock factories for plugin tests.
 */

import type { FieldPlugin, FieldRenderProps } from '@/types/plugins'
import { DataType, PluginSource } from '@/types/plugins'
import type { PluginManifest } from '@/types/pluginManifest'

/** Minimal React component stub for tests */
const MockComponent = (() => null) as unknown as React.ComponentType<FieldRenderProps>

/** Create a valid FieldPlugin with sensible defaults, all fields overridable. */
export function createMockPlugin(overrides?: Partial<FieldPlugin>): FieldPlugin {
  return {
    id: 'test/mock',
    name: 'Mock Plugin',
    description: 'A mock plugin for testing',
    accepts: { dataTypes: [DataType.String] },
    component: MockComponent,
    source: PluginSource.Community,
    version: '1.0.0',
    ...overrides,
  }
}

/** Create a valid PluginManifest with sensible defaults, all fields overridable. */
export function createMockManifest(overrides?: Partial<PluginManifest>): PluginManifest {
  return {
    id: 'test/mock-manifest',
    name: 'Mock Plugin Package',
    source: 'npm',
    package: 'api2aux-plugin-test',
    version: '1.0.0',
    enabled: true,
    ...overrides,
  }
}
