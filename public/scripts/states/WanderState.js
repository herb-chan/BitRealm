import { State } from "./State.js";
import { ChaseState } from "./ChaseState.js";
import { IdleState } from "./IdleState.js";

import { Mob } from "../Mob.js";

export class WanderState extends State {
    constructor(entity) {
        super(entity);
        this.wanderingFactor = this.entity.wandering_factor || 1;
        this.baseWanderTime = 10; // 10 seconds (converted to seconds)
        this.wanderDuration = 0;
        this.lastMoveTime = 0; // Tracks time since the last move
    }

    enter() {
        this.wanderDuration = this.baseWanderTime * this.wanderingFactor;
        this.lastMoveTime = 0; // Reset move timer
    }

    update(deltaTime) {
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

        // Check if the entity should stop wandering.
        this.wanderDuration -= deltaTime;
        if (this.wanderDuration <= 0) {
            this.entity.state_manager.setState(new IdleState(this.entity));
            return;
        }

        // Handle movement delay based on speed.
        this.lastMoveTime += deltaTime;
        const moveDelay = 1 / this.entity.speed; // Balance movement speed
        if (this.lastMoveTime >= moveDelay) {
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
                    this.lastMoveTime = 0; // Reset move timer
                }
            }
        }
    }

    exit() {}
}
