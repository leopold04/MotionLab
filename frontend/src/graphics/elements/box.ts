import Square from "./square.js";
import SeededRandom from "../utils/random.js";
class Box {
  // hollow square meant to contain objects like particles or squares
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  size: number;
  x: number;
  y: number;

  constructor(canvas: any, ctx: any) {
    this.canvas = canvas;
    this.ctx = ctx;
    // box size is proportional to width of screen
    this.size = this.canvas.width * 0.95;
    // centering the box
    this.x = (this.canvas.width - this.size) / 2;
    this.y = (this.canvas.height - this.size) / 2;
  }

  draw() {
    this.ctx.strokeStyle = "red";
    this.ctx.beginPath();
    this.ctx.rect(this.x, this.y, this.size, this.size);
    // stroke is for empty objects, fill is for full ones
    this.ctx.stroke();
  }

  move() {
    // if box is staying the same size, we do not need to update it
    // making sure box stays centered
    this.x = (this.canvas.width - this.size) / 2;
    this.y = (this.canvas.height - this.size) / 2;
  }

  randomizeSquarePositions(elements: Square[], seed: number): void {
    const rng = new SeededRandom(seed);
    // Function to check for collisions
    const collisions = function (elements: Square[]): boolean {
      for (let i = 0; i < elements.length; i++) {
        for (let j = i + 1; j < elements.length; j++) {
          if (Square.collides(elements[i], elements[j])) {
            return true;
          }
        }
      }
      return false;
    };

    // Randomize positions one by one, checking for collisions
    let allValid = false;
    while (!allValid) {
      // First, randomize each square's position
      for (let s of elements) {
        s.pos.x = rng.randomRange(this.x, this.x + this.size - s.size);
        s.pos.y = rng.randomRange(this.y, this.y + this.size - s.size);
      }

      // Check for collisions
      allValid = !collisions(elements);
    }

    // Optionally: Randomize velocities or other properties here.
  }
}
export default Box;
