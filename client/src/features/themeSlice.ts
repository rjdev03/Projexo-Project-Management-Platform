import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type Theme = "light" | "dark";

export interface ThemeState {
    theme: Theme;
}

const initialState: ThemeState = {
    theme: "light",
};

const themeSlice = createSlice({
    name: "theme",
    initialState,
    reducers: {
        toggleTheme: (state) => {
            const theme: Theme = state.theme === "light" ? "dark" : "light";
            localStorage.setItem("theme", theme);
            document.documentElement.classList.toggle("dark");
            state.theme = theme;
        },
        setTheme: (state, action: PayloadAction<Theme>) => {
            state.theme = action.payload;
        },
        loadTheme: (state) => {
            const theme = localStorage.getItem("theme") as Theme | null;
            if (theme) {
                state.theme = theme;
                if (theme === "dark") {
                    document.documentElement.classList.add("dark");
                }
            }
        },
    },
});

export const { toggleTheme, setTheme, loadTheme } = themeSlice.actions;
export default themeSlice.reducer;