// src/components/WorldComponent.tsx
import React, { useRef, useEffect } from 'react'; import { World } from '../world/World';
import * as THREE from 'three';
import { Node } from '../models/Node';
import InfoPanel from '../UI/InfoPanel';

interface WorldComponentProps {
  world: World;
}

const WorldComponent: React.FC<WorldComponentProps> = ({ world }: WorldComponentProps) => {
  if (!world || !world.renderer) {
    return <div>World not initialized yet.</div>;
  }

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (world && world.renderer && containerRef.current) {
      containerRef.current.appendChild(world.renderer.domElement);
    }
  }, [world]);

  return (
    <div>
      <InfoPanel world={world} />
      <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(255, 255, 255, 0.7)', padding: 10 }}>
        <button onClick={() => world?.addNode()}>Add Node</button>
        <button onClick={() => world?.resetCameraView()}>Reset View</button>
          <button onClick={() => world?.deleteSelected()}>Delete Selected</button>
          <button onClick={() => world?.linkSelected()}>Link Selected</button>
      </div>
      <div ref={containerRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
    </div>
  );
};
export default WorldComponent;