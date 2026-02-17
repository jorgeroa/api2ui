import './polyfills'

import * as React from 'react'
import * as jsxRuntime from 'react/jsx-runtime'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerCorePlugins } from './plugins/core'

// Expose React on window so dynamically imported plugins (loaded via import map)
// resolve to the app's single React instance instead of bundling their own.
Object.assign(window, { __REACT__: React, __REACT_JSX_RUNTIME__: jsxRuntime })

// Register core plugins before rendering
registerCorePlugins()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
