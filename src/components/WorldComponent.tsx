// src/components/WorldComponent.tsx
import React, { useEffect, useRef, useState } from 'react';
import { World } from '../world/World';
import * as THREE from 'three';
import { Node } from '../models/Node';
import InfoPanel from '../UI/InfoPanel';

interface WorldComponentProps {
  world: World;
}

const WorldComponent: React.FC<WorldComponentProps> = ({ world }) => {
  const previousTime = useRef<number | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  useEffect(() => {
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
      setSelectedNode(node);
    });
    };
  }, []);

  // Update grid visibility
  useEffect(() => {
    if (world && world.gridHelper) {
      world.gridHelper.visible = Utilities.keyState.showGrid;
    }
  }, [Utilities.keyState.showGrid]);
  
  // Handle force input update and info panel
  useEffect(() => {
    if (world && selectedNode) {
      // Update force input values in the UI
      const force = selectedNode.force;
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

    return () => {
      if (world) {
        world.removeAllListeners();
      }
    }
  }, [selectedNode, world]);

  return (
    <div>
      <InfoPanel world={world} />
      <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(255, 255, 255, 0.7)', padding: 10 }}>
        <button onClick={() => world?.addNode()}>Add Node</button>
        <button onClick={() => world?.resetCameraView()}>Reset View</button>
        <button onClick={() => world?.deleteSelected()}>Delete Selected</button>
        <button onClick={() => world?.linkSelected()}>Link Selected</button>
      </div>
    </div>
  );
};

export default WorldComponent;