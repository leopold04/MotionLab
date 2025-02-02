import Sidebar from "./Sidebar";
import VideoEditor from "./VideoEditor";
import VideoLibrary from "./VideoLibrary";
import { useEffect } from "react";
import { useState } from "react";

function Dashboard() {
  // our dashboard page loads in, we create a new session ID
  const [session, setSession] = useState<string | null>(null);
  const userID = "1234";

  // makes a unique hash for the user's session. Unique everytime the page loads
  function generateHash(length: number = 5): string {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let hash = "";

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      hash += characters[randomIndex];
    }
    return hash;
  }

  // once the user reloads or closes the page, we remove the directories associated with their session
  async function clearSession() {
    const userInfo = { userID: userID, sessionID: session };
    try {
      // Use sendBeacon to ensure the request is sent before the page unloads
      // the data we send with sendBeacon is turned into bytes, so we decode it into string then json on our backend
      const success = navigator.sendBeacon("http://localhost:8000/user/clear_session", JSON.stringify(userInfo));

      if (success) {
        console.log("Session cleared successfully");
      } else {
        console.error("Failed to send beacon");
      }
    } catch (error) {
      console.error("Error clearing session:", error);
    }
  }

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !session) {
        const newSession = generateHash();
        setSession(newSession);
        console.log("Page is visible, session created:", newSession);
      }
    };

    // Listen for visibility changes
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Check if the page is already visible when the component mounts
    handleVisibilityChange();

    // Clean up the event listener
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [session]);

  // our dashboard page is reloaded/closed, so we delete assets tied to the user on our disk
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (session) {
        clearSession();

        console.log("removing directory " + session);
      }
      console.log("reload or close");
    };

    // Add the event listener for beforeunload
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Clean up the event listener when the component is unmounted (optional, but good practice)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [session]);

  return (
    <>
      <Sidebar />
      <div className="area">
        {
          // wait until the session is not null to render the video editor component
        }
        {session ? <VideoEditor userID={userID} sessionID={session} /> : <h2>Loading...</h2>}
        <VideoLibrary />
      </div>
    </>
  );
}

export default Dashboard;
