tsx
// src/components/Page.tsx
import React from 'react';
import InfoPanel from '../UI/InfoPanel';
import Toolbar from '../UI/Toolbar';

const Page: React.FC = () => {
  return (
    <>
      <InfoPanel />
      <Toolbar />
    </>
  );
};

export default Page;