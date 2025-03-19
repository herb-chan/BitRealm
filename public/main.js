import { Area } from "./scripts/Area.js";
import { Mob } from "./scripts/Mob.js";
import { Burn } from "./scripts/status-effects/Burn.js";

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

const orc = new Mob(3, "orc", "Orc", 8, 200, 200, 5, 1, {}, 2, 15, 1, 1, 5, 2);
orc.position = { x: 4, y: 2 };
orc.apply_status_effect(new Burn(10, 10));

// Add entities to the game area
gameArea.addEntity(player);
gameArea.addEntity(goblin);
gameArea.addEntity(skeleton);
gameArea.addEntity(orc);

// Modified game loop to include simulation steps
function gameLoop() {
    gameArea.entities.forEach((entity) => {
        entity.update(); // Handles all state updates
    });
    requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();
