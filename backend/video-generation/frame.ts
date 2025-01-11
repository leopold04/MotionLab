// importing static modules
import fs from "fs";
import path from "path";
import express from "express";
import cors from "cors";
import AnimationConfig from "../../frontend/src/graphics/utils/animation-config.js";

let duration: number;
// temp vars. change later
let frameDir = "";
let userID = "";
let sessionID = 0;
let sessionDir = "";
let animationName = "";
// The output directory will store all the frames as image files. Later, we can include a user-specific identifier to avoid naming conflicts in production environments.
// Later, we can include a user-specific identifier to avoid naming conflicts in production environments.
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

    createDirectories();
    writeFrames(animation);
    writeInfo(animation);
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
  let sessionDir = path.join(userDir, `session_${sessionID}`);
  // Directory to store the individual animation frames as PNG files
  frameDir = path.join(sessionDir, "frames");

  // making user directory
  if (!fs.existsSync(videoDir)) {
    // If the directory doesn't exist, create it
    fs.mkdirSync(videoDir);
  }
  if (!fs.existsSync(userDir)) {
    // If the directory doesn't exist, create it
    fs.mkdirSync(userDir);
  }

  // making session and frame directories
  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir);
    fs.mkdirSync(frameDir);
  }
}

function writeFrames(animation: any) {
  console.log("Generating frames");
  const totalFrames = fps * duration; // Total number of frames, calculated as fps * duration (30 FPS * 10 seconds = 300 frames)
  // Loop through each frame and create it using the `createFrame` method of the Animation class
  for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
    // creating frame
    animation.update();
    animation.draw();
    // making frame path for image
    const framePath = path.join(frameDir, `frame${String(frameIndex).padStart(4, "0")}.png`);
    const buffer = animation.canvas.toBuffer("image/png");
    fs.writeFileSync(framePath, buffer);
    if (frameIndex % 100 == 0) {
      console.log(`Rendered frame ${frameIndex + 1}/${totalFrames}`);
    }
  }
  console.log("Frames generated."); // Log that frame generation is complete
}
function writeInfo(animation: any) {
  let info: any = { user: userID, session: sessionID, duration: duration, audioTimeline: animation.audioTimeline };
  info = JSON.stringify(info);
  const infoPath = path.join(sessionDir, "timeline.json");
  fs.writeFileSync(infoPath, info);

  console.log(animation.audioTimeline);
}

const app = express();
app.use(express.json());
app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"], credentials: true }));

app.post("/generate", async (request, response) => {
  console.log(request.body);
  ({ userID, sessionID } = request.body.userInfo);
  ({ duration } = request.body.videoInfo);
  ({ animationName, config } = request.body.animationInfo);
  await run(animationName);
  response.json({ message: "success" });
});

app.listen(3000, () => {
  console.log("app running on port 3000");
});

/*
- make frames in ts
- send request (timeline body) to python to add audio & make final video
- send final product to public folder to serve 
- give frontend path to final video to serve
- upload video to supabase and then delete



*/
