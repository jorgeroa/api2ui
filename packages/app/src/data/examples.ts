export interface Example {
  title: string
  description: string
  url: string
  type: 'Array' | 'Object' | 'OpenAPI'
  features: string[]
  category:
    | 'rich-content'
    | 'profiles'
    | 'data-tables'
    | 'text'
    | 'api-specs'
    | 'entertainment'
    | 'science'
    | 'food-drink'
    | 'geography'
    | 'music-media'
    | 'graphql'
  featured: boolean
  method?: string  // defaults to 'GET' when absent
  body?: string    // JSON request body for POST examples
}

export const EXAMPLES: Example[] = [
  // ── Featured examples (shown in quick carousel) ────────────────────

  {
    title: 'Product Catalog',
    description: 'Images, prices, star ratings, and product cards',
    url: 'https://dummyjson.com/products',
    type: 'Array',
    features: ['images', 'prices', 'ratings'],
    category: 'rich-content',
    featured: true,
  },
  {
    title: 'GitHub Profile',
    description: 'Avatar, URLs, dates, and profile layout',
    url: 'https://api.github.com/users/steipete',
    type: 'Object',
    features: ['avatar', 'urls', 'dates'],
    category: 'profiles',
    featured: true,
  },
  {
    title: 'Space News',
    description: 'Timeline of articles with images and dates',
    url: 'https://api.spaceflightnewsapi.net/v4/articles/?limit=20',
    type: 'Array',
    features: ['images', 'dates', 'urls'],
    category: 'science',
    featured: true,
  },
  {
    title: 'Crypto Markets',
    description: 'Market stats, currency values, and percentages',
    url: 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1',
    type: 'Array',
    features: ['currency', 'percentages', 'images'],
    category: 'data-tables',
    featured: true,
  },
  {
    title: 'Recipe Collection',
    description: 'Gallery with images, tags, and ratings',
    url: 'https://dummyjson.com/recipes',
    type: 'Array',
    features: ['images', 'tags', 'ratings'],
    category: 'food-drink',
    featured: true,
  },
  {
    title: 'Pet Store API',
    description: 'Multi-endpoint OpenAPI spec with parameter forms',
    url: 'https://petstore.swagger.io/v2/swagger.json',
    type: 'OpenAPI',
    features: ['endpoints', 'parameters'],
    category: 'api-specs',
    featured: true,
  },

  // ── Featured POST/GraphQL examples ────────────────────────────────

  {
    title: 'Countries (GraphQL)',
    description: 'Country data via GraphQL — names, capitals, currencies, and emoji flags',
    url: 'https://countries.trevorblades.com/graphql',
    type: 'Object',
    features: ['GraphQL', 'POST', 'flags'],
    category: 'graphql',
    featured: true,
    method: 'POST',
    body: JSON.stringify({
      query: '{ countries { name capital emoji currency languages { name } } }',
    }),
  },

  // ── Rich Content ───────────────────────────────────────────────────

  {
    title: 'Blog Posts',
    description: 'Tags, chips, reactions, and user references',
    url: 'https://dummyjson.com/posts',
    type: 'Array',
    features: ['tags', 'reactions'],
    category: 'rich-content',
    featured: false,
  },
  {
    title: 'Art Institute of Chicago',
    description: 'Artwork metadata with images, dates, and classifications',
    url: 'https://api.artic.edu/api/v1/artworks?limit=20',
    type: 'Object',
    features: ['images', 'dates', 'nested data'],
    category: 'rich-content',
    featured: false,
  },
  {
    title: 'NASA Astronomy Photos',
    description: 'Astronomy Picture of the Day with HD images and descriptions',
    url: 'https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY&count=10',
    type: 'Array',
    features: ['images', 'dates', 'long text'],
    category: 'rich-content',
    featured: false,
  },
  {
    title: 'Makeup Products',
    description: 'Beauty products with images, prices, and color tags',
    url: 'https://makeup-api.herokuapp.com/api/v1/products.json?brand=maybelline',
    type: 'Array',
    features: ['images', 'prices', 'colors'],
    category: 'rich-content',
    featured: false,
  },

  // ── Profiles & Objects ─────────────────────────────────────────────

  {
    title: 'Single User',
    description: 'Detailed object view with nested fields',
    url: 'https://jsonplaceholder.typicode.com/users/1',
    type: 'Object',
    features: ['nested objects', 'tabs'],
    category: 'profiles',
    featured: false,
  },
  {
    title: 'SpaceX Latest Launch',
    description: 'Deeply nested object with links and media',
    url: 'https://api.spacexdata.com/v4/launches/latest',
    type: 'Object',
    features: ['deep nesting', 'urls'],
    category: 'profiles',
    featured: false,
  },
  {
    title: 'Met Museum Artwork',
    description: 'Detailed art object with images, dates, and provenance',
    url: 'https://collectionapi.metmuseum.org/public/collection/v1/objects/436535',
    type: 'Object',
    features: ['images', 'dates', 'nested data'],
    category: 'profiles',
    featured: false,
  },
  {
    title: 'Exchange Rates',
    description: 'Live USD exchange rates for 160+ currencies',
    url: 'https://open.er-api.com/v6/latest/USD',
    type: 'Object',
    features: ['currency', 'numbers'],
    category: 'profiles',
    featured: false,
  },
  {
    title: 'NYC Weather Forecast',
    description: 'Current conditions and 7-day forecast with temperatures',
    url: 'https://api.open-meteo.com/v1/forecast?latitude=40.71&longitude=-74.01&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=America/New_York',
    type: 'Object',
    features: ['weather', 'numbers', 'dates'],
    category: 'profiles',
    featured: false,
  },

  // ── Data Tables ────────────────────────────────────────────────────

  {
    title: 'User Directory',
    description: 'Array of user objects with nested address and company data',
    url: 'https://jsonplaceholder.typicode.com/users',
    type: 'Array',
    features: ['nested objects', 'emails'],
    category: 'data-tables',
    featured: false,
  },
  {
    title: 'User Profiles',
    description: 'Phone numbers, birth dates, emails, and physical stats',
    url: 'https://dummyjson.com/users',
    type: 'Array',
    features: ['phones', 'emails', 'dates'],
    category: 'data-tables',
    featured: false,
  },
  {
    title: 'Todo List',
    description: 'Boolean checkboxes, status indicators, and user references',
    url: 'https://dummyjson.com/todos',
    type: 'Array',
    features: ['booleans', 'status'],
    category: 'data-tables',
    featured: false,
  },
  {
    title: 'Nobel Prize Laureates',
    description: 'Prize winners with categories, years, and affiliations',
    url: 'https://api.nobelprize.org/2.1/laureates?limit=20',
    type: 'Object',
    features: ['dates', 'nested data'],
    category: 'data-tables',
    featured: false,
  },
  {
    title: 'Open Breweries',
    description: 'Brewery directory with addresses, coordinates, and types',
    url: 'https://api.openbrewerydb.org/v1/breweries',
    type: 'Array',
    features: ['addresses', 'coordinates', 'urls'],
    category: 'data-tables',
    featured: false,
  },
  {
    title: 'Universities',
    description: 'Higher education institutions with domains and websites',
    url: 'http://universities.hipolabs.com/search?country=United+States&limit=20',
    type: 'Array',
    features: ['urls', 'countries'],
    category: 'data-tables',
    featured: false,
  },
  {
    title: 'Random Users',
    description: 'Generated user profiles with avatars, locations, and contacts',
    url: 'https://randomuser.me/api/?results=20',
    type: 'Object',
    features: ['avatars', 'emails', 'phones'],
    category: 'data-tables',
    featured: false,
  },

  // ── Entertainment & Pop Culture ────────────────────────────────────

  {
    title: 'Rick and Morty',
    description: 'Character profiles with images, species, and locations',
    url: 'https://rickandmortyapi.com/api/character',
    type: 'Object',
    features: ['images', 'status', 'nested data'],
    category: 'entertainment',
    featured: false,
  },
  {
    title: 'TV Shows',
    description: 'Show catalog with genres, ratings, schedules, and images',
    url: 'https://api.tvmaze.com/shows?page=0',
    type: 'Array',
    features: ['images', 'ratings', 'genres'],
    category: 'entertainment',
    featured: false,
  },
  {
    title: 'Top Anime',
    description: 'Highest-rated anime with scores, images, and genres',
    url: 'https://api.jikan.moe/v4/top/anime?limit=20',
    type: 'Object',
    features: ['images', 'ratings', 'genres'],
    category: 'entertainment',
    featured: false,
  },
  {
    title: 'D&D 5e Monsters',
    description: 'Fantasy creatures with stats, abilities, and challenge ratings',
    url: 'https://www.dnd5eapi.co/api/monsters',
    type: 'Object',
    features: ['stats', 'nested data'],
    category: 'entertainment',
    featured: false,
  },

  // ── Science & Space ────────────────────────────────────────────────

  {
    title: 'European Countries',
    description: 'Country data with flags, currencies, languages, and borders',
    url: 'https://restcountries.com/v3.1/region/europe',
    type: 'Array',
    features: ['flags', 'currencies', 'nested data'],
    category: 'geography',
    featured: false,
  },
  {
    title: 'Open Library Search',
    description: 'Book search results with authors, publishers, and cover IDs',
    url: 'https://openlibrary.org/search.json?q=tolkien&limit=20',
    type: 'Object',
    features: ['nested data', 'dates'],
    category: 'text',
    featured: false,
  },

  // ── Food & Drink ───────────────────────────────────────────────────

  {
    title: 'Cocktail Recipes',
    description: 'Mixed drinks with ingredients, images, and instructions',
    url: 'https://www.thecocktaildb.com/api/json/v1/1/search.php?s=margarita',
    type: 'Object',
    features: ['images', 'ingredients'],
    category: 'food-drink',
    featured: false,
  },
  {
    title: 'Meal Search',
    description: 'Recipes with images, categories, and step-by-step instructions',
    url: 'https://www.themealdb.com/api/json/v1/1/search.php?s=chicken',
    type: 'Object',
    features: ['images', 'categories', 'instructions'],
    category: 'food-drink',
    featured: false,
  },
  {
    title: 'Chocolate Products',
    description: 'Food products with nutrition data, labels, and barcodes',
    url: 'https://world.openfoodfacts.org/api/v2/search?categories_tags=chocolate&page_size=20&json=1',
    type: 'Object',
    features: ['images', 'nutrition', 'barcodes'],
    category: 'food-drink',
    featured: false,
  },

  // ── Music & Media ──────────────────────────────────────────────────

  {
    title: 'iTunes Search',
    description: 'Music tracks with album art, previews, and prices',
    url: 'https://itunes.apple.com/search?term=radiohead&limit=20',
    type: 'Object',
    features: ['images', 'prices', 'urls'],
    category: 'music-media',
    featured: false,
  },
  {
    title: 'MusicBrainz Artists',
    description: 'Artist database with discographies and metadata',
    url: 'https://musicbrainz.org/ws/2/artist/?query=radiohead&fmt=json&limit=20',
    type: 'Object',
    features: ['nested data', 'dates'],
    category: 'music-media',
    featured: false,
  },

  // ── GraphQL / POST APIs ───────────────────────────────────────────

  {
    title: 'Rick & Morty (GraphQL)',
    description: 'Character profiles with images and species via GraphQL',
    url: 'https://rickandmortyapi.graphcdn.app/',
    type: 'Object',
    features: ['GraphQL', 'POST', 'images'],
    category: 'graphql',
    featured: false,
    method: 'POST',
    body: JSON.stringify({
      query: '{ characters(page: 1) { results { name status species image } } }',
    }),
  },

  // ── Text & Simple ──────────────────────────────────────────────────

  {
    title: 'Quotes',
    description: 'Long text content suitable for markdown rendering',
    url: 'https://dummyjson.com/quotes',
    type: 'Array',
    features: ['long text'],
    category: 'text',
    featured: false,
  },
  {
    title: 'Comments',
    description: 'Nested user objects with text content',
    url: 'https://dummyjson.com/comments',
    type: 'Array',
    features: ['nested user'],
    category: 'text',
    featured: false,
  },
  {
    title: 'Chuck Norris Jokes',
    description: 'Humorous facts searchable by keyword',
    url: 'https://api.chucknorris.io/jokes/search?query=programmer',
    type: 'Object',
    features: ['long text', 'urls'],
    category: 'text',
    featured: false,
  },
  {
    title: 'Dictionary Lookup',
    description: 'Word definitions with phonetics and example usage',
    url: 'https://api.dictionaryapi.dev/api/v2/entries/en/hello',
    type: 'Array',
    features: ['nested data', 'long text'],
    category: 'text',
    featured: false,
  },
]

export const FEATURED_EXAMPLES = EXAMPLES.filter((e) => e.featured)

export const CATEGORIES: { key: Example['category']; label: string }[] = [
  { key: 'rich-content', label: 'Rich Content' },
  { key: 'entertainment', label: 'Entertainment' },
  { key: 'science', label: 'Science & Space' },
  { key: 'food-drink', label: 'Food & Drink' },
  { key: 'music-media', label: 'Music & Media' },
  { key: 'geography', label: 'Geography' },
  { key: 'profiles', label: 'Profiles & Objects' },
  { key: 'data-tables', label: 'Data Tables' },
  { key: 'text', label: 'Text & Reference' },
  { key: 'api-specs', label: 'API Specs' },
  { key: 'graphql', label: 'GraphQL / POST' },
]
