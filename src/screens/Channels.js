import React, { Fragment } from "react";
import { Outlet } from "react-router-dom";

export function Channels() {
  return (
    <Fragment>
      Channels
      <Outlet />
    </Fragment>
  );
}
