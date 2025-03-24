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
