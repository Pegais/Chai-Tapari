/**
 * Utility functions for className merging and conditional styling
 * This uses clsx and tailwind-merge to combine Tailwind classes properly
 * 
 * Why: Prevents class conflicts and allows conditional styling
 * How: Merges class names and resolves Tailwind conflicts
 * Impact: Cleaner component code and better style management
 */

import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines class names and merges Tailwind classes
 * @param {...(string|object)} inputs - Class names or conditional class objects
 * @returns {string} Merged class string
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

