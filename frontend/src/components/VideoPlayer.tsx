import { useContext } from "react";
import VideoEditorContext from "./VideoEditorContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faPause, faShuffle, faRotate, faDownload } from "@fortawesome/free-solid-svg-icons";
import "../styles/VideoPlayer.css";
function VideoPlayer() {
  const context = useContext(VideoEditorContext);
  if (context === undefined) {
    throw new Error("Context is not defined");
  }

  const { formatTime, play, pause, resetAnimation, randomizeAnimation, exportVideo, isRunning } = context;

  return (
    <div className="video-player">
      <canvas id="canvas"></canvas>
      <h3 className="time">{formatTime()}</h3>
      <div id="control-row">
        <button onClick={resetAnimation}>
          Reset <FontAwesomeIcon icon={faRotate} />
        </button>
        {/** Conditional renderring for play/pause button depending on if animation is playing or not */}
        {isRunning ? (
          <button onClick={pause}>
            Pause <FontAwesomeIcon icon={faPause} />
          </button>
        ) : (
          <button onClick={play}>
            Play <FontAwesomeIcon icon={faPlay} />
          </button>
        )}

        <button onClick={randomizeAnimation}>
          Shuffle <FontAwesomeIcon icon={faShuffle} />
        </button>
      </div>

      <button id="export-button" onClick={exportVideo}>
        Export <FontAwesomeIcon icon={faDownload} />
      </button>
    </div>
  );
}

export default VideoPlayer;
