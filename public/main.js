import { Area } from "./scripts/area.js";
import { Mob } from "./scripts/mob.js";

import {
    StateManager,
    State,
    IdleState,
    ChaseState,
    FleeState,
    AttackState,
    WanderState,
    PatrolState,
} from "./scripts/states/statemanager.js";

// Create the game area
const gameArea = new Area("Forest", "area", 10, 10);

// Create a player mob
const player = new Mob(
    0,
    "player",
    "Player",
    10,
    300,
    300,
    15,
    2,
    {},
    2,
    20,
    1,
    1,
    5,
    5
);
player.position = { x: 0, y: 0 };
player.canWander = false;
player.stateManager = new StateManager(); // Add StateManager
player.stateManager.setState(new IdleState(player)); // Start in IdleState

// Create other mobs
const goblin = new Mob(
    1,
    "goblin",
    "Goblin",
    5,
    200,
    200,
    10,
    1,
    {},
    1,
    10,
    1,
    1,
    3,
    1
);
goblin.position = { x: 1, y: 1 };
// goblin.setTarget(player);
goblin.stateManager.setState(new IdleState(goblin));

const skeleton = new Mob(
    2,
    "skeleton",
    "Skeleton",
    7,
    150,
    150,
    10,
    1,
    {},
    1,
    12,
    1,
    1,
    5,
    0
);
skeleton.position = { x: 2, y: 1 };
skeleton.setTarget(player); // Skeleton targets player, will start in ChaseState
skeleton.stateManager.setState(new ChaseState(skeleton));

// const orc = new Mob(3, "orc", "Orc", 8, 200, 200, 5, 1, {}, 2, 15, 1, 1, 5, 2);
// orc.position = { x: 4, y: 2 };
// orc.stateManager = new StateManager();
// orc.stateManager.setState(new WanderState(orc));

// Add entities to the game area
gameArea.addEntity(player);
gameArea.addEntity(goblin);
gameArea.addEntity(skeleton);
// gameArea.addEntity(orc);

// Click handler for pathfinding (unchanged from your code)
gameArea.container.addEventListener("click", (event) => {
    const rect = gameArea.container.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / gameArea.cellWidth);
    const y = Math.floor((event.clientY - rect.top) / gameArea.cellHeight);

    const targetEntity = gameArea.grid[y][x];
    if (targetEntity) {
        player.setTarget(targetEntity);
        player.stateManager.setState(new ChaseState(player)); // Switch to ChaseState
    } else {
        player.path = gameArea.aStar(player.position, { x, y });
        if (player.path && player.path.length > 1) {
            player.path.shift(); // Remove current position
        }
        player.setTarget(null);
        player.stateManager.setState(new IdleState(player)); // Back to IdleState when moving
    }
});

// Modified game loop to include simulation steps
function gameLoop() {
    gameArea.entities.forEach((entity) => {
        entity.update(); // Handles all state updates
    });
    requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();
