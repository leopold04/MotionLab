import emitter from "../utils/emitter.js";
import AnimationConfig from "../utils/animation-config.js";
import Particle from "../elements/particle.js";
import Arc from "../elements/arc.js";
class SpinRing {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  ring: Arc;
  p1: Particle;
  particles: Particle[];
  frame: number = 0;
  fps: number = 60;
  audioTimeline: object[] = [];
  config: AnimationConfig;
  playing: boolean = false;
  requestID: number | null = null; // Variable to hold the requestAnimationFrame ID

  constructor(config: AnimationConfig) {
    // generating headless with node js
    if (typeof window === "undefined") {
      const { createCanvas } = require("canvas");
      this.canvas = createCanvas(config["canvas_width"], config["canvas_height"]);
      this.ctx = this.canvas.getContext("2d")!;
    } else {
      this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
      this.ctx = this.canvas.getContext("2d")!;
      this.canvas.width = config["canvas_width"];
      this.canvas.height = config["canvas_height"];
    }
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    this.ring = new Arc(config["canvas_width"] / 2.25, 45, this.canvas, this.ctx);
    // prettier-ignore
    this.p1 = new Particle(centerX, centerY, 40, 0, 5, this.ring, "blue", this.canvas, this.ctx);
    // prettier-ignore
    //   this.p2 = new Particle(centerX + 50, centerY - 50, 40, 0, 0, this.ring, "green", this.canvas, this.ctx);

    this.particles = [this.p1];
    //  this.ring.randomizeParticlePositions(this.particles);

    // initializing the emitter to listen for 'collision' in the constructor
    emitter.on("collision", () => this.handleSound("sfx.wav"));
    this.config = config;
  }

  // updating positions of all things (squares, containers, etc)
  update() {
    for (let p of this.particles) {
      p.move();
    }
    this.ring.move();
    // handling collision
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        Particle.handleCollision(this.particles[i], this.particles[j]);
      }
    }
    this.frame++;
  }

  // drawing all things
  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); // Clear the canvas
    this.ctx.fillStyle = this.config["background_color"] as string; // set background color
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height); // draw background

    for (let p of this.particles) {
      p.draw();
    }
    this.ring.draw();
  }
  handleSound(sound: string) {
    // path needs to be relative to the file it is being run in
    if (typeof window === "undefined") {
      // path is relative to main dir (since we run it )
      this.audioTimeline.push({ audio: `./assets/${sound}`, frame: this.frame });
    } else {
      // path is relative to index.html
      console.log("sound");
      const a = new Audio(`../assets/${sound}`);
      a.play();
    }
  }
  // The animation function to animate
  animate() {
    if (this.playing) {
      let lastTime = performance.now();
      let frameTime = 1000 / this.fps; // Lock target framerate at fps

      const loop = () => {
        if (!this.playing) return; // Exit the loop if animation is paused

        let now = performance.now();
        let deltaTime = now - lastTime;

        if (deltaTime >= frameTime) {
          this.update();
          this.draw();
          lastTime = now - (deltaTime % frameTime); // Maintain consistent frame timing
        }

        this.requestID = requestAnimationFrame(loop); // Continue the loop
      };

      loop(); // Start the animation loop
    }
  }

  // Pause the animation
  pause() {
    this.playing = false;
    if (this.requestID !== null) {
      cancelAnimationFrame(this.requestID); // Cancel the animation frame request
      this.requestID = null;
    }
    console.log("paused");
  }

  // Start playing the animation
  play() {
    if (!this.playing) {
      this.playing = true;
      console.log("playing");
      this.animate(); // Start the animation loop if not already playing
    }
  }
}

if (typeof window === "undefined") {
  module.exports = SpinRing;
}
export default SpinRing;
