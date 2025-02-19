import emitter from "../utils/emitter.js";
import AnimationConfig from "../utils/animation-config.js";
import Particle from "../elements/particle.js";
import Ring from "../elements/ring.js";
import { createCanvas, Canvas, CanvasRenderingContext2D, loadImage } from "canvas";

class BounceParticle {
  canvas: HTMLCanvasElement | Canvas;
  ctx: CanvasRenderingContext2D | any;
  ring: Ring;
  p1: Particle;
  particles: Particle[];
  frame: number = 0;
  fps: number = 60;
  duration: number;
  audioTimeline: object[] = [];
  bounceTimes: number[] = [];
  config: AnimationConfig;
  playing: boolean = false;
  requestID: number | null = null; // Variable to hold the requestAnimationFrame ID
  seed: number;
  last: number = 0;
  soundStart: number = 0;
  sound: any;
  sequenceURL: string;
  sequenceFrameCount: number;
  sequenceFPS: number;
  songURL: string;
  images: any = []; // frames of our video to be rendered onto the canvas
  didx: number = 0; // essentially whether or not we progress frames / play the video (delta idx)
  imgIdx: number = 0; // index of the image we are loading in
  centerX: number;
  centerY: number;
  // number of frames we allow to pass without a bounce before we have to restart the audio
  soundBuffer: number = 60;
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
    // loading in animation configurations
    this.duration = config["duration"] * this.fps;
    this.seed = config["seed"] as number;
    // change this
    this.songURL = ("http://localhost:8000/file/get_asset/" + config["collision_sound"]) as string;
    this.sequenceURL = config["sequence"] as string;
    this.sequenceFPS = config["sequence_fps"] as number;
    this.sequenceFrameCount = config["sequence_frame_count"] as number;

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
    this.centerX = this.canvas.width / 2;
    this.centerY = this.canvas.height / 2;
    // position settings
    const ringRadius = 0.8 * 360 * scaleFactor;
    const p1Radius = 60 * scaleFactor;
    const [p1vx, p1vy] = [4, 6].map((x) => scaleFactor * x);

    const gravity = 0.25 * scaleFactor;

    this.ring = new Ring(ringRadius, this.canvas, this.ctx);
    this.p1 = new Particle(
      this.centerX,
      this.centerY,
      p1Radius,
      p1vx,
      p1vy,
      gravity,
      this.ring,
      config["particle_1_color"]!,
      this.canvas,
      this.ctx
    );

    this.particles = [this.p1];
    this.ring.randomizeParticlePositions(this.particles, this.seed);

