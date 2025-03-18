/**
 * Utility functions for various calculations.
 */
export class Utility {
    /**
     * Generates a random number within a given range.
     * @param {number} min - Minimum value.
     * @param {number} max - Maximum value.
     * @returns {number} - Random number within the range.
     */
    static generate_number_from_range(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}
