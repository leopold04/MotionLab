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

  const { formatTime, play, pause, resetAnimation, randomizeAnimation, exportVideo, isRunning, videoURL } = context;

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

      {/** Conditional rendering for download / export button depending on if the video is done generating */}
      {videoURL ? (
        <button id="download-button" onClick={() => downloadVideo(videoURL)}>
          Download <FontAwesomeIcon icon={faDownload} />
        </button>
      ) : (
        <button id="export-button" onClick={exportVideo}>
          Export <FontAwesomeIcon icon={faDownload} />
        </button>
      )}
    </div>
  );
}

export default VideoPlayer;
