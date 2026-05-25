import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { GlobalGeoProvider } from './context/GlobalGeoContext';
import ErrorBoundary from './components/Shared/ErrorBoundary';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <GlobalGeoProvider>
        <App />
      </GlobalGeoProvider>
    </ErrorBoundary>
  </StrictMode>,
);
