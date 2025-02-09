import "../styles/VideoEditor.css";
import { useState, useEffect, useRef } from "react";
import AnimationConfig from "../graphics/utils/animation-config";
import VideoEditorContext from "./VideoEditorContext";
import ControlPanel from "./ControlPanel";
interface Props {
  userID: string;
  sessionID: string;
}

function VideoEditor({ userID, sessionID }: Props) {
  // this lets us only include certain default configs to render (not seed)
  type InputType = "color" | "audio" | "image" | "gif";
  let InputTypes: InputType[] = ["color", "audio", "image", "gif"];

  const animationRef = useRef<any>(null);
  const AnimationClassRef = useRef<any>(null);
  const [formElements, setFormElements] = useState<[string, any, InputType][]>([]);
  const [animationName, setAnimationName] = useState<string>("particle-ring");
  const [animationNameMap, setAnimationNameMap] = useState<{ [key: string]: string }>({});
  const configRef = useRef<any>(null);
  const [resolution, setResolution] = useState("720p");
  const [isRunning, setIsRunning] = useState(false);
  const intervalID = useRef<any>(null);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState<number>(0);

  const videoResolutions: { [key: string]: number[] } = {
    "480p": [480, 854],
    "720p": [720, 1280],
    "1080p": [1080, 1920],
  };

  // setting up directories for adding assets and video creation
  async function setupDirectories(userID: string, sessionID: string) {
    let userInfo = { userID: userID, sessionID: sessionID };
    try {
      // sends request to backend to make directories for the user's video
      await fetch("http://localhost:8000/user/setup_directories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userInfo),
      });
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    console.log("Current session: " + sessionID);
    if (sessionID) {
      setupDirectories(userID, sessionID);
    }
  }, [sessionID]);

  /**
   * Effect hook that runs when the animation name changes.
   * It calls the switchAnimation function to update the animation
   * displayed in the editor.
   */
  useEffect(() => {
    switchAnimation(animationName);
    console.log("Animation: " + animationName);
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
    const response = await fetch("http://localhost:8000/user/default_configs");
    const data = await response.json();
    configRef.current = data[animation];
    let elementList = await createElementList(configRef.current);
    setFormElements(elementList);
    let nameMap: { [key: string]: string } = {};
    for (let file_name of Object.keys(data)) {
      nameMap[file_name] = data[file_name]["name"];
    }
    setAnimationNameMap(nameMap);
    setDuration(data[animation]["duration"]);
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
    const response = await fetch("http://localhost:8000/user/element_map");
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
      const module = await import(/* @vite-ignore */ animationPath);
      AnimationClassRef.current = module.default;
      animationRef.current = new AnimationClassRef.current(configRef.current);
      // waiting for assets to load
      await animationRef.current.load();
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
    // waiting for assets to load
    await animationRef.current.load();
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
    await resetAnimation();
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
   *
   * The request returns the URL of the video we generated, then uploaded to supabase
   */
  async function sendGenerationRequest() {
    let videoData = {
      userInfo: { userID: userID, sessionID: Date.now() % 100 },
      videoInfo: { duration: duration },
      animationInfo: { animationName: animationName, config: configRef.current },
    };
    try {
      const response = await fetch("http://localhost:3000/video/create_frames", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(videoData),
      });
      const data = await response.json();
      // url of video we generated, then uploaded to supabase bucket
      console.log(data);
      const videoURL = data["url"];
      console.log("Video URL:", videoURL);
    } catch (error) {
      console.log(error);
    }
  }

  async function updateConfig(setting: string, value: any) {
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
    await resetAnimation();
  }

  function handleColorChange(color: string | React.ChangeEvent<HTMLInputElement>, setting: string) {
    // setting = "bg_color" | "particle_color" ...
    // event.target.value = a css color
    if (typeof color === "string") {
      // coming from a button click
      updateConfig(setting, color);
      console.log("Color changed to " + color);
    } else {
      // coming from a html color input
      updateConfig(setting, color.target.value);
    }
    resetAnimation();
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>, setting: string) {
    // checking if files array is not null
    if (event.target.files) {
      // send form data to the backend so it can eventually get uploaded to supabase
      // send back supabase url

      const file = event.target.files[0];
      const formData = new FormData();
      // add the bytes of the file to our form data array
      formData.append("filename", file.name);
      formData.append("userID", userID);
      formData.append("file", file);

      // send the bytes of our file to the backend
      try {
        const response = await fetch("http://localhost:8000/user/upload_file", {
          method: "POST",
          body: formData,
        });
        // getting the url response from our backend
        const data = await response.json();
        const url = data["url"];
        console.log(data);
        // updating the config with the sound url
        if (data["content-type"] === "image/gif") {
          // we have a base url to a bucket instead (for frame sequence)
          updateConfig("sequence_frame_count", data["gif_frame_count"]);
          updateConfig("sequence_fps", data["gif_fps"]);
          updateConfig("sequence", url);
        } else {
          // we have a file with only 1 url
          updateConfig(setting, url);
        }
      } catch (error) {
        console.log(error);
      }
    }
  }
  function updateResolution(newResolution: string) {
    setResolution(newResolution);

    let [width, height] = videoResolutions[newResolution];
    updateConfig("canvas_width", width);
    updateConfig("canvas_height", height);
  }
  function handleDurationChange(event: React.ChangeEvent<HTMLInputElement>) {
    // duration as a number
    let d: number = parseInt(event.target.value);
    setDuration(parseInt(event.target.value));
    updateConfig("duration", d);
  }
  function formatTime(time: number, duration: number) {
    // time is in format s.00
    return time.toFixed(2) + " / " + duration.toFixed(2);
  }

  // the actual video editor component
  return (
    <VideoEditorContext.Provider
      value={{
        handleColorChange,
        handleFileChange,
        resolution,
        updateResolution,
        duration,
        handleDurationChange,
        formElements,
        InputTypes,
      }}
    >
      <div className="container">
        <h1>Studio</h1>
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
                {/** Setting the option selects to the names of our animations
                 * nameMap = {"particle-ring": "two particles"}
                 * nameMap["file_name"] = "animation_name"
                 *
                 */}
                {Object.keys(animationNameMap).map((name) => {
                  return (
                    <option key={name} value={name}>
                      {animationNameMap[name]}
                    </option>
                  );
                })}
              </select>
            </form>
            <ControlPanel />
          </div>
        </div>
      </div>
    </VideoEditorContext.Provider>
  );
}

export default VideoEditor;
