import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { GlobalGeoProvider } from './context/GlobalGeoContext';
import ErrorBoundary from './components/Shared/ErrorBoundary';
import { prebootIntegrityCheck } from './lib/identityValidator';

const container = document.getElementById('root')!;
const root = createRoot(container);

// Run pre-boot heartbeat lock validator
prebootIntegrityCheck().finally(() => {
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <GlobalGeoProvider>
          <App />
        </GlobalGeoProvider>
      </ErrorBoundary>
    </StrictMode>,
  );
});
