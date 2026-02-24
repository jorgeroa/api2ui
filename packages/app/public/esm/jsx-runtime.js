// Import-map proxy: re-exports the app's jsx-runtime from window.
// This ensures dynamically imported plugins use the same JSX transform.
const runtime = window.__REACT_JSX_RUNTIME__;
export const jsx = runtime.jsx;
export const jsxs = runtime.jsxs;
export const Fragment = runtime.Fragment;
