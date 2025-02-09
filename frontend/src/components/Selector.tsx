// parent component for all configurations
// color/image selector, audio selector (sfx, song, midi), gif (url just for now), resolution, duration

interface Props {
  selectorType: InputType;
  setting: string;
  defaultValue?: string;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>, setting: string) => void;
}

type InputType = "color" | "audio" | "image" | "gif";

function colorSelector(
  setting: string,
  defaultValue: string,
  handleChange: (event: React.ChangeEvent<HTMLInputElement>, setting: string) => void
): JSX.Element {
  return (
    <div key={setting}>
      <label htmlFor={setting}>{setting}</label>
      {/* default value set to "#88b0db" for now... find a way to change it later*/}
      <input type="color" id={setting} value={defaultValue} onChange={(e) => handleChange(e, setting)} />
    </div>
  );
}

// start with just upload button
function imageSelector(
  setting: string,
  handleChange: (event: React.ChangeEvent<HTMLInputElement>, setting: string) => void
): JSX.Element {
  return (
    <div key={setting}>
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

function Selector({ selectorType, setting, defaultValue, handleChange }: Props) {
  let map: any = {
    color: colorSelector(setting, defaultValue!, handleChange),
  };
  // ex: map["color"] returns a color selector function with setting already put in
  // colorSelector("background_color", handleChange) is a color selector for background color
  // handleChange is passed into our selector component as "handleColorChange" and sets config[bg_color] to whatever it changes to

  return map[selectorType];
}

export default Selector;
