import { State } from "./State.js";
import { ChaseState } from "./ChaseState.js";
import { IdleState } from "./IdleState.js";

import { Mob } from "../Mob.js";

export class PatrolState extends State {
    constructor(entity) {
        super(entity);
        this.patrolCenter = entity.patrol_center || entity.position; // Default to spawn position
        this.points = [
            { x: this.patrolCenter.x - 1, y: this.patrolCenter.y - 1 },
            { x: this.patrolCenter.x + 1, y: this.patrolCenter.y - 1 },
            { x: this.patrolCenter.x + 1, y: this.patrolCenter.y + 1 },
            { x: this.patrolCenter.x - 1, y: this.patrolCenter.y + 1 },
        ];
        this.currentPointIndex = 0;
    }

    enter() {
        this.startTime = performance.now();
    }

    update() {
        const now = performance.now();
        // Check for a target within aggro_range if the entity is a Mob.
        if (
            this.entity instanceof Mob &&
            this.entity.target &&
            !this.entity.target.dead &&
            this.entity.can_chase
        ) {
            const distance =
                Math.abs(
                    this.entity.target.position.x - this.entity.position.x
                ) +
                Math.abs(
                    this.entity.target.position.y - this.entity.position.y
                );
            if (distance <= this.entity.aggro_range) {
                this.entity.state_manager.setState(new ChaseState(this.entity));
                return;
            }
        }

        if (now - this.entity.last_attacked_time < 2000) {
            this.entity.state_manager.setState(new IdleState(this.entity));
            return;
        }

        if (now - this.entity.last_move_time >= 1000 / this.entity.speed) {
            const targetPoint = this.points[this.currentPointIndex];
            this.entity.path = this.entity.area.aStar(
                this.entity.position,
                targetPoint
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
                        `${this.entity.name} patrols to (${nextPos.x}, ${nextPos.y})`
                    );
                }
            }
            if (
                this.entity.position.x === targetPoint.x &&
                this.entity.position.y === targetPoint.y
            ) {
                this.currentPointIndex = (this.currentPointIndex + 1) % 4;
            }
        }
    }

    exit() {}
}