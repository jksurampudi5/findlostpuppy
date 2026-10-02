import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './page-transition.css';

/**
 * Ordered sequence for the 10 core application components.
 * Used to calculate direction (forward vs backward) for spatial consistency.
 */
const FLOW_ORDER: Record<string, number> = {
  '/consent': 1,
  '/owner': 2,
  '/location': 3,
  '/choice': 4,
  '/pet': 5,
  '/dog': 5,
  '/alert': 5.5,
  '/homepage': 6,
  '/dashboard': 6,
  '/capture': 8,
  '/privacy': 9,
  '/privacy-policy': 9,
  '/admin': 10,
  '/shortcuts': 10,
};

interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * 21st.dev + Emil Kowalski Animated Route & Component Transition System
 * Sequences fluid spring physics, top glowing progress bar, and directional slide-fade.
 */
export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const location = useLocation();
  const [progressWidth, setProgressWidth] = useState(0);
  const [progressOpacity, setProgressOpacity] = useState(0);
  const [animationClass, setAnimationClass] = useState('page-enter-vertical');
  
  const prevPathRef = useRef<string>(location.pathname);
  const prevStepRef = useRef<number>(FLOW_ORDER[location.pathname] || 0);

  useEffect(() => {
    const currentPath = location.pathname;
    const prevPath = prevPathRef.current;

    if (currentPath !== prevPath) {
      const currentStep = FLOW_ORDER[currentPath] || 0;
      const prevStep = prevStepRef.current;

      // Determine directional slide based on flow order
      if (currentStep > 0 && prevStep > 0 && currentStep > prevStep) {
        setAnimationClass('page-enter-forward');
      } else if (currentStep > 0 && prevStep > 0 && currentStep < prevStep) {
        setAnimationClass('page-enter-backward');
      } else {
        setAnimationClass('page-enter-vertical');
      }

      // Update refs
      prevPathRef.current = currentPath;
      prevStepRef.current = currentStep;

      // Trigger 21st.dev Top Shimmer Progress Bar
      setProgressOpacity(1);
      setProgressWidth(25);
      
      const t1 = setTimeout(() => {
        setProgressWidth(75);
      }, 80);

      const t2 = setTimeout(() => {
        setProgressWidth(100);
      }, 220);

      const t3 = setTimeout(() => {
        setProgressOpacity(0);
        setProgressWidth(0);
      }, 420);

      // Scroll viewport smoothly to top on component switch
      const mainViewport = document.querySelector('.app-main-viewport');
      if (mainViewport) {
        mainViewport.scrollTo({ top: 0, behavior: 'instant' });
      } else {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [location.pathname, location.search]);

  return (
    <>
      {/* 21st.dev Top Navigation Progress Bar */}
      <div className="route-progress-bar-container" aria-hidden="true">
        <div
          className="route-progress-bar"
          style={{
            width: `${progressWidth}%`,
            opacity: progressOpacity,
          }}
        />
      </div>

      {/* Animated Component Wrapper */}
      <div
        key={`${location.pathname}${location.search}`}
        className={`page-transition-wrapper ${animationClass}`}
      >
        {children}
      </div>
    </>
  );
};
