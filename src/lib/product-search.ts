/**
 * Token-based product search with relevance ranking.
 * 
 * Splits the search query into individual tokens and scores each product
 * by how many tokens match (in name or clave). Products are sorted by
 * descending score so the most relevant results appear first.
 * 
 * A product must match at least one token to be included.
 */

export interface SearchableProduct {
  id: string;
  name: string;
  clave: string | null;
}

/**
 * Normalize a string for search comparison:
 * lowercase, trim, collapse whitespace, remove accents.
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/\s+/g, ' ');
}

/**
 * Tokenize a search query into individual searchable words.
 * Filters out very short tokens (1 char) to reduce noise.
 */
function tokenize(query: string): string[] {
  return normalize(query)
    .split(' ')
    .filter(t => t.length >= 2);
}

export interface ScoredProduct<T extends SearchableProduct> {
  product: T;
  score: number;
}

/**
 * Score and rank products against a search query using token matching.
 * 
 * Scoring:
 * - Each token that appears in the product name contributes 2 points
 * - Each token that appears in the product clave contributes 1 point
 * - Bonus +3 if ALL tokens are found in name (exact full-match boost)
 * 
 * @returns Products sorted by score (desc), filtered to score > 0
 */
export function searchProducts<T extends SearchableProduct>(
  products: T[],
  query: string
): T[] {
  const trimmed = query.trim();
  if (!trimmed) return products;

  const tokens = tokenize(trimmed);
  if (tokens.length === 0) return products;

  const scored: ScoredProduct<T>[] = [];

  for (const product of products) {
    const normalizedName = normalize(product.name);
    const normalizedClave = product.clave ? normalize(product.clave) : '';

    let score = 0;
    let nameMatches = 0;

    for (const token of tokens) {
      if (normalizedName.includes(token)) {
        score += 2;
        nameMatches++;
      }
      if (normalizedClave.includes(token)) {
        score += 1;
      }
    }

    // Bonus if ALL tokens found in name (strong relevance signal)
    if (nameMatches === tokens.length) {
      score += 3;
    }

    if (score > 0) {
      scored.push({ product, score });
    }
  }

  // Sort by score descending, then alphabetically for ties
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.product.name.localeCompare(b.product.name);
  });

  return scored.map(s => s.product);
}
