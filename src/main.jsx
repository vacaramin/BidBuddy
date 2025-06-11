import "./index.scss";
import Router from "preact-router";
import { render } from "preact";
import Sidebar from "./Layout/Sidebar.jsx";
import Config from "./pages/Config.jsx";
import Home from "./pages/Home.jsx";
import { ConfigProvider } from "antd";
import token from "./token.js";
import GenerateProposal from "./pages/GenerateProposal.jsx";

const Main = () => (
  <ConfigProvider theme={token}>
    <Router>
      <Sidebar path="/" children={<Home />} />
      <Sidebar path="/config" children={<Config />} />
      <Sidebar path="/proposal" children={<GenerateProposal />} />
    </Router>
  </ConfigProvider>
);

render(<Main />, document.getElementById("app"));
