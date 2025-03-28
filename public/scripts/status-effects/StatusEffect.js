/*
 * Represents a status effect that affects an entity.
 */
export class StatusEffect {
    /**
     * @typedef {buff | debuff} StatusEffectType
     */

    /**
     * @param {string} id - Unique identifier for the status effect (e.g., "burn").
     * @param {string} name - Readable name of the status effect (e.g., "Burn").
     * @param {number} duration - Duration of the status effect in seconds.
     * @param {number} [strength=1] - Strength of the status effect effect.
     * @param {StatusEffectType} type - Type of the status effect.
     */
    constructor(id, name, duration, strength = 1) {
        this.id = id;
        this.name = name;
        this.duration = duration;
        this.strength = strength;
        this.last_applied_time = performance.now();
    }

    /**
     * Updates the status effect's duration based on deltaTime.
     * @param {number} deltaTime - The time elapsed since the last update, in seconds.
     */
    update(deltaTime) {
        this.duration -= deltaTime; // Decrease duration by deltaTime
    }

    /**
     * Checks if the status effect has expired.
     * @returns {boolean} True if the effect is over, false otherwise.
     */
    is_expired() {
        return this.duration <= 0;
    }
}
