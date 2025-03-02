import AnimationConfig from "../../utils/animation-config.js";
import emitter from "../../utils/emitter.js";
import Square from "../../elements/square.js";
import Box from "../../elements/box.js";
import { createCanvas, Canvas, CanvasRenderingContext2D } from "canvas";

class BounceSquare {
  canvas: HTMLCanvasElement | Canvas;
  ctx: CanvasRenderingContext2D | any;
  s1: Square;
  s2: Square;
  box: Box;
  squares: Square[];
  frame: number = 0;
  fps: number = 60;
  audioTimeline: object[] = [];
  config: AnimationConfig;
  playing: boolean = false;
  seed: number;
  requestID: number | null = null; // Variable to hold the requestAnimationFrame ID

  collisionSource: string = "";
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

    this.box = new Box(this.canvas, this.ctx);
    const box_size = this.box.size;

    this.s1 = new Square(
      centerX + 50 * scaleFactor,
      centerY + 50 * scaleFactor,
      box_size * 0.2 * scaleFactor,
      6 * scaleFactor,
      4 * scaleFactor,
      config["square_1_appearance"]!,
      this.box,
      this.canvas,
      this.ctx
    );
    this.s2 = new Square(
      centerX - 50 * scaleFactor,
      centerY - 50 * scaleFactor,
      box_size * 0.2 * scaleFactor,
      -8 * scaleFactor,
      7 * scaleFactor,
      config["square_2_appearance"]!,
      this.box,
      this.canvas,
      this.ctx
    );
    this.squares = [this.s1, this.s2];
    this.seed = config["seed"] as number;
    this.box.randomizeSquarePositions(this.squares, this.seed);
    this.config = config;

    emitter.clear();
    emitter.on("collision", () => this.handleSound());
  }

  async load() {
    let startTime = Date.now();
    try {
      // loading images
      for (let s of this.squares) {
        await s.setImage();
      }

      // load sound from backend
      this.collisionSource = "http://localhost:8000/file/get_asset/" + this.config["collision_sound"];
    } catch (error) {
      console.log("error loading images");
    }
    let loadTime = (Date.now() - startTime) / 1000;
    return loadTime;
  }

  // updating positions of all things (squares, containers, etc)
  update() {
    for (let s of this.squares) {
      s.move();
    }
    // handling collision
    for (let i = 0; i < this.squares.length; i++) {
      for (let j = i + 1; j < this.squares.length; j++) {
        Square.handleSquareCollision(this.squares[i], this.squares[j]);
      }
    }
    this.frame++;
  }

  draw() {
    // drawing objects on screen
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); // Clear the canvas
    this.ctx.fillStyle = this.config["background_color"] as string; // set background color
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height); // draw background

    for (let s of this.squares) {
      s.draw();
    }
    this.box.draw();
  }

  handleSound() {
    if (typeof window === "undefined") {
      this.audioTimeline.push({ audio: this.collisionSource, frame: this.frame });
    } else {
      const audio = new Audio(this.collisionSource);
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
export default BounceSquare;
