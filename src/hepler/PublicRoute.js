import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export function PublicRoute({ children }) {
  let { isAuth } = useAuth();
  let location = useLocation();

  return isAuth ? (
    <Navigate
      to={{
        pathname: "/channels",
        state: { from: location }
      }}
    />
  ) : (
    children
  );
}
