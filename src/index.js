import React from "react";
import ReactDOM from "react-dom";
// import RelationTable from "./pages/Graph.js";
import RelationT from "./pages/PureGraphComponent";
// import ProgressLoading from "./pages/ProgressLoading.js";

import reportWebVitals from "./reportWebVitals";
import initData from "./pages/PureGraphComponent/fakedata.js";

ReactDOM.render(
  <div data-property="box">
    <RelationT initData={initData} />
    {/* <RelationTable /> */}
  </div>,
  document.getElementById("root")
);
// ReactDOM.render(<ProgressLoading />, document.getElementById("root"));

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
