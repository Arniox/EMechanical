// src/components/Render.tsx
import React, { useEffect } from 'react';
import { World } from '../world/World'; // Import World if needed for type checking

interface RenderProps {
  world: World;
}

const Render: React.FC<RenderProps> = ({ world }) => {
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      if (width === 0 || height === 0) return;

      if (world.camera && world.renderer) {
      world.camera.aspect = width / height;
      world.camera.updateProjectionMatrix();
      world.renderer.setSize(width, height);
      }
      world.render();
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call to set size
    return () => window.removeEventListener('resize', handleResize);    
  }, [world]);

  return null;
};

export default Render;