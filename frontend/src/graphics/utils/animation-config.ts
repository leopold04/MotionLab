// including all the customizable settings. some are required and the other are optional (such as colors)

type AnimationConfig = {
  name?: string;
  canvas_width: number;
  canvas_height: number;
  seed?: number;
  background_color?: string;
  duration: number;

  particle_1_image?: string;
  particle_1_appearance?: string;
  particle_1_color?: string;

  particle_2_appearance?: string;
  particle_2_image?: string;
  particle_2_color?: string;

  square_1_color?: string;
  square_1_appearance?: string;
  square_1_image?: string;

  square_2_color?: string;
  square_2_appearance?: string;
  square_2_image?: string;

  sequence?: string;
  sequence_fps?: number;
  sequence_frame_count?: number;

  collision_sound?: string;
  sound?: string;
  midi_song?: string;
};

export default AnimationConfig;
