// src/components/Page.tsx
import React, { useEffect, useRef } from 'react';
import Toolbar from '../UI/Toolbar';
import InfoPanel from '../UI/InfoPanel';
import { World } from '../world/World';
import Render from './Render';

export interface PageProps {
  canvas: HTMLCanvasElement;
}

const Page: React.FC<PageProps> = ({ canvas }) => {
  const worldRef = useRef<World | null>(null);

  useEffect(() => {
    if (canvas && !worldRef.current) {
      const world = new World(canvas);
      worldRef.current = world;
      
      // Set up event listeners
      world.on("infoPanelTextChanged", (text: string) => {
        // This event will be handled by the InfoPanel component.
      });
      
      // Initial render
      world.render();

      // Animation loop
      const animate = () => {
        world.updateAll(1 / 60); // Assuming 60 FPS
        world.render();
        requestAnimationFrame(animate);
      };
      animate();
    }
  }, [canvas]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {worldRef.current && (
        <>
          <InfoPanel world={worldRef.current} />
          <Toolbar world={worldRef.current} />
        </>
      )}
      {worldRef.current && <Render world={worldRef.current} />}
    </div>
  );
};

export default Page;