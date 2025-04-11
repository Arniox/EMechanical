"use client";
import React, { useState, useEffect } from 'react';
import { World } from '../world/World'; // Assuming World is in a parent directory

const InfoPanel: React.FC = () => {
  const [infoText, setInfoText] = useState("No object selected");

  useEffect(() => {
    const world = new World();
    world.on("infoPanelTextChanged", (text: string) => {
      setInfoText(text);
    });
  }, []);

  return <div id="infoPanel">{infoText}</div>;
};