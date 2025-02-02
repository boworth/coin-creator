"use client";

import { useState, useEffect } from "react";

/**
 * useIsMobile
 *
 * A custom hook that returns `true` if the viewport width is less than 768 pixels,
 * indicating a mobile device, and `false` otherwise.
 *
 * @returns {boolean} Whether the device is considered mobile.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    // Function to check if the viewport width is less than 768px.
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check on mount.
    handleResize();

    // Add event listener to update on resize.
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return isMobile;
} 