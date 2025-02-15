// including all the customizable settings. some are required and the other are optional (such as colors)

type AnimationConfig = {
  canvas_width: number;
  canvas_height: number;
  background_color?: string;
  particle_1_image?: string;
  particle_2_image?: string;
  particle_1_color?: string;
  particle_2_color?: string;
  particle_size?: number;
  collision_sound?: string;
  seed?: number;
  name?: string;
  duration: number;
  sound: string;
  sequence: string;
  sequence_fps: number;
  sequence_frame_count: number;
};

export default AnimationConfig;
