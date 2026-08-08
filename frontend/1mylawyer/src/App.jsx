import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import AppRoutes from "./Routes/AppRoutes";

/**
 * App.jsx
 * -------
 * Root component. Handles two global UX concerns:
 *
 * 1. PAGE TRANSITIONS
 *    Every route change re-mounts the route wrapper with a fresh key.
 *    The `lm-page-enter` CSS class animates fadeIn + slight upward motion.
 *    Duration: 0.3s — fast enough to not feel sluggish between pages.
 *
 * 2. SCROLL-TRIGGERED ANIMATIONS
 *    IntersectionObserver watches all `.lm-animate-on-scroll` elements.
 *    When an element enters the viewport (threshold: 15%), `.lm-visible`
 *    is added, triggering the CSS opacity + translateY transition.
 *    WHY IntersectionObserver and not scroll events?
 *      Scroll events fire on every pixel of scroll — expensive.
 *      IntersectionObserver fires only when an element crosses a threshold —
 *      zero impact on scroll performance.
 *    Once an element is visible it stays visible (observer disconnects
 *    that element) — no re-animation when scrolling back up.
 */
function App() {
  const location = useLocation();
  const observerRef = useRef(null);

  useEffect(() => {
    // Set up the IntersectionObserver once on mount
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("lm-visible");
            // Stop observing this element — it stays visible
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,     // Trigger when 15% of element is visible
        rootMargin: "0px 0px -40px 0px", // Slightly before the bottom edge
      }
    );

    // Observe all existing elements with the scroll animation class
    const observe = () => {
      document.querySelectorAll(".lm-animate-on-scroll").forEach((el) => {
        // Only observe elements not already visible
        if (!el.classList.contains("lm-visible")) {
          observerRef.current?.observe(el);
        }
      });
    };

    observe();

    // Re-scan on route changes — new page elements aren't in the DOM yet
    // Small delay allows React to render the new page first
    const timer = setTimeout(observe, 100);

    return () => {
      clearTimeout(timer);
      observerRef.current?.disconnect();
    };
  }, [location.pathname]); // Re-run when route changes

  return (
    /**
     * key={location.pathname} forces React to remount this wrapper
     * on every navigation. The `lm-page-enter` class then fires
     * the CSS animation fresh on each page.
     *
     * WHY not use React Transition Group or Framer Motion?
     *   Those add significant bundle weight (~30-80kb).
     *   A CSS class + key trick achieves the same result in 0kb.
     */
    <div key={location.pathname} className="lm-page-enter">
      <AppRoutes />
    </div>
  );
}

export default App;
