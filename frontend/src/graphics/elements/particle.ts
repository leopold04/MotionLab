import emitter from "../utils/emitter.js";
import Vector from "./vector.js";
import Box from "./box.js";
import Ring from "./ring.js";
import Arc from "./arc.js";
import { loadImage } from "canvas";
class Particle {
  // (x,y) is the CENTER of the particle (this is different for square class)
  pos: Vector;
  vel: Vector;
  gravity: number;
  radius: number;
  color: any;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  container: Ring | Box | Arc;
  image: HTMLImageElement | any;
  imageSource: any = null;
  inArc: boolean = true;
  animationHash: string;
  // prettier-ignore
  constructor(x: number, y: number, radius: number, dx: number, dy: number, gravity: number,
             container: Ring | Box | Arc, appearance: string, canvas: any, ctx: any, animationHash: string) {
    this.pos = new Vector(x, y);
    this.radius = radius;
    this.vel = new Vector(dx, dy);
    this.gravity = gravity;
    this.canvas = canvas;
    this.ctx = ctx;
    this.container = container;
    this.animationHash = animationHash
    if (appearance.startsWith("#")){
      this.color = appearance;
    } else{
      this.imageSource = appearance;
    }

  }

  move() {
    this.vel.y += this.gravity;
    this.pos.x += this.vel.x;
    this.pos.y += this.vel.y;

    // handling colliding with container
    if (this.container instanceof Box) {
      // move particle back into box and reverse velocity along collision axis
      if (this.pos.x > this.container.x + this.container.size - this.radius) {
        this.pos.x = this.container.x + this.container.size - this.radius;
        this.vel.x *= -1;
      } else if (this.pos.x - this.radius < this.container.x) {
        this.pos.x = this.container.x + this.radius;
        this.vel.x *= -1;
      } else if (this.pos.y - this.radius < this.container.y) {
        this.pos.y = this.container.y + this.radius;
        this.vel.y *= -1;
      } else if (this.pos.y + this.radius > this.container.y + this.container.size) {
        this.pos.y = this.container.y + this.container.size - this.radius;
        this.vel.y *= -1;
      }
    }
    if (this.container instanceof Ring) {
      let dist = Vector.sub(this.pos, this.container.pos);
      let norm = Vector.magnitude(dist);
      if (norm + this.radius > this.container.radius) {
        let dist_unit = Vector.normalize(dist);
        let tangent = Vector.perpendicular(dist);
        let scale = Vector.dot(this.vel, tangent) / Vector.dot(tangent, tangent);
        let proj_v_t = Vector.mul(tangent, scale);
        let new_vel = Vector.sub(Vector.mul(proj_v_t, 2), this.vel);
        this.vel = Vector.clone(new_vel);

        this.vel.y -= this.gravity / 2;
        let new_pos = Vector.mul(dist_unit, this.container.radius - this.radius);
        this.pos = Vector.add(this.container.pos, new_pos);
        // setting a specific hash to the message prevents conflicts between animation events
        emitter.emit("collision", this.animationHash);
      }
    }
    if (this.container instanceof Arc) {
      let dist = Vector.sub(this.pos, this.container.pos);
      let norm = Vector.magnitude(dist);
      if (norm + this.radius > this.container.radius) {
        if (this.hasEscaped()) {
          this.inArc = false;
        }
        if (this.inArc) {
          let dist_unit = Vector.normalize(dist);
          let tangent = Vector.perpendicular(dist);
          let scale = Vector.dot(this.vel, tangent) / Vector.dot(tangent, tangent);
          let proj_v_t = Vector.mul(tangent, scale);
          let new_vel = Vector.sub(Vector.mul(proj_v_t, 2), this.vel);
          this.vel = Vector.clone(new_vel);
          this.vel.y -= this.gravity / 2;
          let new_pos = Vector.mul(dist_unit, this.container.radius - this.radius);
          this.pos = Vector.add(this.container.pos, new_pos);
          emitter.emit("collision", this.animationHash);
        }
      }
    }
  }

