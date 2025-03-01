import Vector from "./vector.js";
import Particle from "./particle.js";
import SeededRandom from "../utils/random.js";
class Arc {
  pos: Vector;
  radius: number;
  emptyAngle: number;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  rotationSpeed: number;
  startAngle: number;
  endAngle: number;
  constructor(radius: number, emptyAngle: number, canvas: any, ctx: any) {
    this.radius = radius;
    this.canvas = canvas;
    this.ctx = ctx;
    this.emptyAngle = emptyAngle; // in degrees, not radians
    this.pos = new Vector(this.canvas.width / 2, this.canvas.height / 2);
    const theta = (Math.PI * emptyAngle) / 180;
    this.startAngle = -theta / 2;
    this.endAngle = theta / 2;
    this.rotationSpeed = 0.01;
  }

  draw() {
    this.ctx.strokeStyle = "red";
    this.ctx.beginPath();
    this.ctx.arc(this.pos.x, this.pos.y, this.radius, 2 * Math.PI - this.startAngle, 2 * Math.PI - this.endAngle);
    this.ctx.stroke();
  }
  move() {
    this.startAngle = (this.startAngle + this.rotationSpeed) % (2 * Math.PI);
    this.endAngle = (this.endAngle + this.rotationSpeed) % (2 * Math.PI);
  }

  rotate(angle: number) {
    // takes in angle in degrees
    // changes the inital rotation by a set amount
    angle = (Math.PI * angle) / 180; // converting from degrees to radians
    this.startAngle = (this.startAngle + angle) % (2 * Math.PI);
    this.endAngle = (this.endAngle + angle) % (2 * Math.PI);
  }

  randomizeParticlePositions(elements: Particle[], seed: number): void {
    const rng = new SeededRandom(seed);

    // Function to check for collisions
    const collisions = function (elements: Particle[]): boolean {
      for (let i = 0; i < elements.length; i++) {
        for (let j = i + 1; j < elements.length; j++) {
          if (Particle.collides(elements[i], elements[j])) {
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
      for (let p of elements) {
        // random angle between 0 and 2pi, distance 0 to ring radius - particle radius
        let angle = rng.randomRange(0, 2 * Math.PI);
        let distance = rng.randomRange(0, this.radius - p.radius - 1);
        p.pos.x = this.pos.x + Math.cos(angle) * distance;
        p.pos.y = this.pos.y + Math.sin(angle) * distance;
      }
      // Check for collisions
      allValid = !collisions(elements);
    }
  }
}

export default Arc;
