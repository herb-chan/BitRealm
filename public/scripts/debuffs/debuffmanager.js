/**
 * Represents a debuff that affects an entity.
 */
export class Debuff {
    /**
     * @param {string} id - Unique identifier for the debuff (e.g., "burn").
     * @param {string} name - Readable name of the debuff (e.g., "Burn").
     * @param {Entity} entity - The entity affected by the debuff.
     * @param {number} duration - Duration of the debuff in seconds.
     * @param {number} [strength=1] - Strength of the debuff effect.
     */
    constructor(id, name, entity, duration, strength = 1) {
        this.id = id;
        this.name = name;
        this.entity = entity;
        this.duration = duration;
        this.strength = strength;
        this.last_applied_time = performance.now();
    }

    /**
     * Checks if the debuff has expired.
     * @returns {boolean} True if the effect is over, false otherwise.
     */
    is_expired() {
        return this.duration <= 0;
    }
}

/**
 * Manages and applies debuffs to an entity.
 */
export class DebuffManager {
    constructor() {
        this.debuffs = [];
    }

    /**
     * Applies a debuff to the entity or refreshes an existing one.
     * @param {Debuff} debuff - The debuff to apply.
     */
    apply_debuff(debuff) {
        const existing = this.debuffs.find((d) => d.id === debuff.id);
        if (existing) {
            existing.duration = debuff.duration;
            existing.strength += debuff.strength;
        } else {
            this.debuffs.push(debuff);
        }
    }

    /**
     * Removes a debuff by its ID.
     * @param {string} debuff_id - The ID of the debuff to remove.
     */
    remove_debuff(debuff_id) {
        this.debuffs = this.debuffs.filter((debuff) => debuff.id !== debuff_id);
    }

    /**
     * Updates all debuffs applied to an entity.
     */
    update_debuffs() {
        this.debuffs.forEach((debuff) => {
            if (typeof debuff.update === "function") {
                debuff.update();
            }
        });

        // Remove expired debuffs
        this.debuffs = this.debuffs.filter((debuff) => !debuff.is_expired());
    }
}
