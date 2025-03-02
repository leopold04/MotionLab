import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
// gets all the animation names and renders them to the screen
function Dashboard() {
  const [elements, setElements] = useState<any>(null);

  async function getAnimationNames() {
    const response = await fetch("http://localhost:8000/file/animation_configs");
    const data = await response.json();

    let categories = Object.keys(data);
    // we use the custom separator -- because we cant pass in / into links
    // this gets handled in the video editor component
    let e = categories.map((category: string) => {
      return (
        <div key={category}>
          <h2>{data[category]["category-name"]}</h2>

          {Object.keys(data[category]["animations"]).map((animation: string) => (
            <div key={data[category]["animations"][animation]["animation-name"]}>
              <Link to={`/animations/${category}--${animation}`}>
                <button>{data[category]["animations"][animation]["animation-name"]}</button>
              </Link>
            </div>
          ))}
        </div>
      );
    });
    setElements(e);
  }

  useEffect(() => {
    getAnimationNames();
  }, []); // Empty dependency array means it runs only once on mount

  // return link to dashboard with animation = name
  return elements;
}

export default Dashboard;
