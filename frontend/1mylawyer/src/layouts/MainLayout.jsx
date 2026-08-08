import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

/**
 * MainLayout.jsx
 * --------------
 * This component provides a consistent layout wrapper for all public-facing
 * and user-authenticated pages (i.e., everything except the Admin panel).
 *
 * It renders the main Navbar and Footer, and uses React Router's <Outlet>
 * component to render the specific page content for the current route.
 *
 * By centralizing the layout here, we avoid duplicating the Navbar and Footer
 * in every single page component, which solves two problems:
 *   1. Eliminates duplicate components being rendered.
 *   2. Ensures the Navbar and Footer are perfectly consistent across all pages
 *      that use this layout.
 */
function MainLayout() {
  return (
    <>
      <Navbar />
      {/* The <Outlet> component from React Router renders the matched child route's element. */}
      {/* For example, for the "/" path, it will render the <Home /> component. */}
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

export default MainLayout;
