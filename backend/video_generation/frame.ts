// importing static modules
import fs from "fs";
import path from "path";
import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import AnimationConfig from "../../frontend/src/graphics/utils/animation-config.js";

let duration: number;
let frameDir = "";
let userID = "";
let sessionID = 0;
let sessionDir = "";
let animationName = "";
let audioTimeline = {};
let frameWriteTime = 0;
let assetLoadTime = 0;
let config: AnimationConfig;
const fps = 60; // Frames per second for both the generated frames and the final video

async function run(animationName: string) {
  try {
    // Dynamically import the correct animation file
    // import relative to current file
    const module = await import(`../../frontend/src/graphics/animations/${animationName}.js`);
    const Animation = module.default;
    const animation = new Animation(config);
    // waiting for all assets to load in
    console.log("Loading assets...");
    assetLoadTime = await animation.load();
    // waiting for all frames to be written
    console.log("Creating and writing frames...");
    frameWriteTime = await writeFrames(animation);
  } catch (error) {
    console.error("Error loading animation:", error);
  }
}

// create the individual frame PNGs and write them to disk storage
async function writeFrames(animation: any) {
  let startTime = Date.now();
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
  let timeElapsed = (Date.now() - startTime) / 1000;
  return timeElapsed;
}

const app = express();
app.use(express.json());
app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"], credentials: true }));

app.post("/video/create_frames", async (request, response) => {
  console.log("Request:");
  console.log(request.body);
  console.log("");
  ({ userID, sessionID } = request.body.userInfo);
  sessionDir = `../videos/${userID}/${sessionID.toString()}`;
  frameDir = path.join(sessionDir, "frames");
  ({ duration } = request.body.videoInfo);
  ({ animationName, config } = request.body.animationInfo);
  await run(animationName);
  let info: any = {
    user: userID,
    template: animationName,
    resolution: `${config["canvas_width"]}p`,
    session: sessionID,
    sessionDir: sessionDir,
    duration: duration,
    audioTimeline: audioTimeline,
    assetLoadTime: assetLoadTime,
    frameWriteTime: frameWriteTime,
  };
  console.log(info);

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
