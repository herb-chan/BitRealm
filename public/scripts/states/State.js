export class State {
    constructor(entity) {
        this.entity = entity;
    }

    enter() {}

    /**
     * Updates the state.
     * @param {number} deltaTime - The time elapsed since the last update, in seconds.
     */
    update(deltaTime) {}

    exit() {}
}
