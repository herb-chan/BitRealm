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
    }

    /**
     * Applies burn damage over time.
     * Should be called every second.
     */
    update() {
        const now = performance.now();
        if (now - this.last_applied_time >= 1000) {
            const burnDamage = this.strength * 2;
            console.log(
                `${this.entity.name} receives ${burnDamage} burn damage from Burn.`
            );
            this.entity.take_damage(burnDamage, true);
            this.last_applied_time = now;
            this.duration--;
        }
    }
}
