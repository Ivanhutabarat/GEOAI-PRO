import { render } from '@testing-library/react';
import React from 'react';
import App from './src/App.tsx';

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} } as any;
}
const mockFn = () => ({
  matches: false,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
});
Object.defineProperty(window, 'matchMedia', { writable: true, value: mockFn });
globalThis.localStorage = { getItem:()=>'DUMMY', setItem:()=>{}, removeItem:()=>{}, clear:()=>{}, key:()=>null, length: 0 };
globalThis.sessionStorage = { getItem:()=>null, setItem:()=>{}, removeItem:()=>{}, length:0, clear:()=>{}, key:()=>null };
window.HTMLCanvasElement.prototype.getContext = () => null;

test('renders app without blowing up', () => {
    render(<App />);
});
