"use client";
import React, { useEffect, useRef } from "react";
import Page from "./Page";

const Main: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const canvas = document.createElement("canvas");
      canvas.id = "myCanvas";
      containerRef.current.appendChild(canvas);
    }
  }, []);

  return <div id="canvasContainer" ref={containerRef} style={{ width: '100vw', height: '100vh' }}>
    {containerRef.current && <Page canvas={containerRef.current.firstChild as HTMLCanvasElement} />}
  </div>;
};

export default Main;