    // clearing event emitter
    emitter.clear();
    // initializing the emitter to listen for 'collision'
    emitter.on("collision", () => this.handleBounce());
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
    if (this.frame - this.last >= this.soundBuffer) {
      this.didx = 0;
      if (typeof window === "object" && this.last != 0) {
        this.sound.pause();
        this.sound.currentTime = 0;
      }
    }
    if (typeof window === "undefined") {
      // make the timeline once we reach the end of the animation
      if (this.frame == this.duration - 1) {
        this.createAudioTimeline();
      }
    }
    this.frame++;
  }

  // loading images (TODO: add loading all audio)
  // TODO: create failsafe if assets are not loaded in yet
  async load() {
    console.log(this.config);
    let startTime = Date.now();
    let imagePromises = [];
    // initializing our image array to be full of null values so we can index into them properly later
    this.images = new Array(this.sequenceFrameCount - 1).fill(null);
    // sequenceURL = "supabase_url.com/bucket_path/"
    for (let i = 1; i < this.sequenceFrameCount; i++) {
      let framePath = this.sequenceURL + `/frame${i.toString().padStart(4, "0")}.png`;
      let frameURL = "http://localhost:8000/file/get_asset/" + framePath;
      // adding a promise to the queue and adding an image to the image array at index i - 1 (since i starts at 1)
      let imagePromise = this.loadImageAsync(frameURL, i - 1);
      imagePromises.push(imagePromise);
    }

    // wait for all images to be loaded concurrently
    await Promise.all(imagePromises);

    // use web audio api if we are in the browser
    if (typeof window === "object") {
      this.sound = new Audio(this.songURL);
    }

    let loadTime = (Date.now() - startTime) / 1000;
    console.log(`Loaded all frames in ${loadTime} seconds`);
    return loadTime;
  }

  // Helper function to load an image and assign it to the correct index
  async loadImageAsync(imgURL: string, index: number) {
    try {
      const img = await loadImage(imgURL);
      if (img === null) {
        throw new Error("Image could not be loaded");
      }
      // Assign the image directly to its correct index
      this.images[index] = img; // Using the correct index (i - 1) in the original code
    } catch (error) {
      console.error(`Error loading image at ${imgURL}:`, error);
    }
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
    this.renderImage();
  }

  /*
  TODO: algorithmically determine how long each sound should be for headless generation
  dont add to audio timeline until the end
  instead collect times of bounces, then make audio timeline based off of those
  */

  // renders a single frame of the video to the screen
  renderImage() {
    // either choose to stay on the current image or go to the next depending on didx
    this.imgIdx += this.didx;
    let index = Math.round(this.imgIdx) % (this.sequenceFrameCount - 1);
    // always end up having an image drawn
    let currentImage = this.images[index];
    let imgW = 0.3 * this.canvas.width;
    try {
      let imgH = imgW * (currentImage.height / currentImage.width); // keep aspect ratio
      let imgX = this.centerX - imgW / 2;
      let imgY = this.centerY - imgH / 2;
      this.ctx.drawImage(currentImage, imgX, imgY, imgW, imgH);
    } catch (error) {
      console.log(error, this.imgIdx);
    }
  }

  resizeParticle() {
    this.p1.radius += 1;
    // move along line to center so the ball does not stick to the walls
    let delta = 1 / 100;
    this.p1.pos.x += delta * (this.centerX - this.p1.pos.x);
    this.p1.pos.y += delta * (this.centerY - this.p1.pos.y);
  }
  handleBounce() {
    // 1 means the video is playing, 0 means it is not
    this.resizeParticle();
    // ex: if gif is 60fps, then didx = 1, so every frame, we advance 1 gif frame
    // if gif is 20fps, then didx = 20/60=1/3, so every 3 frames, we advance 1 gif frame
    this.didx = this.sequenceFPS / this.fps;
    this.last = this.frame;
    if (typeof window === "object") {
      this.sound.play();
    }
    if (typeof window === "undefined") {
      this.bounceTimes.push(this.frame);
    }
  }

  createAudioTimeline() {
    let start = this.bounceTimes[0];
    for (let i = 1; i < this.bounceTimes.length; i++) {
      if (this.bounceTimes[i] - this.bounceTimes[i - 1] >= this.soundBuffer) {
        let audioDuration = this.bounceTimes[i - 1] + this.soundBuffer - start;
        // converting the duration in frames to milliseconds
        audioDuration = Math.round((audioDuration / 60) * 1000);
        this.audioTimeline.push({ audio: this.songURL, frame: start, audio_duration: audioDuration });
        start = this.bounceTimes[i];
      }
      // handling the last potential bounce
      if (this.duration - this.bounceTimes[i] < this.soundBuffer && i == this.bounceTimes.length - 1) {
        let audioDuration = this.duration - this.bounceTimes[i];
        audioDuration = Math.round((audioDuration / 60) * 1000);
        this.audioTimeline.push({ audio: this.songURL, frame: start, audio_duration: audioDuration });
      }
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
    if (this.sound != null) {
      this.sound.pause();
    }
    if (this.requestID !== null) {
      cancelAnimationFrame(this.requestID); // Cancel the animation frame request
      this.requestID = null;
    }
  }

  // Start playing the animation
  play() {
    if (this.sound.paused && this.frame > 1) {
      this.sound.play();
    }
    if (!this.playing) {
      this.playing = true;
      this.animate(); // Start the animation loop if not already playing
    }
  }
}

export default BounceParticle;
