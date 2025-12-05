/**
 * Stable empty array constant to prevent infinite loops
 * Using a single reference prevents creating new arrays on every render
 */
export const EMPTY_ARRAY = Object.freeze([])
