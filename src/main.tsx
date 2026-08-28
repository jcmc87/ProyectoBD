import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

/**
 * Punto de entrada principal del aplicativo React (main.tsx).
 * Obtiene el contenedor raíz del DOM ('root') e inicializa el árbol de renderizado de React en modo estricto.
 */
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('No se encontró el elemento raíz #root en el documento HTML.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
