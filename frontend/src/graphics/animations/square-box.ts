import AnimationConfig from "../utils/animation-config.js";
import Square from "../elements/square.js";
import Box from "../elements/box.js";

class BounceSquare {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  s1: Square;
  s2: Square;
  s3: Square;
  box: Box;
  squares: Square[];

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
    this.box = new Box(this.canvas, this.ctx);
    const box_size = this.box.size;
    // prettier-ignore
    this.s1 = new Square( this.box.x + 10, 100, box_size * 0.1, 1, 2, "red", this.box, this.canvas, this.ctx);
    // prettier-ignore
    this.s2 = new Square(this.box.x + 80,this.box.y + 100,box_size * 0.1,3, -4, "blue",this.box,this.canvas,this.ctx);
    // prettier-ignore
    this.s3 = new Square(500,400,box_size * 0.1,-2, -3,"green", this.box, this.canvas,this.ctx);
    this.squares = [this.s1, this.s2, this.s3];
    this.box.randomizeSquarePositions(this.squares);
    this.config = config;
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

  // drawing all things
  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); // Clear the canvas
    // drawing squares / boxes
    this.ctx.fillStyle = this.config["background_color"] as string;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (let s of this.squares) {
      s.draw();
    }
    this.box.draw();
  }

  handleSound(sound: string) {
    // path needs to be relative to the file it is being run in
    if (typeof window === "undefined") {
      // path is relative to main dir (since we run it )
      this.audioTimeline.push({ audio: `./assets/${sound}`, frame: this.frame });
    } else {
      // path is relative to index.html
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
  module.exports = BounceSquare;
}
export default BounceSquare;
