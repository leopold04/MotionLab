class SeededRandom {
  // The seed for generating pseudo-random numbers
  private seed: number;

  // Modulus value (2^31 - 1), a large prime number used in LCG to constrain the random number range
  private modulus: number = 0x7fffffff; // 2^31 - 1

  // Multiplier used in the LCG formula, commonly used constant
  private multiplier: number = 0x41c64e6d; // A commonly used multiplier

  // Increment used in the LCG formula, commonly used constant
  private increment: number = 0x3039; // A commonly used increment

  /**
   * Constructor to initialize the SeededRandom instance with a specific seed value.
   * @param seed - The initial seed for the random number generator.
   */
  constructor(seed: number) {
    this.seed = seed; // Store the seed value for later use
  }

  /**
   * Generates the next pseudo-random number in the sequence.
   * This number is between 0 and 1, generated using the Linear Congruential Generator (LCG) algorithm.
   * The formula is:
   *   seed = (seed * multiplier + increment) % modulus
   * After updating the seed, the new seed is normalized by dividing by modulus to return a float between 0 and 1.
   * @returns A pseudo-random number between 0 and 1.
   */
  public next(): number {
    // Update the seed using the LCG formula
    this.seed = (this.seed * this.multiplier + this.increment) % this.modulus;

    // Return a value between 0 and 1 by normalizing the seed
    return this.seed / this.modulus;
  }

  /**
   * Generates a pseudo-random integer between the specified min and max values (inclusive).
   * This method uses the `next()` method to generate a float, which is then scaled and converted to an integer.
   * @param min - The minimum value of the random range (inclusive).
   * @param max - The maximum value of the random range (inclusive).
   * @returns A random integer between min and max.
   */
  randomRange(min: number, max: number): number {
    // Generate a float between 0 and 1 using `next()`
    // Scale it to the desired range [min, max], rounding down to get an integer
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  static generateHash(length: number = 5): string {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let hash = "";

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      hash += characters[randomIndex];
    }
    return hash;
  }
}

export default SeededRandom;
