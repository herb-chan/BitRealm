import { Mob } from "../Mob.js";

export class StateManager {
    constructor(entity) {
        this.entity = entity;
        this.current_state = null;
    }

    setState(new_state) {
        if (this.current_state) {
            this.current_state.exit();
        }
        this.current_state = new_state;
        this.current_state.enter();
        console.log(
            `${this.current_state.entity.name} is in ${this.current_state.constructor.name}`
        );
    }

    update() {
        if (this.current_state) {
            this.current_state.update();
        }
    }
}

export class State {
    constructor(entity) {
        this.entity = entity;
    }

    enter() {}
    update() {}
    exit() {}
}

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
