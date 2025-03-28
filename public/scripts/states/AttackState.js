import { State } from "./State.js";
import { ChaseState } from "./ChaseState.js";
import { IdleState } from "./IdleState.js";

export class AttackState extends State {
    enter() {
        this.target = this.entity.target;
        this.timeSinceLastAttack = 0; // Tracks time since the last attack
        this.attackCooldown = 1 / this.entity.attack_speed; // Cooldown in seconds
    }

    update(deltaTime) {
        if (!this.target || this.target.dead) {
            this.entity.state_manager.setState(new IdleState(this.entity));
            return;
        }

        if (this.entity.is_target_in_range()) {
            // Increment time since the last attack
            this.timeSinceLastAttack += deltaTime;

            // Check if enough time has passed to attack
            if (this.timeSinceLastAttack >= this.attackCooldown) {
                this.entity.attack();
                this.timeSinceLastAttack -= this.attackCooldown; // Subtract cooldown to handle overflow
            }
        } else {
            this.entity.state_manager.setState(new ChaseState(this.entity));
        }
    }

    exit() {}
}
