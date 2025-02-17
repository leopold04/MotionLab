import React, { createContext } from "react";
type InputType = "color" | "audio" | "image" | "gif";

interface ContextType {
  handleColorChange: (color: any, setting: string) => void;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>, setting: string) => void;
  resolution: string;
  updateResolution: (newResolution: string) => void;
  duration: number;
  handleDurationChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  formElements: [string, any, InputType][];
  InputTypes: InputType[];
  play: () => void;
  pause: () => void;
  resetAnimation: () => void;
  randomizeAnimation: () => void;
  exportVideo: () => void;
  formatTime: () => string;
  isRunning: boolean;
  videoURL: string | null;
}

const VideoEditorContext = createContext<ContextType | undefined>(undefined);

export default VideoEditorContext;
