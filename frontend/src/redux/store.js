import { configureStore } from "@reduxjs/toolkit";
import { userReducer } from "../reducers/userReducers";

export const store = configureStore({
    reducer: {
      user: userReducer,
    },
  });
