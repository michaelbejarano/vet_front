import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import '@fontsource-variable/plus-jakarta-sans';
import '@fontsource-variable/inter';

import '@/styles/index.css';

import { AuthProvider } from '@/context/AuthContext';
import App from './App';

const root = document.getElementById('root');

if (!root) {
  throw new Error(
    'No se encontró el elemento raíz.'
  );
}

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);