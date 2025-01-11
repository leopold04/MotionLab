import "../styles/VideoLibrary.css";

export default function VideoLibrary() {
  return (
    <div className="lib-container">
      <h1>My Videos (0)</h1>
      <div className="video-library">
        <div className="card odd"></div>
        <div className="card even"></div>
        <div className="card odd"></div>
        <div className="card even"></div>
        <div className="card odd"></div>
      </div>
    </div>
  );
}
