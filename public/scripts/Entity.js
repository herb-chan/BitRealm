import { Utility } from "./Utils.js";
import { StatusEffect } from "./status-effects/StatusEffect.js";
import { StatusEffectManager } from "./status-effects/StatusEffectsManager.js";
import { StateManager } from "./states/StateManager.js";
import { IdleState } from "./states/IdleState.js";

/**
 * Represents an entity in the game world.
 */
export class Entity {
    /**
     * Creates a new Entity.
     * @param {number} entity_id - Unique identifier.
     * @param {string} bestiary_id - Bestiary ID.
     * @param {string} name - Entity name.
     * @param {number} level - Entity level.
     * @param {number} health - Current health.
     * @param {number} max_health - Maximum health.
     * @param {number} defence - Defence stat.
     * @param {number} speed - Movement speed.
     * @param {Object} drops - Drop table.
     * @param {number} health_regeneration - Health regenerated per update when out-of-combat.
     */
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
        health_regeneration = 1
    ) {
        this.entity_id = entity_id;
        this.bestiary_id = bestiary_id;
        this.name = name;
        this.level = level;
        this.health = health;
        this.max_health = max_health;
        this.defence = defence;
        this.speed = speed;
        this.drops = drops;
        this.health_regeneration = health_regeneration;

        this.dead = false;
        this.position = { x: 0, y: 0 };
        this.area = null;
        this.dom_element = null;

        this.last_action_time = 0;
        this.last_attacked_time = 0;
        this.last_regeneration_time = 1000;
        this.last_wander_time = 0;
        this.last_move_time = 0;

        this.can_wander = true;
        this.can_flee = true;
        this.wandering_factor = 1;
        this.attacker = null;

        this.status_effect_manager = new StatusEffectManager();
        this.state_manager = new StateManager(this);

        this.state_manager.setState(new IdleState(this));
    }

    /**
     * Updates the timestamp for a given action type and the last action time.
     *
     * @param {"last_action_time" | "last_attacked_time" | "last_regeneration_time" | "last_wander_time" | "last_move_time"} action_type - The name of the class property to update.
     */
    update_action_time(action_type) {
        if (this.hasOwnProperty(action_type)) {
            this[action_type] = this.last_action_time = performance.now();
        } else {
            console.warn(`Invalid action type: ${action_type}`);
        }
    }

    /**
     * Calculates the amount of damage to receive from an attacker.
     * @param {number} damage_amount - The amount of damage to apply.
     * @param {boolean} from_status_effect - Whether the damage is from a status effect.
     * @returns {number} - The amount of damage to apply.
     */
    calculate_damage(damage_amount, from_status_effect = false) {
        if (from_status_effect) {
            return damage_amount;
        } else {
            return damage_amount * (1 - this.defence / (this.defence + 100));
        }
    }

    /**
     * Applies damage to the entity.
     * @param {number} damage_amount - The amount of damage to apply.
     * @param {boolean} from_status_effect - Whether the damage is from a status effect.
     * @returns {Object|null} - Returns loot if the entity dies.
     */
    take_damage(damage_amount, from_status_effect = false) {
        if (this.dead) return null;
        this.update_action_time("last_attacked_time");

        if (!from_status_effect) {
            this.attacker = this.area?.entities.find((e) => e.target === this);
        }

        const actual_damage = this.calculate_damage(
            damage_amount,
            from_status_effect
        );

        this.health = Math.max(0, this.health - actual_damage);

        if (this.area) this.area.updateEntityDisplay(this);

        return this.health === 0 ? this.on_death() : null;
    }

    /**
     * Regenerates health if the entity has not been attacked recently.
     * @param {number} deltaTime - The time elapsed since the last update, in seconds.
     */
    regenerate(deltaTime) {
        if (this.dead) return;

        const timeSinceLastAttack = performance.now() - this.last_attacked_time;
        this.last_regeneration_time += deltaTime * 1000; // Convert deltaTime to milliseconds

        if (
            timeSinceLastAttack >= 5000 &&
            this.last_regeneration_time >= 1000
        ) {
            this.health = Math.min(
                this.max_health,
                this.health + this.health_regeneration
            );
            if (this.area) this.area.updateEntityDisplay(this);
            this.last_regeneration_time = 0; // Reset regeneration timer
            console.log(
                `${this.name} regenerates ${this.health_regeneration} health.`
            );
        }
    }

    /**
     * Handles entity death, returning loot and removing from the area.
     * @returns {Object} - Loot dropped by the entity.
     */
    on_death() {
        const loot = this.generate_loot();
        this.status_effect_manager.status_effects = [];
        this.dead = true;
        if (this.area) this.area.removeEntity(this);
        return loot;
    }

    /**
     * Generates loot based on the entity's drop table.
     * @returns {Object} - The loot dropped.
     */
    generate_loot() {
        if (!this.drops) return { gold: 0, experience: 0, items: [] };

        return {
            gold: this.drops.gold
                ? Utility.generate_number_from_range(
                      this.drops.gold.min,
                      this.drops.gold.max
                  )
                : 0,
            experience: this.drops.experience || 0,
            items: (this.drops.items || []).reduce((acc, item) => {
                if (Math.random() * 100 < item.chance) {
                    acc.push({
                        item_id: item.item_id,
                        quantity: item.quantity
                            ? Utility.generate_number_from_range(
                                  item.quantity.min,
                                  item.quantity.max
                              )
                            : 1,
                    });
                }
                return acc;
            }, []),
        };
    }

    /**
     * Applies a status effect to the entity.
     * @param {StatusEffect} status_effect - The status_effect to apply.
     */
    apply_status_effect(status_effect) {
        if (!(status_effect instanceof StatusEffect)) {
            throw new Error(
                "apply_status_effect expects a StatusEffect instance."
            );
        }

        status_effect.entity = this;
        this.status_effect_manager.apply_status_effect(status_effect);
    }

    /**
     * Updates and applies all active status effects, then regenerates health.
     * @param {number} deltaTime - The time elapsed since the last update, in seconds.
     */
    update(deltaTime) {
        if (this.dead) return;

        this.updateStatusEffects(deltaTime);
        this.updateState(deltaTime);
        this.updateHealth(deltaTime);
        this.updateDisplay();
    }

    /**
     * Updates all active status effects applied to the entity.
     * This method ensures that ongoing effects like poison, burns, or buffs
     * are updated and applied accordingly.
     * @param {number} deltaTime - The time elapsed since the last update, in seconds.
     */
    updateStatusEffects(deltaTime) {
        this.status_effect_manager.update_status_effects(this, deltaTime);
    }

    /**
     * Updates the entity's current state.
     * This triggers any state-based behavior such as wandering, fleeing, or attacking.
     * @param {number} deltaTime - The time elapsed since the last update, in seconds.
     */
    updateState(deltaTime) {
        this.state_manager.update(deltaTime);
    }

    /**
     * Regenerates health if the entity is below maximum health.
     * This will only occur if the entity has not been attacked recently.
     * @param {number} deltaTime - The time elapsed since the last update, in seconds.
     */
    updateHealth(deltaTime) {
        if (this.health < this.max_health) {
            this.regenerate(deltaTime);
        }
    }

    /**
     * Updates the entity's display in the game world.
     * If the entity is part of an area, this ensures its visual representation is refreshed.
     */
    updateDisplay() {
        if (this.area) {
            this.area.updateEntityDisplay(this);
        }
    }
}