  hasEscaped() {
    const arc = this.container as Arc;
    let dist = Vector.sub(this.pos, arc.pos);
    let angle = -Math.atan2(dist.y, dist.x);
    let start = arc.startAngle;
    let end = arc.endAngle;

    if (angle < 0) {
      angle += 2 * Math.PI;
    }
    if (start < 0) {
      start += 2 * Math.PI;
    }
    if (end < 0) {
      end += 2 * Math.PI;
    }
    let escape = false;
    if (start > end) {
      // ex: start = 357 in degrees, end = 42 in degrees
      // 2 different ranges to check
      if ((angle >= start && angle < 360) || (angle >= 0 && angle <= end)) {
        escape = true;
      }
    } else {
      // if both angles are positive, do normal range check
      if (angle >= start && angle <= end) {
        escape = true;
      }
    }
    if (escape) {
      if (this.inArc) {
        // we only run this check once, since we are marking the TRANSITION between being in and out once
        emitter.emit("escape", this.animationHash);
      }
      return true;
    }
  }

  draw() {
    // draw an image for our particle if it has already been set
    if (this.image) {
      this.ctx.drawImage(
        this.image,
        this.pos.x - this.radius,
        this.pos.y - this.radius,
        this.radius * 2,
        this.radius * 2
      );
    } else {
      // draw a circle with a color if we don't have an image or if it has not been set
      this.ctx.fillStyle = this.color;
      this.ctx.beginPath();
      this.ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI);
      this.ctx.fill();
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

  /*
   collision resolution for particles
   https://dipamsen.github.io/notebook/collisions.pdf
  */
  static handleCollision(p1: Particle, p2: Particle) {
    if (Particle.collides(p1, p2)) {
      emitter.emit("collision", p1.animationHash);
      // updating particle positions
      let overlap = Particle.distance(p1, p2) - (p1.radius + p2.radius);
      let direction = Vector.sub(p1.pos, p2.pos);
      let mag = Vector.magnitude(direction);
      direction = Vector.mul(direction, (0.5 * overlap) / mag);
      p1.pos = Vector.sub(p1.pos, direction);
      p2.pos = Vector.add(p2.pos, direction);

      // updating particle velocities
      // we don't edit the actual velocity vector of p1 until the end, because p2's new velocity depends on the original value
      let dv1 = Vector.sub(p2.vel, p1.vel);
      let dp1 = Vector.sub(p2.pos, p1.pos);
      let dot1 = Vector.dot(dv1, dp1);
      let denom1 = Vector.magnitude(Vector.sub(p2.pos, p1.pos)) ** 2;
      let v1 = Vector.mul(dp1, dot1 / denom1);
      // resultant velocity vector for p1
      let pv1 = Vector.add(p1.vel, v1);

      let dv2 = Vector.sub(p1.vel, p2.vel);
      let dp2 = Vector.sub(p1.pos, p2.pos);
      let dot2 = Vector.dot(dv2, dp2);
      let denom2 = Vector.magnitude(Vector.sub(p1.pos, p2.pos)) ** 2;
      let v2 = Vector.mul(dp2, dot2 / denom2);
      // resulant velocity vector for p2
      let pv2 = Vector.add(p2.vel, v2);

      // cloning because simply setting p1.vel = pv1 is making it a reference
      p1.vel = Vector.clone(pv1);
      p2.vel = Vector.clone(pv2);
      p1.vel.y -= p1.gravity / 2;
      p2.vel.y -= p2.gravity / 2;
    }
  }

  // returns true if the two particles are colliding
  static collides(p1: Particle, p2: Particle) {
    return Particle.distance(p1, p2) < p2.radius + p1.radius;
  }

  static distance(p1: Particle, p2: Particle) {
    let deltaX = p1.pos.x - p2.pos.x;
    let deltaY = p1.pos.y - p2.pos.y;
    return Math.sqrt(deltaX ** 2 + deltaY ** 2);
  }
}

export default Particle;
