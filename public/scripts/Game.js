/**
 * Represents the main game loop and manages multiple areas.
 */
export class Game {
    constructor() {
        /**
         * A map storing areas by their name.
         * @type {Map<string, Area>}
         */
        this.areas = new Map();

        /**
         * The currently active game area.
         * @type {Area | null}
         */
        this.currentArea = null;

        /**
         * The timestamp of the last game update, used for delta time calculations.
         * @type {number}
         */
        this.lastUpdateTime = performance.now();

        /**
         * Whether the game loop is running.
         * @type {boolean}
         */
        this.running = false;
    }

    /**
     * Adds a new area to the game.
     * @param {Area} area - The area to add.
     */
    addArea(area) {
        this.areas.set(area.name, area);
        if (!this.currentArea) this.currentArea = area; // Set initial area
    }

    /**
     * Switches the currently active area.
     * @param {string} areaName - The name of the area to switch to.
     */
    switchArea(areaName) {
        if (this.areas.has(areaName)) {
            this.currentArea = this.areas.get(areaName);
            this.renderCurrentArea();
        } else {
            console.error(`Area '${areaName}' not found.`);
        }
    }

    /**
     * Renders the current area by replacing the game container content.
     */
    renderCurrentArea() {
        document.body.innerHTML = ""; // Clear previous area
        document.body.appendChild(this.currentArea.container);
    }

    /**
     * Runs the game loop, updating all entities in the current area.
     * Uses delta time for smooth updates.
     */
    gameLoop() {
        if (!this.running) return;

        const now = performance.now();
        const deltaTime = (now - this.lastUpdateTime) / 1000; // Convert to seconds
        this.lastUpdateTime = now;

        this.currentArea.entities.forEach((entity) => {
            if (typeof entity.update === "function") {
                entity.update(deltaTime);
            }
        });

        requestAnimationFrame(() => this.gameLoop());
    }

    /**
     * Starts the game loop if it is not already running.
     */
    start() {
        if (!this.running) {
            this.running = true;
            this.lastUpdateTime = performance.now();
            this.gameLoop();
        }
    }

    /**
     * Stops the game loop.
     */
    stop() {
        this.running = false;
    }
}
