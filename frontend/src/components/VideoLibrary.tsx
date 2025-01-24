import "../styles/VideoLibrary.css";

export default function VideoLibrary() {
  let videos = ["https://xsuhlhkrnljnqhiugfpo.supabase.co/storage/v1/object/public/1234/videos/video_88"];
  let videoCount = videos.length;
  function createVideoCard(url: string) {
    return (
      <div className="card" key={url}>
        <a href={url} target="_blank">
          <video src={url} autoPlay muted loop></video>
        </a>
      </div>
    );
  }

  let cards = [];
  for (let video of videos) {
    cards.push(createVideoCard(video));
  }

  return (
    <div className="lib-container">
      <h1>My Videos ({videoCount})</h1>
      <div className="video-library">{cards}</div>
    </div>
  );
}
