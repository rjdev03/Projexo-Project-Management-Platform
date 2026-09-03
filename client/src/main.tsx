import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './app/store';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from "@clerk/react";
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ClerkProvider>
        <Provider store={store}>
          <App />
        </Provider>
      </ClerkProvider>   
    </BrowserRouter>
  </StrictMode>
)
