import { State } from "./State.js";
import { AttackState } from "./AttackState.js";
import { FleeState } from "./FleeState.js";
import { IdleState } from "./IdleState.js";

export class ChaseState extends State {
    enter() {
        this.target = this.entity.target;
        this.currentAggroRange = this.entity.aggro_range;
        if (this.target.state_manager.currentState instanceof FleeState) {
            this.currentAggroRange *= 2; // Double aggro range if target is fleeing
        }
    }

    update() {
        if (!this.target || this.target.dead) {
            this.entity.state_manager.setState(new IdleState(this.entity));
            return;
        }

        const dx = Math.abs(this.target.position.x - this.entity.position.x);
        const dy = Math.abs(this.target.position.y - this.entity.position.y);
        const distance = dx + dy;

        if (distance <= this.entity.attack_range) {
            this.entity.state_manager.setState(new AttackState(this.entity));
        } else if (distance > this.currentAggroRange) {
            this.entity.state_manager.setState(new IdleState(this.entity));
        } else {
            const now = performance.now();
            if (now - this.entity.last_move_time >= 1000 / this.entity.speed) {
                this.entity.path = this.entity.area.aStar(
                    this.entity.position,
                    this.target.position
                );
                if (this.entity.path && this.entity.path.length > 1) {
                    const nextPos = this.entity.path[1];
                    if (this.entity.area.grid[nextPos.y][nextPos.x] === null) {
                        this.entity.area.grid[this.entity.position.y][
                            this.entity.position.x
                        ] = null;
                        this.entity.position.x = nextPos.x;
                        this.entity.position.y = nextPos.y;
                        this.entity.area.grid[this.entity.position.y][
                            this.entity.position.x
                        ] = this.entity;
                        this.entity.area.updateEntityPosition(this.entity);
                        this.entity.last_move_time = now;
                        console.log(
                            `${this.entity.name} chases to (${nextPos.x}, ${nextPos.y})`
                        );
                    }
                }
            }
        }
    }

    exit() {}
}