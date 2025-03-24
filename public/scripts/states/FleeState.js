import { State } from "./State.js";
import { IdleState } from "./IdleState.js";

export class FleeState extends State {
    enter() {
        this.attacker = this.entity.attacker; // Assume attacker is set when damaged
    }

    update() {
        const now = performance.now();
        if (
            now - this.entity.last_attacked_time >= 5000 ||
            this.entity.health > this.entity.max_health * 0.2
        ) {
            this.entity.state_manager.setState(new IdleState(this.entity));
            return;
        }

        // Flee logic: move away from attacker
        if (this.attacker && this.entity.area) {
            const dx = this.entity.position.x - this.attacker.position.x;
            const dy = this.entity.position.y - this.attacker.position.y;
            const direction = { x: Math.sign(dx), y: Math.sign(dy) };
            const newX = this.entity.position.x + direction.x;
            const newY = this.entity.position.y + direction.y;

            if (this.entity.area.isValidMove(newX, newY)) {
                this.entity.area.grid[this.entity.position.y][
                    this.entity.position.x
                ] = null;
                this.entity.position.x = newX;
                this.entity.position.y = newY;
                this.entity.area.grid[this.entity.position.y][
                    this.entity.position.x
                ] = this.entity;
                this.entity.area.updateEntityPosition(this.entity);
                console.log(`${this.entity.name} flees to (${newX}, ${newY})`);
            }
        }
    }

    exit() {}
}