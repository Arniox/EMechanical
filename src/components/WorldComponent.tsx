tsx
// src/components/WorldComponent.tsx
import React, { useEffect, useRef, useState } from 'react';
import { World } from '../world/World';
import * as THREE from 'three';
import { Node } from '../models/Node.ts';
import Utilities from '../world/utilities';
import InfoPanel from '../UI/InfoPanel';

interface WorldComponentProps { }

const WorldComponent: React.FC<WorldComponentProps> = () => {
  const worldRef = useRef<World | null>(null);
  const previousTime = useRef<number | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  useEffect(() => {
    worldRef.current = new World();
    const world = worldRef.current;

    // Animation Loop
    const animate = () => { requestAnimationFrame(animate);
      if (world) {
        const currentTime = performance.now();
        const deltaTime = previousTime.current ? (currentTime - previousTime.current) / 1000 : 0;
        previousTime.current = currentTime;
        world.updateAll(deltaTime);
        world.render();
      }
    };
    animate();

    // Subscribe to info panel text changes
    world.on("infoPanelTextChanged", (text: string) => {
      // Assuming InfoPanel is a separate component that handles UI updates
      const infoPanel = document.getElementById("infoPanel");
      if (infoPanel) { infoPanel.textContent = text; }
    });

    // Subscribe to node selection changes
    world.on("nodeSelected", (node: Node | null) => {
      setSelectedElement(node);
    });

    return () => {
      if (world) {
        world.removeAllListeners();
        worldRef.current = null;
      }
    };
  }, []);

  // Update grid visibility
  useEffect(() => {
    if (worldRef.current && worldRef.current.gridHelper) {
      worldRef.current.gridHelper.visible = Utilities.keyState.showGrid;
    }
  }, [Utilities.keyState.showGrid]);
  
  // Handle force input update and info panel
  useEffect(() => {
    if (worldRef.current && selectedElement) {
      // Update force input values in the UI
      const force = selectedElement.force;
      const forceInputs = ['forceXInput', 'forceYInput', 'forceZInput'];
      forceInputs.forEach(id => {
        const input = document.getElementById(id) as HTMLInputElement;
        if (input) {
          switch (id) {
            case 'forceXInput':
              input.value = force.x.toString();
              break;
            case 'forceYInput':
              input.value = force.y.toString();
              break;
            case 'forceZInput':
              input.value = force.z.toString();
              break;
          }
        }
      });
    }
  }, [selectedElement, worldRef.current]);

  return (
    <div>
      <InfoPanel />
      <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(255, 255, 255, 0.7)', padding: 10 }}>
        <button onClick={() => worldRef.current?.addNode()}>Add Node</button>
        <button onClick={() => worldRef.current?.resetCameraView()}>Reset View</button>
        <button onClick={() => worldRef.current?.deleteSelected()}>Delete Selected</button>
        <button onClick={() => worldRef.current?.linkSelected()}>Link Selected</button>
      </div>
    </div>
  );
};

export default WorldComponent;