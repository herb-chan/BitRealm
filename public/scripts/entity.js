import { Utility } from "./Utils.js";
import { StatusEffect } from "./status-effects/StatusEffect.js";
import { StatusEffectManager } from "./status-effects/StatusEffectsManager.js";
import { StateManager, IdleState } from "./states/StateManager.js";

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

        this.canWander = true;
        this.canFlee = true;
        this.wandering_factor = 1;
        this.attacker = null;

        this.status_effect_manager = new StatusEffectManager();
        this.state_manager = new StateManager(this);

        this.state_manager.setState(new IdleState(this));
    }

    /**
     * @typedef {"last_action_time" | "last_attacked_time" | "last_regeneration_time" | "last_wander_time" | "last_move_time"} EntityActionType
     */

    /**
     * Updates the timestamp for a given action type and the last action time.
     *
     * @param {EntityActionType} action_type - The name of the class property to update.
     */
    update_action_time(action_type) {
        const now = performance.now();
        this[action_type] = now;
        this.last_action_time = now;
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
        this.attacker = from_status_effect
            ? null
            : this.area?.entities.find((e) => e.target === this); // Simplified attacker detection
        const actual_damage = from_status_effect
            ? damage_amount
            : damage_amount * (1 - this.defence / (this.defence + 100));
        this.health = Math.max(0, this.health - actual_damage);
        if (this.area) this.area.updateEntityDisplay(this);
        return this.health === 0 ? this.on_death() : null;
    }

    /**
     * Regenerates health if the entity has not been attacked recently.
     */
    regenerate() {
        if (this.dead) return;
        const now = performance.now();
        if (
            now - this.last_attacked_time >= 5000 &&
            now - this.last_regeneration_time >= 1000
        ) {
            this.health = Math.min(
                this.max_health,
                this.health + this.health_regeneration
            );
            if (this.area) this.area.updateEntityDisplay(this);
            this.update_action_time("last_regeneration_time");
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
        const loot = this.drop_loot();
        this.status_effect_manager.status_effects = [];
        this.dead = true;
        if (this.area) this.area.removeEntity(this);
        return loot;
    }

    /**
     * Generates loot based on the entity's drop table.
     * @returns {Object} - The loot dropped.
     */
    drop_loot() {
        let loot_dropped = {
            gold: this.drops.gold
                ? Utility.generate_number_from_range(
                      this.drops.gold.min,
                      this.drops.gold.max
                  )
                : 0,
            experience: this.drops.experience || 0,
            items: [],
        };
        if (Array.isArray(this.drops.items)) {
            this.drops.items.forEach((item) => {
                if (Math.random() * 100 < item.chance) {
                    let quantity = item.quantity
                        ? Utility.generate_number_from_range(
                              item.quantity.min,
                              item.quantity.max
                          )
                        : 1;
                    loot_dropped.items.push({
                        item_id: item.item_id,
                        quantity,
                    });
                }
            });
        }
        return loot_dropped;
    }

    /**
     * Updates and applies all active status effects, then regenerates health.
     */
    update() {
        if (!this.dead) {
            this.status_effect_manager.update_status_effects(this);
            this.state_manager.update();
            if (this.area) this.area.updateEntityDisplay(this);
            if (this.health < this.max_health) this.regenerate();
        }
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
}
