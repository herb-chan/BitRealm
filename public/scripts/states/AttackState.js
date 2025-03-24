import { State } from "./State.js";
import { ChaseState } from "./ChaseState.js";
import { IdleState } from "./IdleState.js";

export class AttackState extends State {
    enter() {
        this.target = this.entity.target;
    }

    update() {
        if (!this.target || this.target.dead) {
            this.entity.state_manager.setState(new IdleState(this.entity));
            return;
        }

        if (this.entity.is_target_in_range()) {
            this.entity.attack();
        } else {
            this.entity.state_manager.setState(new ChaseState(this.entity));
        }
    }

    exit() {}
}