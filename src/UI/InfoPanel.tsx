"use client";
import { useState, useEffect } from 'react';
import { World } from '../world/World';

interface InfoPanelProps {
  world: World;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ world }) => {
  const [infoText, setInfoText] = useState("No object selected");

  useEffect(() => {
    world.on("infoPanelTextChanged", (text: string) => {
      setInfoText(text);
    });

    return () => {
      world.off("infoPanelTextChanged", setInfoText);
    };
  }, []);

  return <div id="infoPanel">{infoText}</div>;
};

export default InfoPanel;