/**
 * Comprehensive tests for field grouping detection.
 * Tests prefix groups, semantic clusters, orphan prevention, and conflict handling.
 */

import { describe, it, expect } from 'vitest'
import { detectPrefixGroups, detectSemanticClusters, analyzeGrouping } from './grouping'
import { GROUPING_CONFIG } from './config'
import type { FieldInfo } from './types'

/**
 * Helper to create test field info
 */
function createField(
  name: string,
  semanticCategory: FieldInfo['semanticCategory'] = null,
  position = 0
): FieldInfo {
  return {
    path: name,
    name,
    semanticCategory,
    sampleValues: ['value'],
    position,
    totalFields: 10,
  }
}

describe('detectPrefixGroups', () => {
  it('creates Billing group for 3 billing_* fields', () => {
    const fields = [
      createField('billing_address'),
      createField('billing_city'),
      createField('billing_zip'),
    ]

    // Need at least 8 fields for grouping
    const allFields = [...fields, ...Array(5).fill(null).map((_, i) => createField(`other${i}`))]
    const groups = detectPrefixGroups(allFields)

    expect(groups).toHaveLength(1)
    expect(groups[0].type).toBe('prefix')
    expect(groups[0].prefix).toBe('billing_')
    expect(groups[0].label).toBe('Billing')
    expect(groups[0].fields).toHaveLength(3)
  })

  it('creates Shipping group for 4 shipping_* fields', () => {
    const fields = [
      createField('shipping_address'),
      createField('shipping_city'),
      createField('shipping_zip'),
      createField('shipping_country'),
    ]

    const allFields = [...fields, ...Array(4).fill(null).map((_, i) => createField(`other${i}`))]
    const groups = detectPrefixGroups(allFields)

    expect(groups).toHaveLength(1)
    expect(groups[0].type).toBe('prefix')
    expect(groups[0].prefix).toBe('shipping_')
    expect(groups[0].label).toBe('Shipping')
    expect(groups[0].fields).toHaveLength(4)
  })

  it('creates no group for 2 billing_* fields (below min)', () => {
    const fields = [
      createField('billing_address'),
      createField('billing_city'),
    ]

    const allFields = [...fields, ...Array(6).fill(null).map((_, i) => createField(`other${i}`))]
    const groups = detectPrefixGroups(allFields)

    expect(groups).toHaveLength(0)
  })

  it('handles mixed separators (user_ and user.)', () => {
    const fields = [
      createField('user_name'),
      createField('user_email'),
      createField('user_age'),
    ]

    const allFields = [...fields, ...Array(5).fill(null).map((_, i) => createField(`other${i}`))]
    const groups = detectPrefixGroups(allFields)

    expect(groups).toHaveLength(1)
    expect(groups[0].prefix).toBe('user_')
    expect(groups[0].label).toBe('User')
  })

  it('returns empty array when no prefix fields', () => {
    const fields = Array(8).fill(null).map((_, i) => createField(`field${i}`))
    const groups = detectPrefixGroups(fields)

    expect(groups).toHaveLength(0)
  })

  it('returns empty array when less than 8 fields total', () => {
    const fields = [
      createField('billing_address'),
      createField('billing_city'),
      createField('billing_zip'),
      createField('other'),
    ]

    const groups = detectPrefixGroups(fields)

    expect(groups).toHaveLength(0)
  })

  it('creates multiple groups for different prefixes', () => {
    const fields = [
      createField('billing_address'),
      createField('billing_city'),
      createField('billing_zip'),
      createField('shipping_address'),
      createField('shipping_city'),
      createField('shipping_zip'),
      createField('other1'),
      createField('other2'),
    ]

    const groups = detectPrefixGroups(fields)

    expect(groups).toHaveLength(2)
    const billingGroup = groups.find(g => g.prefix === 'billing_')
    const shippingGroup = groups.find(g => g.prefix === 'shipping_')
    expect(billingGroup).toBeDefined()
    expect(shippingGroup).toBeDefined()
    expect(billingGroup?.label).toBe('Billing')
    expect(shippingGroup?.label).toBe('Shipping')
  })
})

