import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
// gets all the animation names and renders them to the screen
function Dashboard() {
  const [animations, setAnimations] = useState<string[]>([]);

  async function getAnimationNames() {
    const response = await fetch("http://localhost:8000/file/default_configs");
    const data = await response.json();

    let names = [];
    // want to get categories later on
    for (let file_name of Object.keys(data)) {
      // names.push(data[file_name]["name"]);
      names.push(file_name);
    }

    setAnimations(names);
  }

  useEffect(() => {
    getAnimationNames();
  }, []); // Empty dependency array means it runs only once on mount

  // return link to dashboard with animation = name
  return animations.map((name: string) => (
    <Link key={name} to={`/animations/${name}`}>
      <button>{name}</button>
    </Link>
  ));
}

export default Dashboard;
