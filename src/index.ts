import React from 'react';
import { createRoot } from 'react-dom/client';
import Home from './app/page';

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(React.createElement(Home));
