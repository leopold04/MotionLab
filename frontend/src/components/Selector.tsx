// parent component for all configurations
// color/image selector, audio selector (sfx, song, midi), gif (url just for now), resolution, duration
import { useContext, useState } from "react";
import VideoEditorContext from "./VideoEditorContext";
import "../styles/Selector.css";
interface Props {
  selectorType: string;
  setting: string;
  defaultValue?: string;
}

function Selector({ selectorType, setting, defaultValue }: Props) {
  const [appearance, setAppearance] = useState<string>("Color");
  const [colors, setColors] = useState<string[]>(["#3262a8", "#6a947f", "#dbae9e"]);
  // getting functions from our video editor component
  const context = useContext(VideoEditorContext);
  if (context === undefined) {
    throw new Error("Context is not defined");
  }
  function format(str: string) {
    //  "particle_1_color" => Particle 1 Color
    return (
      str
        // Replace all underscores (_) with spaces
        .replace(/_/g, " ")
        // Capitalize the first letter of each word
        .replace(/\b\w/g, (char) => char.toUpperCase())
    );
  }

  const { handleColorChange, handleFileChange } = context;

  function colorSelector(setting: string, defaultValue: string) {
    function updateColorArray(newColor: string) {
      // adding the new color to the beginning of the array and removing the last one
      let colorsCopy = structuredClone(colors);
      colorsCopy.unshift(newColor);
      colorsCopy.pop();
      setColors(colorsCopy);
      console.log(colorsCopy);
    }
    let colorButtons = [];
    for (let i = 0; i < colors.length; i++) {
      // making a button for each color
      let colorButton = (
        <button
          type="button"
          key={colors[i] + i.toString()}
          className="color-button"
          style={{ backgroundColor: colors[i] }}
          onClick={() => handleColorChange(colors[i], setting)}
        ></button>
      );
      colorButtons.push(colorButton);
    }

    let customColorSelector = (
      <div key="custom-color-selector">
        {/* default value set to "#88b0db" for now... find a way to change it later*/}
        <input
          type="color"
          className="custom-color-picker"
          id={setting}
          value={defaultValue}
          onChange={(e) => handleColorChange(e, setting)}
          onBlur={(e) => updateColorArray(e.target.value)}
        />
      </div>
    );

    colorButtons.push(customColorSelector);

    return (
      <>
        <p>{format(setting)}</p>
        <div className="color-picker">{colorButtons}</div>
      </>
    );
  }

  // start with just upload button, then we will combine it with color selector
  function imageSelector(setting: string): JSX.Element {
    return (
      <div>
        <label htmlFor={setting}>{format(setting)}</label>
        <input
          type="file"
          id={setting}
          accept="image/png, image/jpeg, image/jpg"
          onChange={(e) => handleFileChange(e, setting)}
        />
      </div>
    );
  }

  function colorImage(setting: string) {
    return (
      <div className="color-image-option">
        <label>Color</label>
        <input type="radio" id="color" name="appearance" value="Color" onClick={() => setAppearance("Color")} />
        <label>Image</label>
        <input type="radio" id="image" name="appearance" value="Image" onClick={() => setAppearance("Image")} />
        {appearance == "Color" ? colorSelector(setting, defaultValue!) : imageSelector(setting)}
      </div>
    );
  }

  function audioSelector(setting: string): JSX.Element {
    return (
      <div>
        <label htmlFor={setting}>{format(setting)}</label>
        <input type="file" id={setting} accept="audio/mpeg" onChange={(e) => handleFileChange(e, setting)} />
      </div>
    );
  }

  // right now this is a upload button but we will change it to just accept urls
  // then we will change it so it has a search function for tenor's api
  function gifSelector(setting: string): JSX.Element {
    return (
      <div>
        <label htmlFor={setting}>{format(setting)}</label>
        <input type="file" id={setting} accept="image/gif" onChange={(e) => handleFileChange(e, setting)} />
      </div>
    );
  }

  let map: any = {
    color: colorSelector(setting, defaultValue!),
    color_image: colorImage(setting),
    image: imageSelector(setting),
    audio: audioSelector(setting),
    gif: gifSelector(setting),
  };
  // ex: map["color"] returns a color selector function with setting already put in
  // colorSelector("background_color", handleChange) is a color selector for background color
  // handleChange is passed into our selector component as "handleColorChange" and sets config[bg_color] to whatever it changes to

  return map[selectorType];
}

export default Selector;
