import { State } from "./State.js";
import { ChaseState } from "./ChaseState.js";
import { WanderState } from "./WanderState.js";
import { PatrolState } from "./PatrolState.js";

import { Mob } from "../Mob.js";

export class IdleState extends State {
    enter() {
        this.enterTime = performance.now();
    }

    update() {
        // Check if a Mob sees its target within aggro_range.
        if (
            this.entity instanceof Mob &&
            this.entity.target &&
            !this.entity.target.dead &&
            this.entity.can_chase
        ) {
            const dx = Math.abs(
                this.entity.target.position.x - this.entity.position.x
            );
            const dy = Math.abs(
                this.entity.target.position.y - this.entity.position.y
            );
            const distance = dx + dy;
            if (distance <= this.entity.aggro_range) {
                this.entity.state_manager.setState(new ChaseState(this.entity));
                return;
            }
        }

        const now = performance.now();
        const timeSinceLastAction = now - this.entity.last_attacked_time;
        const timeSinceLastWander = now - this.entity.last_wander_time;

        // Check if entity is out of combat and inactive for 2 seconds.
        if (timeSinceLastAction >= 2000 && !this.entity.dead) {
            // Check if WanderState hasn't been entered in the last 30 seconds.
            if (
                timeSinceLastWander >= 30000 ||
                this.entity.last_wander_time === 0
            ) {
                if (this.entity.can_wander) {
                    if (this.entity instanceof Mob && this.entity.can_patrol) {
                        this.entity.state_manager.setState(
                            new PatrolState(this.entity)
                        );
                    } else {
                        this.entity.state_manager.setState(
                            new WanderState(this.entity)
                        );
                    }
                }
            }
        }
    }

    exit() {}
}