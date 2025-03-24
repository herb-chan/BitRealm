import { State } from "./State.js";
import { ChaseState } from "./ChaseState.js";
import { IdleState } from "./IdleState.js";

import { Mob } from "../Mob.js";

export class WanderState extends State {
    constructor(entity) {
        super(entity);
        this.wanderingFactor = this.entity.wandering_factor || 1;
        this.baseWanderTime = 10000; // 10 seconds
    }

    enter() {
        this.startTime = performance.now();
        this.wanderDuration = this.baseWanderTime * this.wanderingFactor;
        this.entity.last_wander_time = this.startTime;
        this.lastMoveTime = 0; // Track last move time
    }

    update() {
        // Check for a target within aggro_range if the entity is a Mob.
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

        if (now - this.entity.last_attacked_time < 2000) {
            this.entity.state_manager.setState(new IdleState(this.entity));
            return;
        }

        const moveDelay = 1000 / this.entity.speed; // Balance movement speed

        // Check if enough time has passed to move.
        if (now - this.lastMoveTime >= moveDelay) {
            if (this.entity.area) {
                const neighbors = this.entity.area.getNeighbors(
                    this.entity.position.x,
                    this.entity.position.y
                );
                if (neighbors.length > 0) {
                    const randomNeighbor =
                        neighbors[Math.floor(Math.random() * neighbors.length)];
                    this.entity.area.grid[this.entity.position.y][
                        this.entity.position.x
                    ] = null;
                    this.entity.position.x = randomNeighbor.x;
                    this.entity.position.y = randomNeighbor.y;
                    this.entity.area.grid[this.entity.position.y][
                        this.entity.position.x
                    ] = this.entity;
                    this.entity.area.updateEntityPosition(this.entity);
                    console.log(
                        `${this.entity.name} wanders to (${this.entity.position.x}, ${this.entity.position.y})`
                    );
                    this.lastMoveTime = now; // Update last move time
                }
            }
        }

        // End wandering after the duration.
        if (now - this.startTime >= this.wanderDuration) {
            this.entity.state_manager.setState(new IdleState(this.entity));
        }
    }

    exit() {}
}
