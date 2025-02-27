import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <div>
      <h1>Uh oh, 404 not found!</h1>
      <Link to="/">
        <button>Go home</button>
      </Link>
    </div>
  );
}

export default NotFoundPage;
