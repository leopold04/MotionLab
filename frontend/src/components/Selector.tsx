// parent component for all configurations
// color/image selector, audio selector (sfx, song, midi), gif (url just for now), resolution, duration
import { useContext } from "react";
import VideoEditorContext from "./VideoEditorContext";

interface Props {
  selectorType: string;
  setting: string;
  defaultValue?: string;
}

function Selector({ selectorType, setting, defaultValue }: Props) {
  // getting functions from our video editor component
  const context = useContext(VideoEditorContext);
  if (context === undefined) {
    throw new Error("Context is not defined");
  }

  const { handleColorChange, handleFileChange } = context;

  function colorSelector(setting: string, defaultValue: string): JSX.Element {
    return (
      <div>
        <label htmlFor={setting}>{setting}</label>
        {/* default value set to "#88b0db" for now... find a way to change it later*/}
        <input type="color" id={setting} value={defaultValue} onChange={(e) => handleColorChange(e, setting)} />
      </div>
    );
  }

  // start with just upload button, then we will combine it with color selector
  function imageSelector(setting: string): JSX.Element {
    return (
      <div>
        <label htmlFor={setting}>{setting}</label>
        <input
          type="file"
          id={setting}
          accept="image/png, image/jpeg, image/jpg"
          onChange={(e) => handleFileChange(e, setting)}
        />
      </div>
    );
  }

  function audioSelector(setting: string): JSX.Element {
    return (
      <div>
        <label htmlFor={setting}>{setting}</label>
        <input type="file" id={setting} accept="audio/mpeg" onChange={(e) => handleFileChange(e, setting)} />
      </div>
    );
  }

  // right now this is a upload button but we will change it to just accept urls
  // then we will change it so it has a search function for tenor's api
  function gifSelector(setting: string): JSX.Element {
    return (
      <div>
        <label htmlFor={setting}>{setting}</label>
        <input type="file" id={setting} accept="image/gif" onChange={(e) => handleFileChange(e, setting)} />
      </div>
    );
  }

  let map: any = {
    color: colorSelector(setting, defaultValue!),
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
