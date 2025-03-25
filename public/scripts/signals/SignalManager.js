/**
 * Manages event signals with support for priorities, auto-cleanup, and queued execution.
 */
class SignalManager {
    constructor() {
        /**
         * Stores event listeners in a Map where the key is the event name
         * and the value is an array of { ref: WeakRef<Function>, priority: number }.
         * @type {Map<string, Array<{ ref: WeakRef<Function>, priority: number }>>}
         */
        this.listeners = new Map();

        /**
         * Used to automatically clean up listeners when they are garbage collected.
         * @type {FinalizationRegistry<string>}
         */
        this.registry = new FinalizationRegistry((key) => {
            this.listeners.delete(key);
        });

        /**
         * Queue of events to be processed.
         * @type {Array<{ event: string, args: any[] }>}
         */
        this.eventQueue = [];
    }

    /**
     * Registers an event listener.
     * @param {string} event - The name of the event.
     * @param {Function} callback - The function to call when the event is emitted.
     * @param {number} [priority=0] - The priority of the callback (higher values execute first).
     * @param {boolean} [autoCleanup=false] - If true, the listener is automatically removed when garbage collected.
     */
    on(event, callback, priority = 0, autoCleanup = false) {
        if (!this.listeners.has(event)) this.listeners.set(event, []);

        const ref = new WeakRef(callback);
        this.listeners.get(event).push({ ref, priority });
        this.listeners.get(event).sort((a, b) => b.priority - a.priority);

        if (autoCleanup) this.registry.register(callback, event);
    }

    /**
     * Removes an event listener.
     * @param {string} event - The name of the event.
     * @param {Function} callback - The function to remove.
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.set(
                event,
                this.listeners
                    .get(event)
                    .filter(({ ref }) => ref.deref() !== callback)
            );
            if (this.listeners.get(event).length === 0)
                this.listeners.delete(event);
        }
    }

    /**
     * Emits an event, adding it to the queue for processing.
     * @param {string} event - The name of the event.
     * @param {...any} args - Arguments to pass to the listeners.
     */
    emit(event, ...args) {
        this.eventQueue.push({ event, args });
    }

    /**
     * Processes all queued events in the order they were emitted.
     */
    processQueue() {
        while (this.eventQueue.length) {
            const { event, args } = this.eventQueue.shift();
            if (this.listeners.has(event)) {
                for (const { ref } of this.listeners.get(event)) {
                    const callback = ref.deref();
                    if (callback) callback(...args);
                }
            }
        }
    }

    /**
     * Registers an event listener that will be automatically removed after its first execution.
     * @param {string} event - The name of the event.
     * @param {Function} callback - The function to call when the event is emitted.
     * @param {number} [priority=0] - The priority of the callback (higher values execute first).
     */
    once(event, callback, priority = 0) {
        const wrappedCallback = (...args) => {
            callback(...args);
            this.off(event, wrappedCallback);
        };
        this.on(event, wrappedCallback, priority);
    }
}