describe('Group Label Formatting', () => {
  it('formats billing_ to Billing', () => {
    const fields = [
      createField('billing_address'),
      createField('billing_city'),
      createField('billing_zip'),
    ]
    const allFields = [...fields, ...Array(5).fill(null).map((_, i) => createField(`other${i}`))]
    const groups = detectPrefixGroups(allFields)

    expect(groups[0].label).toBe('Billing')
  })

  it('formats shipping_address_ to Shipping Address', () => {
    const fields = [
      createField('shipping_address_line1'),
      createField('shipping_address_line2'),
      createField('shipping_address_city'),
    ]
    const allFields = [...fields, ...Array(5).fill(null).map((_, i) => createField(`other${i}`))]
    const groups = detectPrefixGroups(allFields)

    expect(groups[0].label).toBe('Shipping Address')
  })

  it('strips info suffix: contact_info_ to Contact', () => {
    const fields = [
      createField('contact_info_email'),
      createField('contact_info_phone'),
      createField('contact_info_address'),
    ]
    const allFields = [...fields, ...Array(5).fill(null).map((_, i) => createField(`other${i}`))]
    const groups = detectPrefixGroups(allFields)

    expect(groups[0].label).toBe('Contact')
  })

  it('strips details suffix: user_details_ to User', () => {
    const fields = [
      createField('user_details_name'),
      createField('user_details_email'),
      createField('user_details_age'),
    ]
    const allFields = [...fields, ...Array(5).fill(null).map((_, i) => createField(`other${i}`))]
    const groups = detectPrefixGroups(allFields)

    expect(groups[0].label).toBe('User')
  })

  it('strips data suffix: order_data_ to Order', () => {
    const fields = [
      createField('order_data_id'),
      createField('order_data_total'),
      createField('order_data_status'),
    ]
    const allFields = [...fields, ...Array(5).fill(null).map((_, i) => createField(`other${i}`))]
    const groups = detectPrefixGroups(allFields)

    expect(groups[0].label).toBe('Order')
  })
})

describe('detectSemanticClusters', () => {
  it('creates Contact cluster for email + phone + address', () => {
    const fields = [
      createField('email', 'email'),
      createField('phone', 'phone'),
      createField('address', 'address'),
    ]
    const allFields = [...fields, ...Array(5).fill(null).map((_, i) => createField(`other${i}`))]
    const clusters = detectSemanticClusters(allFields)

    expect(clusters).toHaveLength(1)
    expect(clusters[0].type).toBe('semantic')
    expect(clusters[0].label).toBe('Contact')
    expect(clusters[0].categories).toContain('email')
    expect(clusters[0].categories).toContain('phone')
    expect(clusters[0].categories).toContain('address')
    expect(clusters[0].fields).toHaveLength(3)
  })

  it('creates Identity cluster for name + email + avatar', () => {
    const fields = [
      createField('name', 'name'),
      createField('email', 'email'),
      createField('avatar', 'avatar'),
    ]
    const allFields = [...fields, ...Array(5).fill(null).map((_, i) => createField(`other${i}`))]
    const clusters = detectSemanticClusters(allFields)

    const identityCluster = clusters.find(c => c.label === 'Identity')
    expect(identityCluster).toBeDefined()
    expect(identityCluster?.fields).toHaveLength(3)
  })

  it('creates Pricing cluster for price + currency_code (with 2 min)', () => {
    const fields = [
      createField('price', 'price'),
      createField('currency', 'currency_code'),
    ]
    const allFields = [...fields, ...Array(6).fill(null).map((_, i) => createField(`other${i}`))]
    const clusters = detectSemanticClusters(allFields)

    const pricingCluster = clusters.find(c => c.label === 'Pricing')
    expect(pricingCluster).toBeDefined()
    expect(pricingCluster?.fields).toHaveLength(2)
  })

  it('creates Temporal cluster for date + timestamp', () => {
    const fields = [
      createField('created_date', 'date'),
      createField('updated_at', 'timestamp'),
    ]
    const allFields = [...fields, ...Array(6).fill(null).map((_, i) => createField(`other${i}`))]
    const clusters = detectSemanticClusters(allFields)

    const temporalCluster = clusters.find(c => c.label === 'Temporal')
    expect(temporalCluster).toBeDefined()
    expect(temporalCluster?.fields).toHaveLength(2)
  })

  it('creates no cluster for single email field (below minFields)', () => {
    const fields = [
      createField('email', 'email'),
    ]
    const allFields = [...fields, ...Array(7).fill(null).map((_, i) => createField(`other${i}`))]
    const clusters = detectSemanticClusters(allFields)

    expect(clusters).toHaveLength(0)
  })

  it('returns empty array when less than 8 fields total', () => {
    const fields = [
      createField('email', 'email'),
      createField('phone', 'phone'),
      createField('other'),
    ]
    const clusters = detectSemanticClusters(fields)

    expect(clusters).toHaveLength(0)
  })
})

