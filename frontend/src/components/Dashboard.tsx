import Sidebar from "./Sidebar";
import VideoEditor from "./VideoEditor";
import VideoLibrary from "./VideoLibrary";
function Dashboard() {
  return (
    <>
      <Sidebar />
      <div className="area">
        <VideoEditor />
        <VideoLibrary />
      </div>
    </>
  );
}

export default Dashboard;
