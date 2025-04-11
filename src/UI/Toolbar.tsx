"use client";
import React, { useState, useEffect, useRef } from 'react';
import { World } from '../world/World';
import Utilities from '../world/Utilities';

interface ToolbarProps {
  world: World;
}

const Toolbar: React.FC<ToolbarProps> = ({ world }) => {
  const [worldScale, setWorldScale] = useState(Utilities.getWorldScale());  
  const [unit, setUnit] = useState(Utilities.getUnit());
  const [forceX, setForceX] = useState<number>(0);
  const [forceY, setForceY] = useState<number>(0);
  const [forceZ, setForceZ] = useState<number>(0);
  const showGridCheckboxRef = useRef<HTMLInputElement>(null);

  const updateWorldSizeOutput = () => {
    const worldScaleString = Utilities.stringifiyUnit(Utilities.getWorldScale());
    const worldScaleOutput = unit === "m"
      ? ""
      : ` - <span class="unitConversionResult">${worldScaleString} m</span>`;

  };  

  useEffect(() => {
    updateWorldSizeOutput();
  }, [worldScale, unit]);

  const handleUnitSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    Utilities.setUnit(event.target.value);    
    setUnit(event.target.value);
  };

  const handleShowGridCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    Utilities.getKeyState().showGrid = event.target.checked;
    // Dispatch a custom event to notify about the grid visibility change
  };

  const handleWorldScaleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    Utilities.setWorldScale(value);
    setWorldScale(Utilities.getWorldScale());
    if (world) {
      world.updateWorldScale(value);
    }
  };

  const handleForceInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = event.target;
    const parsedValue = parseFloat(value) || 0;
    switch (id) {
      case 'forceXInput':
        setForceX(parsedValue);
        break;
      case 'forceYInput':
        setForceY(parsedValue);
        break;
      case 'forceZInput':
        setForceZ(parsedValue);
        break;
    }
  };

  const handleAddNodeButtonClick = () => {
    world.addNode();
  };

  const handleDeleteSelectedButtonClick = () => {
    world.deleteSelected();
  };

  const handleLinkButtonClick = () => {
    world.linkSelected();
  };

  const handleResetViewButtonClick = () => {
    world.resetCameraView();
  };

  useEffect(() => {
    const showGridCheckbox = showGridCheckboxRef.current;
    if (showGridCheckbox) {
      showGridCheckbox.checked = true; // Set initial state
    }
  }, []);

  return (    
    <div id="toolbar">
      <select id="unitSelect" value={Utilities.getUnit()} onChange={handleUnitSelectChange}>
        <option value="mm">mm</option>
        <option value="m">m</option>
      </select>

      <div>
        <input
          type="checkbox"
          id="showGridCheckBox"
          ref={showGridCheckboxRef}
          onChange={handleShowGridCheckboxChange}
        />
        <label htmlFor="showGridCheckBox">Show Grid</label>
      </div>

      <div>
        <label htmlFor="worldScaleInput">World Scale:</label>
        <input
          type="range"
          min={0.5}
          max={5}
          step={0.1}
          id="worldScaleInput"
          value={Utilities.getWorldScale()}
          onChange={handleWorldScaleInputChange}
        />
        <output id="worldSizeOutput" />
      </div>

      <div>
        <label htmlFor="forceXInput">Force X:</label>
        <input
          type="number"
          id="forceXInput"
          value={forceX}
          onChange={handleForceInputChange}
        />
      </div>

      <div>
        <label htmlFor="forceYInput">Force Y:</label>
        <input
          type="number"
          id="forceYInput"
          value={forceY}
          onChange={handleForceInputChange}
        />
      </div>

      <div>
        <label htmlFor="forceZInput">Force Z:</label>
        <input
          type="number"
          id="forceZInput"
          value={forceZ}
          onChange={handleForceInputChange}
        />
      </div>

      <button id="addNodeButton" onClick={handleAddNodeButtonClick}>Add Node</button>
      <button id="deleteButton" onClick={handleDeleteSelectedButtonClick}>Delete</button>
      <button id="linkButton" onClick={handleLinkButtonClick}>Link</button>
      <button id="resetViewButton" onClick={handleResetViewButtonClick}>Reset View</button>
    </div>
  );
};

export default Toolbar;