import { useContext } from "react";
import VideoEditorContext from "./VideoEditorContext";
import Selector from "./Selector";

// contains different selector settings (color, audio, gif, etc) and video export settings (duration, resolution)

const videoResolutions: { [key: string]: number[] } = {
  "480p": [480, 854],
  "720p": [720, 1280],
  "1080p": [1080, 1920],
};

function ControlPanel() {
  const context = useContext(VideoEditorContext);
  if (context === undefined) {
    // todo: put this in our context so that the logic is not handled in other components
    throw new Error("Context is not defined");
  }
  const { resolution, updateResolution, duration, handleDurationChange, formElements, InputTypes } = context;

  // button group for choosing the video resolution
  let resolutionSelector: JSX.Element = (
    <div className="resolution-group" key="resolution-selector">
      {Object.keys(videoResolutions).map((videoResolution) => {
        return (
          <button
            className={"resolution-button " + (resolution == videoResolution ? "selected" : "")}
            type="button"
            onClick={() => updateResolution(videoResolution)}
            key={videoResolution}
          >
            {videoResolution}
          </button>
        );
      })}
    </div>
  );

  let durationSelector: JSX.Element = (
    <div key="duration-selector">
      <label htmlFor="duration">Video Duration:</label>
      <input
        type="number"
        id="duration"
        name="duration"
        min="1"
        max="65"
        onChange={handleDurationChange}
        placeholder={duration.toString()}
      />
    </div>
  );

  // all the different setting selectors
  // including the duration and resolution selectors first
  let selectors: JSX.Element[] = [resolutionSelector, durationSelector];
  for (let [setting, value, inputType] of formElements) {
    // only including form elements that are of these types:
    // type InputType = "color" | "audio" | "image" | "gif";
    if (InputTypes.includes(inputType)) {
      let selector;
      if (inputType == "color") {
        selector = <Selector selectorType="color" setting={setting} defaultValue={value} key={setting} />;
      } else {
        // only the color selector will have a default value for now
        selector = <Selector selectorType={inputType} setting={setting} key={setting} />;
      }
      selectors.push(selector);
    }
  }

  return <form id="config-form">{selectors}</form>;
}

export default ControlPanel;
