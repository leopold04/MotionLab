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
let animationPath = "";
let audioTimeline = {};
let frameWriteTime = 0;
let assetLoadTime = 0;
let templateName = "";
let categoryName = "";
let config: AnimationConfig;
const fps = 60; // Frames per second for both the generated frames and the final video
let progress = 0;

async function run(animationPath: string) {
  try {
    // Dynamically import the correct animation file
    // import relative to current file
    const module = await import(`../../frontend/src/graphics/animations/${animationPath}.js`);
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
  const totalFrames = fps * duration; // Total number of frames, calculated as fps * duration (60 FPS * 10 seconds = 600 frames)
  for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
    // creating frame
    await animation.update();
    await animation.draw();
    // making frame path for image
    const framePath = path.join(frameDir, `frame${String(frameIndex).padStart(4, "0")}.png`);
    const buffer = animation.canvas.toBuffer("image/png");
    progress = (frameIndex / totalFrames) * 74; // setting to max of 74 instead of 75 helps reduce rounding errors
    // writing the file asynchronously so our event loop does not get blocked
    await fs.promises.writeFile(framePath, buffer);
    if ((frameIndex + 1) % 10 == 0) {
      console.log(`Rendered ${frameIndex + 1}/${totalFrames} frames`);
    }
    await new Promise((resolve) => setImmediate(resolve));
  }
  audioTimeline = animation.audioTimeline;
  progress = 75; // setting progress to 75 once we finish
  let timeElapsed = (Date.now() - startTime) / 1000;
  return timeElapsed;
}

const app = express();
app.use(express.json());
app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"], credentials: true }));

app.get("/video/frame_progress", (req, res) => {
  // returns progress of video
  res.json({ progress: progress });
});

app.get("/video/get_info", (req, res) => {
  let info: any = {
    user: userID,
    path: animationPath,
    categoryName: categoryName,
    templateName: templateName,
    resolution: `${config["canvas_width"]}p`,
    session: sessionID,
    sessionDir: sessionDir,
    duration: duration,
    audioTimeline: audioTimeline,
    assetLoadTime: assetLoadTime,
    frameWriteTime: frameWriteTime,
  };
  res.json(info);
});

app.post("/video/create_frames", async (request, response) => {
  console.log(request.body);
  ({ userID, sessionID } = request.body.userInfo);
  sessionDir = `../videos/${userID}/${sessionID.toString()}`;
  frameDir = path.join(sessionDir, "frames");
  ({ duration } = request.body.videoInfo);
  ({ animationPath, config, categoryName, templateName } = request.body.animationInfo);
  response.json({ message: "Starting frame creation" });
  // allow the run function to run asynchronously
  run(animationPath);
});

app.listen(3000, () => {
  console.log("Express app running on port 3000");
});
