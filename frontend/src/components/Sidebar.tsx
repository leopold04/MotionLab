import "../styles/Sidebar.css";

function Sidebar() {
  return (
    <div className="sidebar">
      <h2>MotionLab</h2>
      <ul>
        <li>Create Video</li>
        <hr></hr>
        <li id="support">Support</li>
        <li id="settings">Settings</li>
        <hr></hr>
        <li id="profile">Profile</li>
      </ul>
    </div>
  );
}

export default Sidebar;
