#!/usr/bin/env node
/**
 * Generates pre-computed embedding data for the semantic classification engine.
 *
 * Uses multilingual-e5-small to embed category synonym tokens and compute
 * category centroids. Output is committed to the repo and shipped in the
 * browser bundle for runtime cosine-similarity classification.
 *
 * Usage:  node scripts/generate-embeddings.mjs
 * Deps:   @huggingface/transformers (dev only)
 */

import { pipeline } from '@huggingface/transformers'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CATEGORIES_PATH = resolve(__dirname, 'categories.json')
const OUTPUT_DIR = resolve(__dirname, '..', 'src', 'data')
const CENTROIDS_PATH = resolve(OUTPUT_DIR, 'category-embeddings.json')
const TOKENS_PATH = resolve(OUTPUT_DIR, 'token-embeddings.json')

const BATCH_SIZE = 32
const DECIMALS = 6
const MODEL_NAME = 'Xenova/multilingual-e5-small'

// E5 models require a "query: " prefix for all inputs
const E5_PREFIX = 'query: '

/** Round array values to N decimal places to reduce file size. */
function quantize(vec, decimals = DECIMALS) {
  return vec.map(v => +v.toFixed(decimals))
}

/** L2-normalize a vector in place and return it. */
function l2Normalize(vec) {
  let norm = 0
  for (let i = 0; i < vec.length; i++) norm += vec[i] * vec[i]
  norm = Math.sqrt(norm)
  if (norm === 0) return vec
  for (let i = 0; i < vec.length; i++) vec[i] /= norm
  return vec
}

/** Batch an array into chunks of `size`. */
function batchArray(arr, size) {
  const batches = []
  for (let i = 0; i < arr.length; i += size) {
    batches.push(arr.slice(i, i + size))
  }
  return batches
}

async function main() {
  console.log('Reading category vocabulary...')
  const categories = JSON.parse(readFileSync(CATEGORIES_PATH, 'utf-8'))
  const categoryNames = Object.keys(categories)

  // Collect all unique tokens across all categories
  const allTokens = new Set()
  for (const cat of categoryNames) {
    for (const syn of categories[cat].synonyms) {
      allTokens.add(syn)
    }
  }
  const tokenList = [...allTokens].sort()
  console.log(`  ${categoryNames.length} categories, ${tokenList.length} unique tokens`)

  // Load the embedding model
  console.log(`Loading model: ${MODEL_NAME}...`)
  const embedder = await pipeline('feature-extraction', MODEL_NAME, {
    dtype: 'q8',
  })
  console.log('  Model loaded.')

  // Embed all tokens in batches
  console.log(`Embedding ${tokenList.length} tokens in batches of ${BATCH_SIZE}...`)
  const tokenEmbeddings = {} // token -> number[]
  const batches = batchArray(tokenList, BATCH_SIZE)

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]
    const prefixed = batch.map(t => `${E5_PREFIX}${t}`)
    const output = await embedder(prefixed, { pooling: 'mean', normalize: true })

    for (let j = 0; j < batch.length; j++) {
      // output.tolist() returns array of arrays
      const embedding = output.tolist()[j]
      tokenEmbeddings[batch[j]] = quantize(embedding)
    }

    const progress = Math.round(((i + 1) / batches.length) * 100)
    process.stdout.write(`\r  Progress: ${progress}% (${(i + 1) * BATCH_SIZE >= tokenList.length ? tokenList.length : (i + 1) * BATCH_SIZE}/${tokenList.length} tokens)`)
  }
  console.log()

  // Compute category centroids (average of synonym embeddings, then L2-normalize)
  console.log('Computing category centroids...')
  const dims = Object.values(tokenEmbeddings)[0].length
  const centroids = {}

  for (const cat of categoryNames) {
    const synonyms = categories[cat].synonyms
    const centroid = new Array(dims).fill(0)
    let count = 0

    for (const syn of synonyms) {
      const emb = tokenEmbeddings[syn]
      if (!emb) {
        console.warn(`  Warning: no embedding for "${syn}" in category "${cat}"`)
        continue
      }
      for (let d = 0; d < dims; d++) {
        centroid[d] += emb[d]
      }
      count++
    }

    if (count === 0) {
      console.warn(`  Warning: category "${cat}" has no valid embeddings`)
      continue
    }

    // Average
    for (let d = 0; d < dims; d++) {
      centroid[d] /= count
    }

    // L2-normalize then quantize
    centroids[cat] = quantize(l2Normalize(centroid))
  }

  console.log(`  ${Object.keys(centroids).length} centroids computed (${dims} dimensions each)`)

  // Write output files
  mkdirSync(OUTPUT_DIR, { recursive: true })

  const centroidsData = {
    model: MODEL_NAME,
    dimensions: dims,
    categories: centroids,
  }
  writeFileSync(CENTROIDS_PATH, JSON.stringify(centroidsData, null, 2))
  const centroidsSize = (readFileSync(CENTROIDS_PATH).length / 1024).toFixed(1)
  console.log(`  Wrote ${CENTROIDS_PATH} (${centroidsSize} KB)`)

  const tokensData = {
    model: MODEL_NAME,
    dimensions: dims,
    tokens: tokenEmbeddings,
  }
  writeFileSync(TOKENS_PATH, JSON.stringify(tokensData))
  const tokensSize = (readFileSync(TOKENS_PATH).length / 1024).toFixed(1)
  console.log(`  Wrote ${TOKENS_PATH} (${tokensSize} KB)`)

  console.log('Done!')
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
