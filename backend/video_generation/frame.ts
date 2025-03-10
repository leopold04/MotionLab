// importing static modules
import fs from "fs";
import path from "path";
import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import AnimationConfig from "../../frontend/src/graphics/utils/animation-config.js";

let config: AnimationConfig;
const fps = 60; // Frames per second for both the generated frames and the final video
/*
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

*/
let map: any = {};

async function run(animationPath: string, user: string, session: number) {
  try {
    // Dynamically import the correct animation file
    // import relative to current file
    const module = await import(`../../frontend/src/graphics/animations/${animationPath}.js`);
    const Animation = module.default;
    const config = map[user][session]["config"];
    const animation = new Animation(config);
    // waiting for all assets to load in
    console.log("Loading assets...");
    let assetLoadTime = await animation.load();
    // waiting for all frames to be written
    console.log("Creating and writing frames...");
    let frameWriteTime = await writeFrames(animation, user, session);

    map[user][session]["info"] = {
      userID: user,
      path: animationPath,
      categoryName: map[user][session]["categoryName"],
      templateName: map[user][session]["templateName"],
      resolution: `${config["canvas_width"]}p`,
      sessionID: session,
      sessionDir: `../videos/${user}/${session.toString()}`,
      duration: map[user][session]["duration"],
      audioTimeline: animation.audioTimeline,
      assetLoadTime: assetLoadTime,
      frameWriteTime: frameWriteTime,
    };
    console.log(animation.audioTimeline);
  } catch (error) {
    console.error("Error loading animation:", error);
  }
}

// create the individual frame PNGs and write them to disk storage
async function writeFrames(animation: any, user: string, session: number) {
  let startTime = Date.now();
  console.log("Starting frame generation");
  const sessionDir = `../videos/${user}/${session.toString()}`;
  const frameDir = path.join(sessionDir, "frames");
  const totalFrames = fps * map[user][session]["duration"]; // Total number of frames, calculated as fps * duration (60 FPS * 10 seconds = 600 frames)
  for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
    // creating frame
    await animation.update();
    await animation.draw();
    // making frame path for image
    const framePath = path.join(frameDir, `frame${String(frameIndex).padStart(4, "0")}.png`);
    const buffer = animation.canvas.toBuffer("image/png");
    let progress = (frameIndex / totalFrames) * 74; // setting to max of 74 instead of 75 helps reduce rounding errors
    map[user][session]["progress"] = progress;

    // writing the file asynchronously so our event loop does not get blocked
    await fs.promises.writeFile(framePath, buffer);
    if ((frameIndex + 1) % 10 == 0) {
      console.log(`Rendered ${frameIndex + 1}/${totalFrames} frames`);
    }
    await new Promise((resolve) => setImmediate(resolve));
  }
  map[user][session]["progress"] = 75; // setting progress to 75 once we finish
  let timeElapsed = (Date.now() - startTime) / 1000;
  return timeElapsed;
}

const app = express();
app.use(express.json());
app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"], credentials: true }));

app.post("/video/frame_progress", (req, res) => {
  // returns progress of a specific user and session's video
  const { userID: user, sessionID: session } = req.body;
  res.json({ progress: map[user][session]["progress"] });
});

app.post("/video/get_info", (req, res) => {
  // returning the information of the video made
  const { userID: user, sessionID: session } = req.body;
  res.json(map[user][session]["info"]);
  // remove the appropriate maps from memory after we're done making frames
  delete map[user][session];
});

app.post("/video/create_frames", async (request, response) => {
  console.log(request.body);
  let { userID: userID, sessionID: sessionID } = request.body.userInfo;
  let { duration: duration } = request.body.videoInfo;
  let {
    animationPath: animationPath,
    config: config,
    categoryName: categoryName,
    templateName: templateName,
  } = request.body.animationInfo;

  if (!(userID in map)) {
    map[userID] = {};
  }
  map[userID][sessionID] = {};
  map[userID][sessionID]["progress"] = 0;
  map[userID][sessionID]["duration"] = duration;
  map[userID][sessionID]["animationPath"] = animationPath;
  map[userID][sessionID]["config"] = config;
  map[userID][sessionID]["categoryName"] = categoryName;
  map[userID][sessionID]["templateName"] = templateName;

  console.log(map);
  response.json({ message: "Starting frame creation" });
  run(animationPath, userID, sessionID); // allow the run function to run asynchronously
});

app.listen(3000, () => {
  console.log("Express app running on port 3000");
});
