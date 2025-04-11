tsx
// src/components/Render.tsx
import React, { useEffect } from 'react';
import { World } from '../world/World';

const Render: React.FC = () => {
  useEffect(() => {
    const handleResize = () => {
      const world = new World();

      const width = window.innerWidth;
      const height = window.innerHeight;

      if (width === 0 || height === 0) return;

      world.camera.aspect = width / height;
      world.camera.updateProjectionMatrix();
      world.renderer.setSize(width, height);      
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return null;
};

export default Render;