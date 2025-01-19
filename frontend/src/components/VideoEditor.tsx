import "../styles/VideoEditor.css";
import { useState, useEffect, useRef } from "react";
import AnimationConfig from "../graphics/utils/animation-config";

function VideoEditor() {
  // this lets us only include certain default configs to render (not seed)
  type InputType = "file" | "color";
  let InputTypes: InputType[] = ["file", "color"];

  const animationRef = useRef<any>(null);
  const AnimationClassRef = useRef<any>(null);
  const [formElements, setFormElements] = useState<[string, any, InputType][]>([]);
  const [animationName, setAnimationName] = useState("particle-ring");
  const configRef = useRef<any>(null);

  const [isRunning, setIsRunning] = useState(false);
  const intervalID = useRef<any>(null);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(5);

  /**
   * Effect hook that runs when the animation name changes.
   * It calls the switchAnimation function to update the animation
   * displayed in the editor.
   */
  useEffect(() => {
    switchAnimation(animationName);
    console.log(animationName);
  }, [animationName]);

  // we can use a state for the time here because even if the page re renders (since the state of is running changes)
  // the animation will not be re rendered, since it is a reference.
  useEffect(() => {
    if (isRunning) {
      // 10 ms = 0.01 s
      let delay = 10;
      intervalID.current = setInterval(() => {
        let frame = animationRef.current.frame;
        // converting frames to seconds then rounding to 2 decimal places
        let elapsedTime = Math.round((100 * frame) / 60) / 100;
        setTime(elapsedTime);

        // pausing once we reach the video duration
        if (elapsedTime >= duration) {
          pause();
        }
      }, delay);
    }

    return () => {
      clearInterval(intervalID.current);
    };
  }, [isRunning]);

  /**
   * Fetches the default configuration for a specified animation.
   * This function retrieves the default settings from a JSON file,
   * creates a list of form elements based on the configuration,
   * and updates the state with the new form elements.
   * elementList = [["canvas_width", 480, 'number'], ["canvas_height", 720, 'number'], ["background_color", "DarkSeaGreen", 'color']]

   *
   * @param {string} animation - The name of the animation to get configs for.
   */
  async function getDefaultConfigs(animation: string) {
    const response = await fetch("/settings/default-configs.json");
    const data = await response.json();
    configRef.current = data[animation];
    let elementList = await createElementList(configRef.current);
    console.log(elementList);
    setFormElements(elementList);
  }

  /**
   * Converts an AnimationConfig object into a list of key-value pairs
   * along with their corresponding input types for form elements.
   * This function fetches an element map to determine the input type
   * for each configuration setting.
   * 
   *  takes an AnimationConfig ({ "canvas_width": 480, "canvas_height": 720, "background_color": "DarkSeaGreen" })
   *   turns it into a list of kv pairs [["canvas_width", 480], ["canvas_height", 720], ["background_color", "DarkSeaGreen"]]
   *  iterates through list and appends form input type to each element (["canvas_width", 480, 'number'], ["canvas_height", 720, 'number'], ["background_color", "DarkSeaGreen", 'color'])
  
   *
   * @param {AnimationConfig} configuration - The configuration object to convert.
   * @returns {Promise<[string, any, string][]>} - A list of configuration settings
   *          with their values and input types.
   */
  async function createElementList(configuration: AnimationConfig): Promise<[string, any, InputType][]> {
    const response = await fetch("/settings/element-map.json");
    const elementMap = await response.json();
    let configObject: object = configuration;
    let configList = Object.entries(configObject);
    let c: [string, any, InputType][] = [];
    for (let [setting, value] of configList) {
      c.push([setting, value, elementMap[setting]]);
    }
    return c;
  }

  /**
   * Switches the current animation to a new one specified by the animation name.
   * This function pauses the current animation (if any), fetches the default
   * configuration for the new animation, and dynamically imports the animation module.
   * It then creates a new animation instance and draws it on the canvas.
   *
   * @param {string} animationName - The name of the animation to switch to.
   */
  async function switchAnimation(animationName: string) {
    let animationPath = `../graphics/animations/${animationName}`;
    if (animationRef.current != null) {
      animationRef.current.pause();
    }
    try {
      await getDefaultConfigs(animationName);
      console.log(configRef.current);
      const module = await import(/* @vite-ignore */ animationPath);
      AnimationClassRef.current = module.default;
      animationRef.current = new AnimationClassRef.current(configRef.current);
      animationRef.current.draw();
      animationRef.current.pause();
    } catch (err) {
      console.error("Failed to load animation module", err);
    }
  }

  /**
   * Resets the current animation using the existing configuration.
   * This function pauses the current animation (if any) and
   * reinitializes it with the current configuration settings.
   */
  async function resetAnimation() {
    let animationPath = `../graphics/animations/${animationName}`;
    if (animationRef.current != null) {
      animationRef.current.pause();
    }
    const module = await import(/* @vite-ignore */ animationPath);
    AnimationClassRef.current = module.default;
    animationRef.current = new AnimationClassRef.current(configRef.current);
    animationRef.current.draw();
    pause();
    setTime(0);
  }

  /**
   * Randomizes the animation by generating a new seed value
   * and resetting the animation with the updated configuration.
   */
  async function randomizeAnimation() {
    const seed = 1000 * Math.random();
    configRef.current["seed"] = seed;
    console.log();
    resetAnimation();
  }
  function play() {
    animationRef.current.play();
    setIsRunning(true);
  }
  function pause() {
    animationRef.current.pause();
    setIsRunning(false);
  }

  /**
   * Handles changes to the animation selection dropdown.
   * This function updates the state with the selected animation name.
   *
   * @param {React.ChangeEvent<HTMLSelectElement>} event - The change event
   *          from the select element.
   */
  function handleAnimationChange(event: React.ChangeEvent<HTMLSelectElement>) {
    setAnimationName(event.target.value);
  }

  /**
   * Sends a request to generate a video with the current animation settings.
   * This function constructs a video data object containing user info,
   * video info, and animation info, and sends it to the server via a POST request.
   */
  async function sendGenerationRequest() {
    let videoData = {
      userInfo: { userID: 1234, sessionID: Date.now() % 100 },
      videoInfo: { duration: duration },
      animationInfo: { animationName: animationName, config: configRef.current },
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

  function handleColorChange(event: React.ChangeEvent<HTMLInputElement>, setting: string) {
    // setting = "bg_color" | "particle_color" ...
    // event.target.value = a css color
    updateConfig(setting, event.target.value);
    console.log(configRef.current);
    resetAnimation();
  }

  function updateConfig(setting: string, value: any) {
    // updating the config
    configRef.current[setting] = value;

    // updating the formElements state to trigger re-render of component
    setFormElements((prevFormElements) =>
      prevFormElements.map(([prevSetting, prevValue, inputType]) => {
        if (setting === prevSetting) {
          // look for the element in formElements that has the same setting as what we are trying to change
          return [prevSetting, value, inputType];
        } else {
          // if we are not changing the target setting, leave the element unchanged
          return [prevSetting, prevValue, inputType];
        }
      })
    );
    // reset the animation
    resetAnimation();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>, setting: string) {
    // checking if files array is not null
    if (event.target.files) {
      // send form data to the backend so it can eventually get uploaded to supabase
      // send back supabase url

      const file = event.target.files[0];
      // turning it into a URL (active as long as the app is open in browser)
      const fileURL = URL.createObjectURL(file);
      console.log(fileURL, file.name, file.size);
      // updating config
      updateConfig(setting, fileURL);
    }
  }
  function setResolution(resolution: string) {
    const videoResolutions: { [key: string]: number[] } = {
      "480p": [480, 854],
      "720p": [720, 1280],
      "1080p": [1080, 1920],
    };
    let [width, height] = videoResolutions[resolution];
    updateConfig("canvas_width", width);
    updateConfig("canvas_height", height);
  }
  function handleDurationChange(event: React.ChangeEvent<HTMLInputElement>) {
    setDuration(parseInt(event.target.value));
  }
  function formatTime(time: number, duration: number) {
    // time is in format s.00
    return time.toFixed(2) + " / " + duration.toFixed(2);
  }

  let inputMap: { [key in InputType]: (setting: string, value: any) => JSX.Element } = {
    file: (setting: string, _: any) => {
      return (
        <div key={setting}>
          <label htmlFor={setting}>{setting}</label>
          <input type="file" id={setting} onChange={(e) => handleFileChange(e, setting)} />
        </div>
      );
    },
    color: (setting: string, value: any) => {
      return (
        <div key={setting}>
          <label htmlFor={setting}>{setting}</label>
          <input type="color" id={setting} value={value} onChange={(e) => handleColorChange(e, setting)} />
        </div>
      );
    },
  };
  return (
    <div className="container">
      <h1>Editor</h1>
      <div className="video-editor">
        <div className="animation-column">
          <canvas id="canvas"></canvas>
          <h3 className="time">{formatTime(time, duration)}</h3>
          <button onClick={play}>Play</button>
          <button onClick={pause}>Pause</button>
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
            <div className="resolution-group">
              <button className="button" type="button" onClick={() => setResolution("480p")}>
                480p
              </button>
              <button className="button" type="button" onClick={() => setResolution("720p")}>
                720p
              </button>
              <button className="button" type="button" onClick={() => setResolution("1080p")}>
                1080p
              </button>
            </div>
            <label htmlFor="duration">Video Duration:</label>
            <input
              type="number"
              id="duration"
              name="duration"
              min="0"
              max="65"
              onChange={handleDurationChange}
              placeholder={duration.toString()}
            />
          </form>
          <form id="config-form">
            {formElements
              // only choosing settings with the correct input type
              .filter(([, , inputType]) => InputTypes.includes(inputType))
              // creating elements based on our map (ex: map[color]("bg_color", "green") => ...)
              .map(([setting, value, inputType]) => inputMap[inputType](setting, value))}
          </form>
        </div>
      </div>
    </div>
  );
}

export default VideoEditor;
