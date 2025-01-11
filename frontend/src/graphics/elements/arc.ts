import Vector from "./vector.js";
import Particle from "./particle.js";
class Arc {
  // hollow circle drawn with arc
  pos: Vector;
  radius: number;
  emptyAngle: number;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  rotationSpeed: number;
  startAngle: number;
  endAngle: number;
  // prettier-ignore
  constructor(radius: number, emptyAngle: number, canvas:any, ctx: any){
    this.radius = radius;
    this.canvas = canvas;
    this.ctx = ctx;
    this.emptyAngle = emptyAngle;
    this.pos = new Vector(this.canvas.width / 2, this.canvas.height / 2);
    const theta = Math.PI * emptyAngle / 180;
    this.startAngle = theta / 2;
    this.endAngle = (-1 * theta) / 2;
    this.rotationSpeed = 0.01;

  }

  draw() {
    this.ctx.strokeStyle = "red";
    this.ctx.beginPath();
    this.ctx.arc(this.pos.x, this.pos.y, this.radius, this.startAngle, this.endAngle);
    this.ctx.stroke();
  }
  move() {
    this.startAngle += this.rotationSpeed;
    this.endAngle += this.rotationSpeed;
  }

  randomRange(min: number, max: number): number {
    // Use Math.random() to generate a number between min and max (inclusive of max)
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  randomizeParticlePositions(elements: Particle[]): void {
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
        let angle = this.randomRange(0, 2 * Math.PI);
        let distance = this.randomRange(0, this.radius - p.radius - 1);
        p.pos.x = this.pos.x + Math.cos(angle) * distance;
        p.pos.y = this.pos.y + Math.sin(angle) * distance;
      }

      // Check for collisions
      allValid = !collisions(elements);
    }
  }
}

export default Arc;
