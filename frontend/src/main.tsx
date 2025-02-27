import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Dashboard from "./pages/Dashboard.tsx";
import VideoEditor from "./pages/VideoEditor.tsx";
import NotFoundPage from "./pages/NotFoundPage.tsx";
import Layout from "./pages/Layout.tsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "/dashboard",
        element: <Dashboard />,
        errorElement: <NotFoundPage />,
      },
      {
        path: "/animations/:animationName",
        element: <VideoEditor />,
      },
    ],
  },
]);
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router}></RouterProvider>
  </StrictMode>
);
