import { configureStore } from '@reduxjs/toolkit';
import workspaceReducer from '../features/workspaceSlice';
import themeReducer from '../features/themeSlice';

export const store = configureStore({
  reducer: {
    workspace: workspaceReducer,
    theme: themeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;