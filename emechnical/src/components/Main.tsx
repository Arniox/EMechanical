import React from "react";
import Page from "./Page";

export const container = typeof document !== 'undefined' ? document.getElementById("canvasContainer") : null;

const Main: React.FC = () => {
  return <Page />;
};

export default Main;