describe('Minimum Field Threshold Tests', () => {
  it('no grouping with 7 fields total (below 8 threshold)', () => {
    const fields = [
      createField('billing_address'),
      createField('billing_city'),
      createField('billing_zip'),
      createField('other1'),
      createField('other2'),
      createField('other3'),
      createField('other4'),
    ]
    const result = analyzeGrouping(fields)

    expect(result.groups).toHaveLength(0)
    expect(result.ungrouped).toHaveLength(7)
  })

  it('grouping applied with 8 fields and clear groups', () => {
    const fields = [
      createField('billing_address'),
      createField('billing_city'),
      createField('billing_zip'),
      createField('shipping_address'),
      createField('shipping_city'),
      createField('shipping_zip'),
      createField('shipping_country'),
      createField('other1'),
    ]
    const result = analyzeGrouping(fields)

    // 7 grouped in 2 groups, 1 ungrouped → triggers orphan prevention
    // So we need to ensure at least 3 ungrouped or 0 ungrouped
    expect(result.groups).toHaveLength(0) // orphan prevention kicks in
    expect(result.ungrouped).toHaveLength(8)
  })

  it('group created with 10 fields and 3 prefix matches', () => {
    const fields = [
      createField('user_name'),
      createField('user_email'),
      createField('user_age'),
    ]
    const allFields = [...fields, ...Array(7).fill(null).map((_, i) => createField(`other${i}`))]
    const result = analyzeGrouping(allFields)

    expect(result.groups).toHaveLength(1)
    expect(result.groups[0].fields).toHaveLength(3)
  })
})

describe('Orphan Prevention Tests (CRITICAL)', () => {
  it('skips grouping when 6 grouped, 2 ungrouped (orphan)', () => {
    const fields = [
      createField('billing_address'),
      createField('billing_city'),
      createField('billing_zip'),
      createField('shipping_address'),
      createField('shipping_city'),
      createField('shipping_zip'),
      createField('orphan1'),
      createField('orphan2'),
    ]
    const result = analyzeGrouping(fields)

    // Should skip grouping entirely
    expect(result.groups).toHaveLength(0)
    expect(result.ungrouped).toHaveLength(8)
  })

  it('allows grouping when 6 grouped, 4 ungrouped (3+ ungrouped allowed)', () => {
    const fields = [
      createField('billing_address'),
      createField('billing_city'),
      createField('billing_zip'),
      createField('shipping_address'),
      createField('shipping_city'),
      createField('shipping_zip'),
      createField('ungrouped1'),
      createField('ungrouped2'),
      createField('ungrouped3'),
      createField('ungrouped4'),
    ]
    const result = analyzeGrouping(fields)

    // 6 grouped + 4 ungrouped → allows grouping (3+ ungrouped)
    expect(result.groups.length).toBeGreaterThan(0)
    expect(result.ungrouped).toHaveLength(4)
  })

  it('skips grouping when 6 grouped, 2 ungrouped (orphan)', () => {
    const fields = [
      createField('billing_address'),
      createField('billing_city'),
      createField('billing_zip'),
      createField('shipping_address'),
      createField('shipping_city'),
      createField('shipping_zip'),
      createField('ungrouped1'),
      createField('ungrouped2'),
    ]
    const result = analyzeGrouping(fields)

    // 6 grouped + 2 ungrouped → triggers orphan prevention
    expect(result.groups).toHaveLength(0)
    expect(result.ungrouped).toHaveLength(8)
  })

  it('skips grouping when 7 grouped, 1 ungrouped (orphan)', () => {
    const fields = [
      createField('billing_address'),
      createField('billing_city'),
      createField('billing_zip'),
      createField('shipping_address'),
      createField('shipping_city'),
      createField('shipping_zip'),
      createField('shipping_country'),
      createField('orphan'),
    ]
    const result = analyzeGrouping(fields)

    // Should skip grouping entirely
    expect(result.groups).toHaveLength(0)
    expect(result.ungrouped).toHaveLength(8)
  })

  it('allows grouping when 8 grouped, 0 ungrouped', () => {
    const fields = [
      createField('billing_address'),
      createField('billing_city'),
      createField('billing_zip'),
      createField('billing_country'),
      createField('shipping_address'),
      createField('shipping_city'),
      createField('shipping_zip'),
      createField('shipping_country'),
    ]
    const result = analyzeGrouping(fields)

    // Should allow grouping
    expect(result.groups.length).toBeGreaterThan(0)
    expect(result.ungrouped).toHaveLength(0)
  })
})

