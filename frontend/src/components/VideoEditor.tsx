import "../styles/VideoEditor.css";
import { useState, useEffect } from "react";
import AnimationConfig from "../graphics/utils/animation-config";
function VideoEditor() {
  let animation: any;
  let AnimationClass: any;
  let config: any;

  /*
const videoResolutions = {
  "480p": [480, 854],
  "720p": [720, 1280],
  "1080p": [1080, 1920],
};
const resolution = "480p";
const [width, height] = videoResolutions[resolution];
  */

  // gets default configs for an animation
  async function getDefaultConfigs(animation: string): Promise<AnimationConfig> {
    const response = await fetch("/settings/default-configs.json");
    const data = await response.json();
    let c: AnimationConfig = data[animation];
    // elementList = [["canvas_width", 480, 'number'], ["canvas_height", 720, 'number'], ["background_color", "DarkSeaGreen", 'color']]
    let elementList = await createElementList(c);
    console.log(elementList);
    return c;
  }

  // takes an AnimationConfig ({ "canvas_width": 480, "canvas_height": 720, "background_color": "DarkSeaGreen" })
  // turns it into a list of kv pairs [["canvas_width", 480], ["canvas_height", 720], ["background_color", "DarkSeaGreen"]]
  // iterates through list and appends form input type to each element (["canvas_width", 480, 'number'], ["canvas_height", 720, 'number'], ["background_color", "DarkSeaGreen", 'color'])
  // returns the list
  async function createElementList(configuration: AnimationConfig): Promise<[string, any][]> {
    // loading in element map
    const response = await fetch("/settings/element-map.json");
    const elementMap = await response.json();

    // converting to a js object so we can work with it easier
    let configObject: object = configuration;
    // converting to a list of kv pairs
    let configList = Object.entries(configObject);
    for (let config of configList) {
      // [setting, _] = [key, value]
      let [setting, _] = config;
      // adding the appropriate input element type to the kv pair ["canvas_width", 480, 'number']
      config.push(elementMap[setting]);
    }
    return configList;
  }
  async function switchAnimation(animationName: string) {
    let animationPath = `../graphics/animations/${animationName}`;
    if (animation != null) {
      animation.pause();
    }
    try {
      config = await getDefaultConfigs(animationName);
      // using @vite-ignore so that vite ignores the dynamic import
      const module = await import(/* @vite-ignore */ animationPath); // Await the import
      AnimationClass = module.default; // Get the default export

      animation = new AnimationClass(config);
      animation.draw();
      animation.pause();
    } catch (err) {
      console.error("Failed to load animation module", err);
    }
  }

  // resets the current animation (can be used if config changes)
  // restarts with current config file, not default
  async function resetAnimation() {
    let animationPath = `../graphics/animations/${animationName}`;
    if (animation != null) {
      animation.pause();
    }

    // using @vite-ignore so that vite ignores the dynamic import
    const module = await import(/* @vite-ignore */ animationPath);
    AnimationClass = module.default; // Get the default export

    // resetting current animation with current config
    animation = new AnimationClass(config);
    animation.draw();
    animation.pause();
  }

  const [animationName, setAnimationName] = useState("particle-ring");
  useEffect(() => {
    switchAnimation(animationName);
    console.log(animationName);
  }, [animationName]);

  function handleAnimationChange(event: React.ChangeEvent<HTMLSelectElement>) {
    setAnimationName(event.target.value);
  }

  async function sendGenerationRequest() {
    let videoData = {
      userInfo: { userID: 1234, sessionID: Date.now() % 100 },
      videoInfo: { duration: 5 },
      animationInfo: { animationName: animationName, config: config },
    };
    try {
      const response = await fetch("http://localhost:3000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(videoData),
      });

      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.log(error);
    }
  }

  async function randomizeAnimation() {
    const seed = 1000 * Math.random();
    config["seed"] = seed;
    console.log();
    resetAnimation();
  }
  return (
    <div className="container">
      <h1>Editor</h1>

      <div className="video-editor">
        <div className="animation-column">
          <canvas id="canvas"></canvas>
          <button onClick={() => animation.play()}>Play</button>
          <button onClick={() => animation.pause()}>Pause</button>
          <button onClick={resetAnimation}>Reset</button>
          <button onClick={randomizeAnimation}>Randomize</button>
          <button onClick={sendGenerationRequest}>Generate</button>
        </div>
        <div className="config-column">
          <form id="animation-form">
            <label>Choose an animation template</label>
            <select name="animations" id="animation-selection" value={animationName} onChange={handleAnimationChange}>
              <option value="particle-ring">Particle Ring</option>
              <option value="particle-arc">Particle Arc</option>
              <option value="square-box">Square Box</option>
            </select>
          </form>
          <form id="config-form"></form>
        </div>
      </div>
    </div>
  );
}

export default VideoEditor;
