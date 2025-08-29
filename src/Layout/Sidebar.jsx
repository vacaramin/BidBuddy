import styled from "styled-components";
import { useState } from "preact/hooks";
import {
  History,
  Home,
  Import,
  Menu,
  Notebook,
  Settings,
  X,
} from "lucide-preact";
import Logo from "../components/Logo";
import { Link, useRouter } from "preact-router";
import Topbar from "./Topbar";

const navItems = [
  { name: "Home", icon: <Home />, path: "/" },
  { name: "Generate Proposal", icon: <Notebook />, path: "/proposal" },
  { name: "History", icon: <History />, path: "/history" },
  { name: "Import/Export", icon: <Import />, path: "/import-export" },
  { name: "Settings", icon: <Settings />, path: "/settings" },
];

const Sidebar = ({ className, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [router] = useRouter();
  const currentPath = router.url;

  const closeSidebar = () => setIsOpen(false);

  return (
    <div className={className}>
      {/* Mobile overlay */}
      {isOpen && <div className="overlay" onClick={closeSidebar} />}

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="header">
          <Logo />
          <button
            className="closeIcon"
            onClick={closeSidebar}
            aria-label="Close sidebar"
          >
            <X />
          </button>
        </div>
        <nav>
          <ul className="navMenu">
            {navItems.map(({ name, icon, path }) => (
              <li key={path}>
                <Link
                  href={path}
                  className={`navItem ${currentPath === path ? "active" : ""}`}
                  onClick={closeSidebar}
                >
                  {icon}
                  <span>{name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="rightSection">
        <section className="topSection">
          <button
            className="menuIcon"
            onClick={() => setIsOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu />
          </button>
          <Topbar />
        </section>
        <main className="content">{children}</main>
      </div>
    </div>
  );
};

export default styled(Sidebar)`
  display: flex;
  height: 100vh;
  position: relative;
  overflow: hidden;

  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 998;
    display: none;
  }

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: var(--sidebarWidth);
    color: white;
    display: flex;
    flex-direction: column;
    box-shadow: 4px 0 20px rgba(0, 0, 0, 0.15);
    transform: translateX(-100%);
    transition: transform 0.3s ease-in-out;
    background: var(--primaryBackgroundSidebar);
    z-index: 999;
    overflow: hidden;
    box-sizing: border-box;
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    flex-shrink: 0;
    box-sizing: border-box;
    width: 100%;
  }

  .closeIcon {
    background: none;
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s;
  }

  .closeIcon:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .menuIcon {
    background: none;
    border: none;
    color: var(--primaryTextColor);
    font-size: 24px;
    cursor: pointer;
    padding: 8px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s;
  }

  .menuIcon:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }

  nav {
    flex: 1;
    padding: 20px 0;
    overflow-y: auto;
    min-height: 0;
    box-sizing: border-box;
    width: 100%;

    .navMenu {
      list-style: none;
      padding: 0;
      margin: 0;
      width: 100%;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    }

    .navItem {
      width: 100%;
      padding: 16px 24px;
      text-align: left;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
      text-decoration: none;
      color: inherit;
      display: flex;
      align-items: center;
      gap: 12px;
      border: none;
      box-sizing: border-box;
      white-space: nowrap;
      overflow: hidden;
    }

    .navItem:hover {
      background-color: rgba(255, 255, 255, 0.08);
    }

    .navItem.active {
      color: #83c3ff;
      background-color: rgba(24, 144, 255, 0.1);
      font-weight: 900 !important;
      border-right: 3px solid #83c3ff;
    }

    .navItem span {
      flex: 1;
      transition: transform 300ms ease-in-out;
      &:hover{
        color: #83c3ff;
        transform: translate(3px, 0px);
      }
    }
  }

  .rightSection {
    background-color: #ffffff;
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: 100vh;
    color: var(--primaryTextColor);
  }

  .topSection {
    display: flex;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(31, 31, 31, 0.1);
    background: white;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .content {
    flex: 1;
    padding: 0px 20px;
    overflow-y: auto;
  }

  /* Desktop styles */
  @media (min-width: 768px) {
    .sidebar {
      position: relative;
      transform: translateX(0);
      width: var(--sidebarWidth);
      box-shadow: none;
      border-right: 1px solid rgba(31, 31, 31, 0.1);
    }

    .overlay {
      display: none !important;
    }

    .menuIcon {
      display: none;
    }

    .closeIcon {
      display: none;
    }

    .topSection {
      justify-content: flex-end;
    }

    .rightSection {
      margin-left: 0;
    }
  }

  /* Mobile-specific styles */
  @media (max-width: 767px) {
    .overlay {
      display: block;
    }

    .rightSection {
      width: 100%;
    }

    .content {
      padding: 20px 16px;
    }
  }

  /* Extra small screens */
  @media (max-width: 480px) {
    .sidebar {
      width: 100%;
      max-width: var(--sidebarWidth);
    }

    .content {
      padding: 16px 12px;
    }

    .topSection {
      padding: 12px 16px;
    }
  }
`;