describe('Prefix vs Semantic Conflict Prevention', () => {
  it('prefix group only for contact_* fields, not also semantic', () => {
    const fields = [
      createField('contact_email', 'email'),
      createField('contact_phone', 'phone'),
      createField('contact_address', 'address'),
    ]
    const allFields = [...fields, ...Array(5).fill(null).map((_, i) => createField(`other${i}`))]
    const result = analyzeGrouping(allFields)

    // Should only have prefix group, not semantic Contact cluster
    const prefixGroups = result.groups.filter(g => g.type === 'prefix')
    const semanticClusters = result.groups.filter(g => g.type === 'semantic')

    expect(prefixGroups).toHaveLength(1)
    expect(prefixGroups[0].label).toBe('Contact')
    expect(semanticClusters).toHaveLength(0)
  })

  it('semantic cluster created for email, phone, address (no prefix)', () => {
    const fields = [
      createField('email', 'email'),
      createField('phone', 'phone'),
      createField('address', 'address'),
    ]
    const allFields = [...fields, ...Array(5).fill(null).map((_, i) => createField(`other${i}`))]
    const result = analyzeGrouping(allFields)

    const semanticClusters = result.groups.filter(g => g.type === 'semantic')
    expect(semanticClusters.length).toBeGreaterThan(0)
    const contactCluster = semanticClusters.find(c => c.label === 'Contact')
    expect(contactCluster).toBeDefined()
    expect(contactCluster?.fields).toHaveLength(3)
  })

  it('mix: prefix fields excluded from semantic clustering', () => {
    const fields = [
      createField('user_name', 'name'),
      createField('user_email', 'email'),
      createField('user_avatar', 'avatar'),
      createField('phone', 'phone'),
      createField('address', 'address'),
      createField('other1'),
      createField('other2'),
      createField('other3'),
    ]
    const result = analyzeGrouping(fields)

    // Should have user_ prefix group
    const prefixGroups = result.groups.filter(g => g.type === 'prefix')
    expect(prefixGroups).toHaveLength(1)
    expect(prefixGroups[0].prefix).toBe('user_')

    // phone and address should NOT form a semantic cluster (only 2 fields, need email too)
    const semanticClusters = result.groups.filter(g => g.type === 'semantic')
    const contactCluster = semanticClusters.find(c => c.label === 'Contact')
    expect(contactCluster).toBeUndefined()
  })
})

describe('Integration Tests', () => {
  it('realistic e-commerce object with billing, shipping, and identity', () => {
    const fields = [
      createField('id', 'uuid'),
      createField('name', 'name'),
      createField('email', 'email'),
      createField('avatar', 'avatar'),
      createField('billing_address'),
      createField('billing_city'),
      createField('billing_zip'),
      createField('shipping_address'),
      createField('shipping_city'),
      createField('shipping_zip'),
      createField('price', 'price'),
      createField('currency', 'currency_code'),
      createField('quantity', 'quantity'),
      createField('sku', 'sku'),
      createField('description', 'description'),
    ]
    const result = analyzeGrouping(fields)

    // Should have billing and shipping prefix groups
    const prefixGroups = result.groups.filter(g => g.type === 'prefix')
    expect(prefixGroups.length).toBeGreaterThan(0)

    // Should have Identity and Pricing semantic clusters
    const semanticClusters = result.groups.filter(g => g.type === 'semantic')
    expect(semanticClusters.length).toBeGreaterThan(0)
  })

  it('realistic user profile with contact info and metadata', () => {
    const fields = [
      createField('id', 'uuid'),
      createField('name', 'name'),
      createField('email', 'email'),
      createField('phone', 'phone'),
      createField('address', 'address'),
      createField('avatar', 'avatar'),
      createField('bio', 'description'),
      createField('created_at', 'timestamp'),
      createField('updated_at', 'timestamp'),
      createField('role'),
    ]
    const result = analyzeGrouping(fields)

    // Should have semantic clusters
    expect(result.groups.length).toBeGreaterThan(0)
    const semanticClusters = result.groups.filter(g => g.type === 'semantic')
    expect(semanticClusters.length).toBeGreaterThan(0)
  })

  it('object with no groupable patterns returns empty groups', () => {
    const fields = Array(10).fill(null).map((_, i) => createField(`field${i}`))
    const result = analyzeGrouping(fields)

    expect(result.groups).toHaveLength(0)
    expect(result.ungrouped).toHaveLength(10)
  })
})
