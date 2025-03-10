class EventEmitter {
  //Stores event listeners, mapping event names to arrays of callback functions.
  public events: { [event: string]: Function[] } = {};

  /**
   * Adds a callback function to the specified event.
   *
   * @param event The name of the event.
   * @param hash A unique hash
   * @param callback The function to be called when the event is emitted.
   */
  on(event: string, hash: string, callback: Function) {
    this.events[event + hash] = this.events[event + hash] || [];
    this.events[event + hash].push(callback);
  }

  /**
   * Removes a callback function from the specified event.
   *
   * @param event The name of the event.
   * @param callback The function to be removed.
   */
  off(event: string, hash: string, callback: Function) {
    if (this.events[event + hash]) {
      this.events[event + hash] = this.events[event + hash].filter((cb) => cb !== callback);
    }
  }

  /**
   * Emits an event and calls all registered callback functions.
   *
   * @param event The name of the event.
   * @param args Additional arguments to be passed to the callback functions.
   */
  emit(event: string, hash: string, ...args: any[]) {
    if (this.events[event + hash]) {
      this.events[event + hash].forEach((callback) => callback(...args));
    }
  }

  // clears the event list
  clear(event: string, hash: string) {
    delete this.events[event + hash];
  }
}

// exporting emitter instance so that multiple classes can use it at the same time
const emitter = new EventEmitter();

export default emitter;
