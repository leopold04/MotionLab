import emitter from "../utils/emitter.js";
import AnimationConfig from "../utils/animation-config.js";
import Particle from "../elements/particle.js";
import Ring from "../elements/ring.js";
import { createCanvas, Canvas, CanvasRenderingContext2D } from "canvas";

class BounceParticle {
  canvas: HTMLCanvasElement | Canvas;
  ctx: CanvasRenderingContext2D | any;
  ring: Ring;
  p1: Particle;
  p2: Particle;
  particles: Particle[];
  frame: number = 0;
  fps: number = 60;
  audioTimeline: object[] = [];
  config: AnimationConfig;
  playing: boolean = false;
  requestID: number | null = null; // Variable to hold the requestAnimationFrame ID
  seed: number;
  soundSource: string;

  constructor(config: AnimationConfig) {
    // generating headless with node js
    if (typeof window === "undefined") {
      this.canvas = createCanvas(config["canvas_width"], config["canvas_height"]);
      this.ctx = this.canvas.getContext("2d")!;
    } else {
      this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
      this.ctx = this.canvas.getContext("2d")!;
      this.canvas.width = config["canvas_width"];
      this.canvas.height = config["canvas_height"];
    }
    // scaling the animation appropriately (default is 720p)
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
    // position settings
    const ringRadius = 0.8 * 360 * scaleFactor;
    const p1Radius = 40 * scaleFactor;
    const p2Radius = 40 * scaleFactor;
    const [p1vx, p1vy] = [2, 4].map((x) => scaleFactor * x);
    const [p2vx, p2vy] = [4, 2].map((x) => scaleFactor * x);

    const gravity = 0.01 * scaleFactor;

    this.ring = new Ring(ringRadius, this.canvas, this.ctx);
    // prettier-ignore

    this.p1 = new Particle(
      centerX,
      centerY,
      p1Radius,
      p1vx,
      p1vy,
      gravity,
      this.ring,
      config["particle_1_appearance"]!,
      this.canvas,
      this.ctx,
    );
    this.p2 = new Particle(
      centerX,
      centerY,
      p2Radius,
      p2vx,
      p2vy,
      gravity,
      this.ring,
      config["particle_2_color"]!,
      this.canvas,
      this.ctx
    );

    this.particles = [this.p1, this.p2];
    this.seed = config["seed"] as number;
    this.ring.randomizeParticlePositions(this.particles, this.seed);

    // clearing event emitter
    emitter.clear();
    // initializing the emitter to listen for 'collision'
    emitter.on("collision", () => this.handleSound());
    this.soundSource = "";
    this.config = config;
  }

  // updating positions of all things (squares, containers, etc)
  update() {
    for (let p of this.particles) {
      p.move();
    }
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        Particle.handleCollision(this.particles[i], this.particles[j]);
      }
    }
    this.frame++;
  }

  // loading images (TODO: add loading all audio)
  async load() {
    let startTime = Date.now();
    try {
      // loading images
      for (let p of this.particles) {
        await p.setImage();
      }

      // load sound from backend
      this.soundSource = "http://localhost:8000/file/get_asset/" + this.config["collision_sound"];
    } catch (error) {
      console.log("error loading images");
    }
    let loadTime = (Date.now() - startTime) / 1000;
    return loadTime;
  }

  // drawing all things
  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); // Clear the canvas
    // background
    this.ctx.fillStyle = this.config["background_color"] as string;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    for (let p of this.particles) {
      p.draw();
    }
    this.ring.draw();
  }

  handleSound() {
    // path needs to be relative to the file it is being run in
    if (typeof window === "undefined") {
      this.audioTimeline.push({ audio: this.soundSource, frame: this.frame });
    } else {
      // path is relative to the public folder
      // change this so that we load all sounds in initially, then restart them when its time to play
      // use audio.currentTime = 0 to reset, then audio.play()
      const a = new Audio(this.soundSource);
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
  }

  // Start playing the animation
  play() {
    if (!this.playing) {
      this.playing = true;
      this.animate(); // Start the animation loop if not already playing
    }
  }
}

export default BounceParticle;
