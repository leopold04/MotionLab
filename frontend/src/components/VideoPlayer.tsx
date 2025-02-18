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

  const {
    formatTime,
    play,
    pause,
    resetAnimation,
    randomizeAnimation,
    exportVideo,
    isRunning,
    videoProgress,
    setVideoProgress,
  } = context;

  let bar = (
    <div className="progress-bar">
      <div className="progress__fill" style={{ width: `${videoProgress["progress"]}%` }}></div>
      <span className="progress__text">{Math.round(videoProgress["progress"])}%</span>
    </div>
  );

  // contains export/download button and the progress of the video
  function exportComponent() {
    let progress = videoProgress["progress"];
    let videoURL = videoProgress["url"];
    // show progress bar if video is being made
    if (progress > 0) {
      // if the video is done generating and a url has been made for it
      if (videoURL) {
        return (
          <button id="download-button" onClick={() => downloadVideo(videoURL)}>
            Download <FontAwesomeIcon icon={faDownload} />
          </button>
        );
      } else {
        return bar;
      }
    } else {
      // just show export button, since the video has not been made yet
      return (
        <button id="export-button" onClick={exportVideo}>
          Export <FontAwesomeIcon icon={faDownload} />
        </button>
      );
    }
  }

  function downloadVideo(url: string) {
    // Create a new URL object
    let downloadUrl = new URL(url);

    // Append the query parameter to the URL (if needed)
    downloadUrl.searchParams.append("download", "video.mp4");

    // Create a new anchor element
    let a = document.createElement("a");

    // Set the href of the anchor element to the download URL
    a.href = downloadUrl.toString();

    // Set the download attribute of the anchor element to the filename
    a.download = "video.mp4";

    // Append the anchor element to the body
    document.body.appendChild(a);

    // Simulate a click on the anchor element
    a.click();

    // Remove the anchor element from the body
    document.body.removeChild(a);

    // now we set the progress back to 0 to let a new video be made by the user
    setVideoProgress({ progress: 0, url: null });
  }
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
      {exportComponent()}
    </div>
  );
}

export default VideoPlayer;
