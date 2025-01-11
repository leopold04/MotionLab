class EventEmitter {
  //Stores event listeners, mapping event names to arrays of callback functions.
  public events: { [event: string]: Function[] } = {};

  /**
   * Adds a callback function to the specified event.
   *
   * @param event The name of the event.
   * @param callback The function to be called when the event is emitted.
   */
  on(event: string, callback: Function) {
    this.events[event] = this.events[event] || [];
    this.events[event].push(callback);
  }

  /**
   * Removes a callback function from the specified event.
   *
   * @param event The name of the event.
   * @param callback The function to be removed.
   */
  off(event: string, callback: Function) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter((cb) => cb !== callback);
    }
  }

  /**
   * Emits an event and calls all registered callback functions.
   *
   * @param event The name of the event.
   * @param args Additional arguments to be passed to the callback functions.
   */
  emit(event: string, ...args: any[]) {
    if (this.events[event]) {
      this.events[event].forEach((callback) => callback(...args));
    }
  }

  // clears the event list (use when initializing animations)
  clear() {
    this.events = {};
  }
}

// exporting emitter instance so that multiple classes can use it at the same time
const emitter = new EventEmitter();

export default emitter;
