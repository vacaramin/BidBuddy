import styled from "styled-components";
import { useState } from "preact/hooks";
import {
  BookTemplate,
  History,
  Home,
  Menu,
  Notebook,
  Settings,
} from "lucide-preact";
import Logo from "../components/Logo";
import { Link } from "preact-router";
import ApiKeyDropdown from "../components/ApiKeyDropdown";

const Sidebar = ({ className, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={className}>
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="header">
          <Logo />
          <Menu className="menuIcon" onClick={() => setIsOpen(!isOpen)} />
        </div>
        <nav>
          <ul className="navMenu">
            <Link href="/" className="navItem">
              <Home /> Home
            </Link>
            <Link href="/config" className="navItem">
              <Notebook />
              Generate Proposal
            </Link>
            <Link href="/config" className="navItem">
              <BookTemplate />
              Templates
            </Link>
            <Link href="/config" className="navItem">
              <History />
              History
            </Link>
            <Link href="/config" className="navItem">
              <Settings /> Settings
            </Link>
          </ul>
        </nav>
      </aside>
      <div className="rightSection">
        <section className="topSection">
          <ApiKeyDropdown></ApiKeyDropdown>
        </section>
        <main className="content">{children}</main>
      </div>
    </div>
  );
};

export default styled(Sidebar)`
  display: flex;
  min-height: 100vh;
  height: 100%;

  .sidebar {
    color: white;
    width: 350px;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 4px 0 10px rgba(0, 0, 0, 0.1);
    transform: translateX(-100%);
    transition: transform 0.3s ease-in-out;
    overflow-y: auto;
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .header {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
    font-weight: 900;
  }

  .menuIcon {
    font-size: 24px;
    cursor: pointer;
  }
  nav {
    min-width: 100%;

    .navMenu {
      list-style: none;
      padding: 0;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: flex-start;
    }

    .navItem {
      width: calc(100% - 40px);
      padding: 12px 20px;
      margin: 8px 0;
      text-align: left;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      border-radius: 8px;
      transition: background 0.3s;
      text-decoration: none;
      color: inherit;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 5px;
    }

    .navItem:hover {
      background-color: #14a800;
    }
  }

  .rightSection {
    display: flex;
    flex-direction: column;
    width: 100%;
    padding: 20px;

    .topSection {
      display: flex;
      flex-direction: row-reverse;
      align-items: center;
      margin: 0px 20px;
      height: 50px;
      border-bottom: 2px solid rgba(255, 255, 255, 0.3);
    }

    .content {
      display: flex;
      flex-direction: column;
      padding: 20px;
    }
  }

  @media (min-width: 768px) {
    .sidebar {
      transform: translateX(0);
    }
    .menuIcon {
      display: none;
    }
  }
`;
