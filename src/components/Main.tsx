"use client";
import React, { useRef, useEffect } from "react";
import Page from "./Page";

const Main: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        if (containerRef.current) {
            const canvas = document.createElement("canvas");
            canvas.id = "myCanvas";
            containerRef.current.appendChild(canvas);
            canvasRef.current = canvas;
        }
    }, []);

    return (
        <div id="canvasContainer" ref={containerRef} style={{ width: '100vw', height: '100vh' }}>
            {canvasRef.current && (
                <Page canvas={canvasRef.current} />
            )}
        </div>
    );
};

export default Main;