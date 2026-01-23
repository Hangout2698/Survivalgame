import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { InventoryProvider } from './contexts/InventoryContext';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <InventoryProvider>
      <App />
    </InventoryProvider>
  </StrictMode>
);
