class Vector {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  // Dot product of two vectors
  static dot(v1: Vector, v2: Vector): number {
    return v1.x * v2.x + v1.y * v2.y;
  }

  // Vector addition
  static add(v1: Vector, v2: Vector): Vector {
    return new Vector(v1.x + v2.x, v1.y + v2.y);
  }

  // Vector subtraction
  static sub(v1: Vector, v2: Vector): Vector {
    return new Vector(v1.x - v2.x, v1.y - v2.y);
  }

  // Scalar multiplication
  static mul(v: Vector, scalar: number): Vector {
    return new Vector(v.x * scalar, v.y * scalar);
  }

  // Magnitude of the vector
  static magnitude(v: Vector): number {
    return Math.sqrt(v.x * v.x + v.y * v.y);
  }

  // Normalize the vector (make it unit length)
  static normalize(v: Vector): Vector {
    const mag = Vector.magnitude(v);
    return new Vector(v.x / mag, v.y / mag);
  }

  // Negate the vector
  static negate(v: Vector): Vector {
    return new Vector(-v.x, -v.y);
  }

  // Perpendicular vector (90 degrees rotation)
  static perpendicular(v: Vector): Vector {
    return new Vector(-v.y, v.x);
  }
  static clone(v: Vector) {
    return new Vector(v.x, v.y);
  }
}

export default Vector;
