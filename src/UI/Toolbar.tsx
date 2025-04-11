"use client";
import React, { useState, useEffect, useRef } from 'react';
import Utilities from '../world/utilities';

const Toolbar: React.FC = () => {
  const [worldSize, setWorldSize] = useState(Utilities.worldSize);
  const [unit, setUnit] = useState(Utilities.unit);
  const [forceX, setForceX] = useState<number>(0);
  const [forceY, setForceY] = useState<number>(0);
  const [forceZ, setForceZ] = useState<number>(0);
  const showGridCheckboxRef = useRef<HTMLInputElement>(null);

  const updateWorldSizeOutput = () => {
    const worldScaleString = Utilities.stringifiyUnit(Utilities.worldScale);
    const worldScaleOutput = unit === "m"
      ? ""
      : ` - <span class="unitConversionResult">${worldScaleString} m</span>`;

    const worldSizeOutputElement = document.getElementById("worldSizeOutput");
    if (worldSizeOutputElement) {
      worldSizeOutputElement.innerHTML = `${Utilities.worldSize} ${unit}${worldScaleOutput}`;
    }
  };

  useEffect(() => {
    updateWorldSizeOutput();
  }, [worldSize, unit]);

  const handleUnitSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    Utilities.unit = event.target.value;
    setUnit(event.target.value);
  };

  const handleShowGridCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    Utilities.keyState.showGrid = event.target.checked;
    // Dispatch a custom event to notify about the grid visibility change
  };

  const handleWorldSizeInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    Utilities.setWorldSize(value);
    setWorldSize(value);
    // Update force input max/min attributes
    const forceInputs = ['forceXInput', 'forceYInput', 'forceZInput'];
    forceInputs.forEach(id => {
      const input = document.getElementById(id) as HTMLInputElement;
      if (input) {
        input.max = String(value);
        input.min = String(-value);
      }
    });
    updateWorldSizeOutput();
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
    document.dispatchEvent(new Event("addNodeEvent"));
  };

  const handleDeleteSelectedButtonClick = () => {
    document.dispatchEvent(new Event("deleteEvent"));
  };

  const handleLinkButtonClick = () => {
    document.dispatchEvent(new Event("linkEvent"));
  };

  const handleResetViewButtonClick = () => {
    document.dispatchEvent(new Event("resetCameraViewEvent"));
  };













  useEffect(() => {
    const showGridCheckbox = showGridCheckboxRef.current;
    if (showGridCheckbox) {
      showGridCheckbox.checked = true; // Set initial state
    }
  }, []);

  return (
    <div id="toolbar">
      <select id="unitSelect" value={unit} onChange={handleUnitSelectChange}>
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
        <label htmlFor="worldSizeInput">World Size:</label>
        <input
          type="number"
          id="worldSizeInput"
          value={worldSize}
          onChange={handleWorldSizeInputChange}
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