import "./index.scss";
import Router, { Route } from "preact-router";
import { render } from "preact";
import Sidebar from "./Layout/Sidebar.jsx";
import Home from "./pages/Home.jsx";
import { ConfigProvider } from "antd";
import token from "./token.js";
import GenerateProposal from "./pages/GenerateProposal.jsx";
import History from "./pages/History.jsx";
import SleepCycle from "./pages/SleepCycle.jsx";
import Settings from "./pages/Settings.jsx";

const Main = () => (
  <ConfigProvider theme={token}>
    <Router>
      <Sidebar default path="/" children={<Home />} />
      <Sidebar path="/settings" children={<Settings />} />
      <Sidebar path="/history" children={<History />} />
      <Sidebar path="/sleep-cycle" children={<SleepCycle />} />
      <Sidebar path="/proposal" children={<GenerateProposal />} />
      <Route path="*" component={<Home />}></Route>
      
    </Router>
  </ConfigProvider>
);

render(<Main />, document.getElementById("app"));
