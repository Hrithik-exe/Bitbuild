import { useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { HomePage } from '../pages/HomePage';
import { App } from '../App';
import { blipAudio } from '../services/BlipAudio';

// Smooth cubic-bezier spring easing curves
const enterEase = [0.16, 1, 0.3, 1] as const;
const exitEase = [0.22, 1, 0.36, 1] as const;

export function AnimatedRoutes() {
  const location = useLocation();
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    if (prevPath.current !== location.pathname) {
      blipAudio.playWarpTone();
      prevPath.current = location.pathname;
    }
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <motion.div
              key="homepage-view"
              className="page-transition-view"
              initial={{ opacity: 0, scale: 0.985, filter: 'blur(6px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.025, filter: 'blur(10px)' }}
              transition={{ duration: 0.38, ease: exitEase }}
              style={{ width: '100%', minHeight: '100vh', position: 'relative' }}
            >
              <HomePage />
            </motion.div>
          }
        />

        <Route
          path="/app"
          element={
            <motion.div
              key="app-workspace-view"
              className="page-transition-view app-view-container"
              initial={{ opacity: 0, scale: 0.98, y: 14, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.98, y: -14, filter: 'blur(8px)' }}
              transition={{ duration: 0.42, ease: enterEase }}
              style={{ width: '100%', height: '100vh', overflow: 'hidden', position: 'relative' }}
            >
              <App />
            </motion.div>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}
