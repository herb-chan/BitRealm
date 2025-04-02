import { StatusEffect } from "./StatusEffect.js";

/**
 * Burn debuff that deals periodic damage to an entity.
 */
export class Burn extends StatusEffect {
    /**
     * @param {number} duration - Duration of the burn effect in seconds.
     * @param {number} strength - Strength of the burn (damage per tick).
     */
    constructor(duration, strength = 1) {
        super("burn", "Burn", duration, strength);
        this.tick_timer = 0; // Tracks time between burn ticks
    }

    /**
     * Applies burn damage over time.
     * @param {number} deltaTime - The time elapsed since the last update, in seconds.
     */
    update(deltaTime) {
        // First, decrease the effect's duration
        super.update(deltaTime);

        // If the effect is expired, do not apply further damage.
        if (this.is_expired()) {
            return;
        }

        // Increment the tick timer and apply damage for every elapsed second.
        this.tick_timer += deltaTime;
        while (this.tick_timer >= 1) {
            const burnDamage = this.strength * 2;
            if (this.entity) {
                console.log(
                    `${this.entity.name} receives ${burnDamage} burn damage from Burn.`
                );
                this.entity.take_damage(burnDamage, true);
            }
            // Subtract one second while preserving any overflow time.
            this.tick_timer -= 1;
        }
    }
}
