import React, { Component, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { isApiActiveGlobal, generateMockResponse } from './lib/omniBrainService';

class GlobalErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red', background: 'black', minHeight: '100vh' }}>
          <h2>Global Render Error</h2>
          <pre>{this.state.error?.message}</pre>
          <pre>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children; 
  }
}

// Omni-Brain Global Network Interceptor / Air-gap Protocol
const originalFetch = window.fetch;
try {
  Object.defineProperty(window, 'fetch', {
    value: async function (this: any, input: any, init: any) {
      const url = typeof input === 'string' ? input : (input instanceof URL ? input.href : (input as Request).url);
      
      if (url.includes('/api/')) {
        const isLive = isApiActiveGlobal();
        if (!isLive) {
          console.warn(`🛑 [OMNI-BRAIN INTERCEPTOR] Severed network connection to ${url}. Returning simulated offline response.`);
          let parsedBody: any = {};
          if (init && init.body) {
            try {
              parsedBody = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
            } catch (e) {}
          }
          return generateMockResponse({ 
            endpoint: url, 
            body: parsedBody, 
            headers: init?.headers as any, 
            method: init?.method 
          });
        }
      }
      return originalFetch.apply(this, arguments as any);
    },
    writable: true,
    configurable: true,
    enumerable: true
  });
} catch (e) {
  console.warn("⚠️ [OMNI-BRAIN] Direct window.fetch defineProperty override blocked by runtime environment. Triaging alternative interceptor paths...");
  try {
    (window as any).fetch = async function (this: any, input: any, init: any) {
      const url = typeof input === 'string' ? input : (input instanceof URL ? input.href : (input as Request).url);
      if (url.includes('/api/')) {
        const isLive = isApiActiveGlobal();
        if (!isLive) {
          console.warn(`🛑 [OMNI-BRAIN INTERCEPTOR] Severed network connection to ${url}. Returning simulated offline response.`);
          let parsedBody: any = {};
          if (init && init.body) {
            try {
              parsedBody = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
            } catch (e) {}
          }
          return generateMockResponse({ 
            endpoint: url, 
            body: parsedBody, 
            headers: init?.headers as any, 
            method: init?.method 
          });
        }
      }
      return originalFetch.apply(this, arguments as any);
    };
  } catch (e2) {
    console.warn("⚠️ [OMNI-BRAIN] window.fetch assignment also blocked. Attempting globalThis override...");
    try {
      (globalThis as any).fetch = async function (this: any, input: any, init: any) {
        const url = typeof input === 'string' ? input : (input instanceof URL ? input.href : (input as Request).url);
        if (url.includes('/api/')) {
          const isLive = isApiActiveGlobal();
          if (!isLive) {
            console.warn(`🛑 [OMNI-BRAIN INTERCEPTOR] Severed network connection to ${url}. Returning simulated offline response.`);
            let parsedBody: any = {};
            if (init && init.body) {
              try {
                parsedBody = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
              } catch (e) {}
            }
            return generateMockResponse({ 
              endpoint: url, 
              body: parsedBody, 
              headers: init?.headers as any, 
              method: init?.method 
            });
          }
        }
        return originalFetch.apply(this, arguments as any);
      };
    } catch (e3) {
      console.error("⚠️ [OMNI-BRAIN] All global fetch override channels blocked. Component level safeguards will enforce air-gap offline modes.", e3);
    }
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </React.StrictMode>
);
