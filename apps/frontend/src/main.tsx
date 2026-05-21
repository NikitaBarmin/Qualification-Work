import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app';
import { AppProviders } from './app/providers';

import './app/styles/index.scss';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root container was not found');
}

createRoot(container).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
);
