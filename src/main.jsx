import './index.scss'
import Router from 'preact-router';
import { render } from 'preact';
import Sidebar from './Layout/Sidebar.jsx';
import Config from './pages/Config.jsx';
import Home from './pages/Home.jsx';


const Main = () => (
  <Router>
    <Sidebar path = "/" children={<Home/>}/>
    <Sidebar path = "/config" children={<Config/>}/>
  </Router>
);

render(<Main />, document.getElementById('app'));