import emitter from "../utils/emitter.js";
import AnimationConfig from "../utils/animation-config.js";
import Particle from "../elements/particle.js";
import Arc from "../elements/arc.js";
import { createCanvas, Canvas, CanvasRenderingContext2D } from "canvas";

class SpinRing {
  canvas: HTMLCanvasElement | Canvas;
  ctx: CanvasRenderingContext2D | any;
  arc: Arc;
  p1: Particle;
  particles: Particle[];
  frame: number = 0;
  fps: number = 60;
  audioTimeline: object[] = [];
  config: AnimationConfig;
  playing: boolean = false;
  requestID: number | null = null; // Variable to hold the requestAnimationFrame ID
  collisionSound: string | null = null;
  escapeSound: string | null = null;

  constructor(config: AnimationConfig) {
    if (typeof window === "undefined") {
      this.canvas = createCanvas(config["canvas_width"], config["canvas_height"]);
      this.ctx = this.canvas.getContext("2d")!;
    } else {
      this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
      this.ctx = this.canvas.getContext("2d")!;
      this.canvas.width = config["canvas_width"];
      this.canvas.height = config["canvas_height"];
    }
    let scaleFactor;
    switch (config["canvas_width"]) {
      case 480:
        scaleFactor = 2 / 3;
        break;
      case 720:
        scaleFactor = 1;
        break;
      case 1080:
        scaleFactor = 3 / 2;
        break;
      default:
        scaleFactor = 1;
        break;
    }
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const arcRadius = 0.8 * (config["canvas_width"] / 2);
    this.arc = new Arc(arcRadius, 45, this.canvas, this.ctx);
    const gravity = 0.05 * scaleFactor;

    this.p1 = new Particle(
      centerX,
      centerY,
      40 * scaleFactor,
      5 * scaleFactor,
      5 * scaleFactor,
      gravity,
      this.arc,
      config["particle_1_appearance"]!,
      this.canvas,
      this.ctx
    );

    this.particles = [this.p1];
    const seed = config["seed"] as number;
    this.arc.randomizeParticlePositions(this.particles, seed);

    emitter.clear(); // clearing event emitter
    emitter.on("collision", () => this.handleArcCollision()); // initalizing emitter to listen for 'collision'
    emitter.on("escape", () => this.handleArcEscape()); // listening for escape
    this.config = config;
  }

  async load() {
    let startTime = Date.now();
    try {
      for (let p of this.particles) {
        // setting images if they need to be set
        await p.setImage();
      }
      // load sound from backend
      this.collisionSound = "http://localhost:8000/file/get_asset/" + this.config["collision_sound"];
      this.escapeSound = "http://localhost:8000/file/get_asset/" + this.config["escape_sound"];
    } catch (error) {
      console.log("error loading images");
    }
    let loadTime = (Date.now() - startTime) / 1000;
    return loadTime;
  }

  // updating positions of all things (squares, containers, etc)
  update() {
    for (let p of this.particles) {
      p.move();
    }
    this.arc.move();
    // detect and resolve collisions
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        Particle.handleCollision(this.particles[i], this.particles[j]);
      }
    }
    this.frame++;
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); // Clear the canvas
    this.ctx.fillStyle = this.config["background_color"] as string; // set background color
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height); // draw background

    for (let p of this.particles) {
      p.draw();
    }
    this.arc.draw();
  }

  handleArcCollision() {
    if (typeof window === "undefined") {
      this.audioTimeline.push({ audio: this.collisionSound, frame: this.frame });
    } else {
      const audio = new Audio(this.collisionSound!);
      audio.play();
    }
  }

  handleArcEscape() {
    if (typeof window === "undefined") {
      this.audioTimeline.push({ audio: this.escapeSound, frame: this.frame });
    } else {
      const audio = new Audio(this.escapeSound!);
      audio.play();
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
  }

  // Start playing the animation
  play() {
    if (!this.playing) {
      this.playing = true;
      this.animate(); // Start the animation loop if not already playing
    }
  }
}
export default SpinRing;
