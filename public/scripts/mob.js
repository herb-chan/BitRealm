import { Entity } from "./entity.js";
import {
    StateManager,
    State,
    IdleState,
    ChaseState,
    FleeState,
    AttackState,
    WanderState,
    PatrolState,
} from "./states/statemanager.js";

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
        this.path = [];
        this.last_move_time = 0;
        this.target = null;

        this.last_attack_time = 0;

        // Mob-specific state flags
        this.canWander = true;
        this.canFlee = true;
        this.canChase = true;
        this.canPatrol = false;
        this.patrol_center = null; // Set if patrolling is enabled

        this.stateManager.setState(new IdleState(this));
    }

    /**
     * @typedef {"last_action_time" | "last_attacked_time" | "last_attack_time" | "last_regeneration_time" | "last_wander_time" | "last_move_time"} MobActionType
     */

    /**
     * Updates the timestamp for a given action type and the last action time.
     *
     * @param {MobActionType} action_type - The name of the class property to update.
     */
    update_action_time(action_type) {
        const now = performance.now();
        this[action_type] = now;
        this.last_action_time = now;
    }

    setTarget(target) {
        this.target = target;
    }

    is_target_in_range(target) {
        const dx = Math.abs(target.position.x - this.position.x);
        const dy = Math.abs(target.position.y - this.position.y);
        return dx + dy <= this.attack_range;
    }

    attack(target) {
        if (target.dead) return;
        if (this.can_attack()) {
            this.deal_damage(target);
            this.update_action_time("last_attack_time");
        }
    }

    can_attack() {
        const now = performance.now();
        return (
            !this.last_attack_time ||
            now - this.last_attack_time >= 100 / this.attack_speed
        );
    }

    deal_damage(target) {
        const calculatedDamage = this.damage + (this.strength * 1.5) / 2;
        console.log(
            `${this.name} deals ${calculatedDamage.toFixed(2)} damage to ${
                target.name
            }.`
        );
        target.take_damage(calculatedDamage);
    }
}
