import { Game } from "./scripts/Game.js";
import { Area } from "./scripts/Area.js";
import { Mob } from "./scripts/Mob.js";
import { Burn } from "./scripts/status-effects/Burn.js";

// Create the game instance
const game = new Game("area");

// Create and add game areas
const forest = new Area("Forest", "area", 10, 10);
const cave = new Area("Cave", "area", 10, 10);

game.addArea(forest);
game.addArea(cave);

// Create the player
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

// Create enemies
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
skeleton.set_target(player);

const orc = new Mob(3, "orc", "Orc", 8, 200, 200, 5, 1, {}, 2, 15, 1, 1, 5, 2);
orc.position = { x: 4, y: 2 };
orc.apply_status_effect(new Burn(10, 1));

// Add entities to the starting area (forest)
forest.addEntity(player);
forest.addEntity(goblin);
forest.addEntity(skeleton);
forest.addEntity(orc);

// Start in the forest
game.switchArea("Forest");
game.start();
