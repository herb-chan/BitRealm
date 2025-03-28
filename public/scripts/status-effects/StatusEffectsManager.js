import { StatusEffect } from "./StatusEffect.js";

/**
 * Manages and applies status effects to an entity.
 */
export class StatusEffectManager {
    constructor() {
        this.status_effects = [];
    }

    /**
     * Applies a status effect to the entity or refreshes an existing one.
     * @param {StatusEffect} status_effect - The status effect to apply.
     */
    apply_status_effect(status_effect) {
        const existing = this.status_effects.find(
            (se) => se.id === status_effect.id
        );
        if (existing) {
            existing.duration = status_effect.duration;
            existing.strength += status_effect.strength;
        } else {
            this.status_effects.push(status_effect);
        }
    }

    /**
     * Removes a status effect by its ID.
     * @param {string} status_effect_id - The ID of the status effect to remove.
     */
    remove_status_effect(status_effect_id) {
        this.status_effects = this.status_effects.filter(
            (status_effect) => status_effect.id !== status_effect_id
        );
    }

    /**
     * Updates all status effects applied to an entity.
     * @param {number} deltaTime - The time elapsed since the last update, in seconds.
     */
    update_status_effects(deltaTime) {
        this.status_effects.forEach((status_effect) => {
            if (typeof status_effect.update === "function") {
                status_effect.update(deltaTime); // Pass deltaTime to the status effect
            }
        });

        // Remove expired status effects
        this.status_effects = this.status_effects.filter(
            (status_effect) => !status_effect.is_expired()
        );
    }
}
