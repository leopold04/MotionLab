import "../styles/Sidebar.css";

function Sidebar() {
  return (
    <div className="sidebar">
      <h2>MotionLab</h2>
      <ul>
        <li>Create Video</li>
        <li>My videos</li>
        <hr></hr>
        <li>Join our discord</li>
        <li>0 video credits: update plan</li>
        <hr></hr>
        <li id="profile">Profile</li>
      </ul>
    </div>
  );
}

export default Sidebar;
