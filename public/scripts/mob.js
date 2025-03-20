import { Entity } from "./Entity.js";

export class Mob extends Entity {
    constructor(
        entity_id,
        bestiary_id,
        name,
        level,
        health,
        max_health,
        defence,
        speed,
        drops = {},
        strength = 1,
        damage = 1,
        attack_speed = 1,
        attack_range = 1,
        aggro_range = 5,
        health_regeneration = 1
    ) {
        super(
            entity_id,
            bestiary_id,
            name,
            level,
            health,
            max_health,
            defence,
            speed,
            drops,
            health_regeneration
        );

        this.strength = strength;
        this.damage = damage;
        this.attack_speed = attack_speed;
        this.attack_range = attack_range;
        this.aggro_range = aggro_range;

        this.target = null;
        this.last_attack_time = 0;
        this.last_move_time = 0;

        this.can_wander = true;
        this.can_flee = true;
        this.can_chase = true;
        this.can_patrol = false;
        this.patrol_center = null;
    }

    /**
     * Updates the last action time for a given event.
     * @param {"last_action_time" | "last_attacked_time" | "last_attack_time" | "last_regeneration_time" | "last_wander_time" | "last_move_time"} action_type - The action timestamp to update.
     */
    update_action_time(action_type) {
        const now = performance.now();
        this[action_type] = now;
        this.last_action_time = now;
    }

    /**
     * Sets a target for the mob.
     * @param {Entity} target - The target entity.
     */
    set_target(target) {
        if (target === this) {
            console.warn(`${this.name} cannot target itself!`);
            return;
        }
        this.validate_target(target);
        this.target = target;
    }

    /**
     * Removes the current target.
     */
    reset_target() {
        this.target = null;
    }

    /**
     * Checks if the mob's target is within attack range.
     * @returns {boolean} - True if the target is within range, false otherwise.
     */
    is_target_in_range() {
        if (!this.target || this.target.dead) return false;

        const dx = Math.abs(this.target.position.x - this.position.x);
        const dy = Math.abs(this.target.position.y - this.position.y);
        return dx + dy <= this.attack_range;
    }

    /**
     * Determines if the mob can attack based on attack speed cooldown.
     * @returns {boolean} - True if the mob can attack, false otherwise.
     */
    can_attack() {
        return (
            performance.now() - this.last_attack_time >=
            1000 / this.attack_speed
        );
    }

    /**
     * Attacks the current target if possible.
     */
    attack() {
        if (!this.target || this.target.dead) {
            console.log(`${this.name} has no valid target to attack.`);
            return;
        }
        if (this.can_attack()) {
            this.deal_damage();
            this.update_action_time("last_attack_time");
        }
    }

    /**
     * Deals damage to the target entity.
     */
    deal_damage() {
        const calculatedDamage = this.damage + (this.strength * 1.5) / 2;
        this.target.take_damage(calculatedDamage);

        if (this.target.dead) {
            console.log(
                `${this.target.name} has been defeated by ${this.name}!`
            );
            this.reset_target();
        } else {
            console.log(
                `${this.name} deals ${calculatedDamage.toFixed(2)} damage to ${
                    this.target.name
                }.`
            );
        }
    }

    /**
     * Handles taking damage and assigns an attacker as a target if applicable.
     * @param {number} damage_amount - The amount of damage received.
     * @param {boolean} [from_status_effect=false] - Whether the damage is from a status effect.
     */
    take_damage(damage_amount, from_status_effect = false) {
        super.take_damage(damage_amount, from_status_effect);
        if (!from_status_effect) {
            console.log(
                `${this.name} has been attacked by ${this.attacker.name}`
            );
            this.set_target(this.attacker);
        }
    }

    /**
     * Ensures that a target is a valid entity.
     * @param {Entity} target - The target entity.
     * @throws {Error} If the target is invalid.
     */
    validate_target(target) {
        if (!(target instanceof Entity)) {
            throw new Error(
                "Target must be an instance of Entity or a subclass of Entity."
            );
        }
        if (target.dead) {
            throw new Error("Target cannot be dead.");
        }
    }
}
