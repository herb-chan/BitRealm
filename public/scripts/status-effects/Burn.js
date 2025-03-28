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
        super.update(deltaTime); // Decrease duration using the base class logic

        this.tick_timer += deltaTime; // Increment the tick timer
        if (this.tick_timer >= 1) {
            // Apply burn damage every second
            const burnDamage = this.strength * 2;
            console.log(
                `${this.entity.name} receives ${burnDamage} burn damage from Burn.`
            );
            this.entity.take_damage(burnDamage, true);
            this.tick_timer = 0; // Reset the tick timer
        }
    }
}
