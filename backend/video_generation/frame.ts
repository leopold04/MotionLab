// importing static modules
import fs from "fs";
import path from "path";
import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import AnimationConfig from "../../frontend/src/graphics/utils/animation-config.js";

let duration: number;
// temp vars. change later
let frameDir = "";
let userID = "";
let sessionID = 0;
let sessionDir = "";
let audioDir = "";
let animationName = "";
let audioTimeline = {};

let config: AnimationConfig;
const fps = 60; // Frames per second for both the generated frames and the final video

async function run(animationName: string) {
  let startTime = Date.now();
  try {
    // Dynamically import the correct animation file
    // import relative to current file
    const module = await import(`../../frontend/src/graphics/animations/${animationName}.js`);
    const Animation = module.default;
    const animation = new Animation(config);
    // waiting for all assets to load in
    await animation.load();
    createDirectories();
    // waiting for all frames to be written
    await writeFrames(animation);
    let timeElapsed = (Date.now() - startTime) / 1000;
    console.log(`Generation completed in ${timeElapsed}s`);
  } catch (error) {
    console.error("Error loading animation:", error);
  }
}

function createDirectories() {
  const videoDir = "../videos";
  // unique directory for each user (relative to backend)
  let userDir = path.join(videoDir, `files_${userID}`);
  // unique directory for each user's session
  sessionDir = path.join(userDir, `session_${sessionID}`);
  // Directory to store the individual animation frames as PNG files
  frameDir = path.join(sessionDir, "frames");
  // Directory to store audio wav files
  audioDir = path.join(sessionDir, "audio");

  // making video directory
  if (!fs.existsSync(videoDir)) {
    // If the directory doesn't exist, create it
    fs.mkdirSync(videoDir);
  }
  // making user directory
  if (!fs.existsSync(userDir)) {
    // If the directory doesn't exist, create it
    fs.mkdirSync(userDir);
  }

  // making session, frame, and audio directories
  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir);
    fs.mkdirSync(frameDir);
    fs.mkdirSync(audioDir);
  }
}

async function writeFrames(animation: any) {
  console.log("Starting frame generation");
  const totalFrames = fps * duration; // Total number of frames, calculated as fps * duration (30 FPS * 10 seconds = 300 frames)
  // Loop through each frame and create it using the `createFrame` method of the Animation class
  for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
    // creating frame
    await animation.update();
    await animation.draw();
    // making frame path for image
    const framePath = path.join(frameDir, `frame${String(frameIndex).padStart(4, "0")}.png`);
    const buffer = animation.canvas.toBuffer("image/png");
    fs.writeFileSync(framePath, buffer);
    if (frameIndex % 100 == 0) {
      console.log(`Rendered ${frameIndex + 1}/${totalFrames} frames`);
    }
  }
  audioTimeline = animation.audioTimeline;
}

const app = express();
app.use(express.json());
app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"], credentials: true }));

app.post("/video/create_frames", async (request, response) => {
  console.log("Request:");
  console.log(request.body);
  console.log("");
  ({ userID, sessionID } = request.body.userInfo);
  ({ duration } = request.body.videoInfo);
  ({ animationName, config } = request.body.animationInfo);
  await run(animationName);
  let info: any = {
    user: userID,
    session: sessionID,
    sessionDir: sessionDir,
    duration: duration,
    audioTimeline: audioTimeline,
  };

  // sending request to flask endpoint to start video generation process
  console.log("Sending video creation request");
  let data;
  try {
    const res = await fetch("http://localhost:8000/video/create_video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(info),
    });
    data = await res.json();
  } catch (error) {
    console.log(error);
  }

  response.json(data);
});

app.listen(3000, () => {
  console.log("Express app running on port 3000");
});
