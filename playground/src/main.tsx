import ReactDOM from "react-dom";
import React from 'react'
// import App from "./App";
import "./index.css";

const App = () => <div>hello HMR test!</div>;

ReactDOM.render(<App />, document.getElementById("root"));

// @ts-ignore
import.meta.hot.accept(() => {
  ReactDOM.render(<App />, document.getElementById("root"));
});
