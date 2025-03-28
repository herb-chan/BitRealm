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
        this.timeSinceLastMove = 0; // Tracks time since the last move
    }

    enter() {
        this.timeSinceLastMove = 0; // Reset move timer
    }

    update(deltaTime) {
        // Increment the time since the last move
        this.timeSinceLastMove += deltaTime;

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

        // Check if the entity should stop patrolling and return to IdleState
        if (this.entity.last_attacked_time < 2) {
            this.entity.state_manager.setState(new IdleState(this.entity));
            return;
        }

        // Handle movement delay based on speed
        const moveDelay = 1 / this.entity.speed; // Balance movement speed
        if (this.timeSinceLastMove >= moveDelay) {
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
                    console.log(
                        `${this.entity.name} patrols to (${nextPos.x}, ${nextPos.y})`
                    );
                }
            }

            // Check if the entity has reached the target point
            if (
                this.entity.position.x === targetPoint.x &&
                this.entity.position.y === targetPoint.y
            ) {
                this.currentPointIndex = (this.currentPointIndex + 1) % 4;
            }

            // Reset the move timer
            this.timeSinceLastMove = 0;
        }
    }

    exit() {}
}
