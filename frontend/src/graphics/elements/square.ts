import Vector from "./vector.js";
import Box from "./box.js";
import { loadImage } from "canvas";
import emitter from "../utils/emitter.js";

class Square {
  // (x,y) is the top left corner of the square
  pos: Vector;
  vel: Vector;
  size: number;
  color: any; // change later
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  box: Box;
  image: HTMLImageElement | any;
  animationHash: string;
  imageSource: any = null;

  // prettier-ignore
  constructor(x: number, y: number, size: number, dx: number, dy: number, appearance: string, box: Box, canvas: any, ctx: any, animationHash: string) {
    this.pos = new Vector(x, y);
    this.size = size;
    this.vel = new Vector(dx, dy);
    this.canvas = canvas;
    this.ctx = ctx;
    this.box = box;
    this.animationHash = animationHash;
    if (appearance.startsWith("#")){
      this.color = appearance;
    } else{
      this.imageSource = appearance;
    }
  }

  move() {
    this.pos.x += this.vel.x;
    this.pos.y += this.vel.y;

    // Bounce off the walls of box
    if (this.pos.x <= this.box.x || this.pos.x + this.size >= this.box.x + this.box.size) {
      emitter.emit("collision", this.animationHash);

      // putting the square back in the box
      this.pos.x = this.pos.x <= this.box.x ? this.box.x + 1 : this.box.x + this.box.size - this.size - 1;
      this.vel.x *= -1;
    }
    if (this.pos.y <= this.box.y || this.pos.y + this.size >= this.box.y + this.box.size) {
      emitter.emit("collision", this.animationHash);

      this.pos.y = this.pos.y <= this.box.y ? this.box.y + 1 : this.box.y + this.box.size - this.size - 1;
      this.vel.y *= -1;
    }
  }

  draw() {
    if (this.image) {
      this.ctx.drawImage(this.image, this.pos.x, this.pos.y, this.size, this.size);
    } else {
      this.ctx.fillStyle = this.color;
      this.ctx.fillRect(this.pos.x, this.pos.y, this.size, this.size);
    }
  }

  async setImage() {
    // if we have an image source passed in, we set that to the particle's image
    if (this.imageSource != null) {
      // getting image from our backend
      let src = "http://localhost:8000/file/get_asset/" + this.imageSource;
      try {
        this.image = await loadImage(src);
      } catch (error) {
        console.log(error);
      }
    }
  }

  static handleSquareCollision(s1: Square, s2: Square): void {
    // Detect collision
    const angle = this.collisionAngle(s1, s2);

    if (angle !== null) {
      emitter.emit("collision", s1.animationHash);
      // Handle collision response if collision occurs
      if ((angle >= 0 && angle < 45) || (angle > 315 && angle < 360)) {
        // Zone 1 - Right
        if (s1.vel.x > 0) s1.vel.x = -s1.vel.x;
        if (s2.vel.x < 0) s2.vel.x = -s2.vel.x;

        // Resolve overlap
        const overlap = s1.pos.x + s1.size - s2.pos.x;
        const moveDist = overlap / 2 + 1;
        if (overlap > 0) {
          s1.pos.x -= moveDist; // Move s1 to the left
          s2.pos.x += moveDist; // Move s2 to the right
        }
      } else if (angle >= 45 && angle < 135) {
        // Zone 2 - Bottom
        if (s1.vel.y > 0) s1.vel.y = -s1.vel.y;
        if (s2.vel.y < 0) s2.vel.y = -s2.vel.y;

        // Resolve overlap
        const overlap = s1.pos.y + s1.size - s2.pos.y;
        const moveDist = overlap / 2 + 1;
        if (overlap > 0) {
          s1.pos.y -= moveDist; // Move s1 up
          s2.pos.y += moveDist; // Move s2 down
        }
      } else if (angle >= 135 && angle < 225) {
        // Zone 3 - Left
        if (s1.vel.x < 0) s1.vel.x = -s1.vel.x;
        if (s2.vel.x > 0) s2.vel.x = -s2.vel.x;

        // Resolve overlap
        const overlap = s2.pos.x + s2.size - s1.pos.x;
        const moveDist = overlap / 2 + 1;
        if (overlap > 0) {
          s1.pos.x += moveDist; // Move s1 to the right
          s2.pos.x -= moveDist; // Move s2 to the left
        }
      } else {
        // Zone 4 - Top
        if (s1.vel.y < 0) s1.vel.y = -s1.vel.y;
        if (s2.vel.y > 0) s2.vel.y = -s2.vel.y;

        // Resolve overlap
        const overlap = s2.pos.y + s2.size - s1.pos.y;
        const moveDist = overlap / 2 + 1;

        if (overlap > 0) {
          s1.pos.y += moveDist; // Move s1 down
          s2.pos.y -= moveDist; // Move s2 up
        }
      }
    }
  }

  // Collision detection between two squares
  static collides(s1: Square, s2: Square) {
    return !(
      s1.pos.x + s1.size < s2.pos.x ||
      s2.pos.x + s2.size < s1.pos.x ||
      s1.pos.y + s1.size < s2.pos.y ||
      s2.pos.y + s2.size < s1.pos.y
    );
  }
  static collisionAngle(r1: Square, r2: Square): number | null {
    // Collision detection logic
    const hit = this.collides(r1, r2);

    if (hit) {
      // Calculate the angle of collision (from r1 to r2)
      const dx = r2.pos.x - r1.pos.x;
      const dy = r2.pos.y - r1.pos.y;
      let angle = (Math.atan2(dy, dx) * 180) / Math.PI;

      if (angle < 0) angle += 360; // Normalize angle to be between 0 and 360 degrees
      return angle;
    }
    return null; // No collision
  }
}

// exporting with es6
export default Square;
