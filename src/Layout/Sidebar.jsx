import styled from "styled-components";
import { useState } from "preact/hooks";
import {
  History,
  Home,
  Import,
  Info,
  Menu,
  Notebook,
  Settings,
  X,
} from "lucide-preact";
import Logo from "../components/Logo";
import { Link, useRouter } from "preact-router";
import Topbar from "./Topbar";

const navItems = [
  { name: "Home", icon: <Home size={18} />, path: "/" },
  { name: "Generate Proposal", icon: <Notebook size={18} />, path: "/proposal" },
  { name: "History", icon: <History size={18} />, path: "/history" },
  { name: "Import/Export", icon: <Import size={18} />, path: "/import-export" },
  { name: "Settings", icon: <Settings size={18} />, path: "/settings" },
];

const footerItems = [
  { name: "About", icon: <Info size={18} />, path: "/about" },
];

const Sidebar = ({ className, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [router] = useRouter();
  const currentPath = (router?.url || "/").split("?")[0].split("#")[0];

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
            <X size={18} />
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
          <ul className="navMenu navFooter">
            {footerItems.map(({ name, icon, path }) => (
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
            <Menu size={18} />
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
    inset: 0;
    background: rgba(28, 28, 28, 0.4);
    z-index: 998;
    display: none;
  }

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    flex: 0 0 var(--sidebarWidth);
    width: var(--sidebarWidth);
    color: #1c1c1c;
    display: flex;
    flex-direction: column;
    transform: translateX(-100%);
    transition: transform 0.2s ease;
    background: #ffffff;
    border-right: 1px solid #e6e8ec;
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
    gap: 12px;
    padding: 16px 16px 12px;
    border-bottom: 1px solid #e6e8ec;
    flex-shrink: 0;
    box-sizing: border-box;
    width: 100%;
  }

  .closeIcon,
  .menuIcon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    padding: 0;
    border: 1px solid #e6e8ec;
    border-radius: 10px;
    background: #ffffff;
    color: #1c1c1c;
    cursor: pointer;
  }

  .closeIcon:hover,
  .menuIcon:hover {
    background: #f7fafd;
  }

  nav {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 12px;
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
      gap: 4px;
      box-sizing: border-box;
    }

    .navFooter {
      margin-top: auto;
      padding-top: 12px;
      border-top: 1px solid #e6e8ec;
    }

    .navItem {
      width: 100%;
      padding: 10px 12px;
      border-radius: 12px;
      text-align: left;
      font-size: 0.95rem;
      font-weight: 600;
      line-height: 1.2;
      cursor: pointer;
      text-decoration: none;
      color: #4b5563;
      display: flex;
      align-items: center;
      gap: 10px;
      border: none;
      box-sizing: border-box;
      white-space: nowrap;

      svg {
        flex-shrink: 0;
      }
    }

    .navItem:hover {
      background: #f7fafd;
      color: #1c1c1c;
    }

    .navItem.active {
      background: rgba(98, 150, 211, 0.14);
      color: #3969a0;
      font-weight: 700;
    }
  }

  .rightSection {
    background-color: #ffffff;
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    width: auto;
    min-width: 0;
    min-height: 0;
    height: 100vh;
    color: var(--primaryTextColor);
  }

  .topSection {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 20px;
    border-bottom: 1px solid #e6e8ec;
    background: #ffffff;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .content {
    flex: 1;
    min-width: 0;
    min-height: 0;
    padding: 20px 20px 32px;
    overflow-y: auto;
  }

  /* Desktop styles */
  @media (min-width: 768px) {
    .sidebar {
      position: relative;
      transform: translateX(0);
      width: var(--sidebarWidth);
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
      padding: 32px 16px 20px;
    }
  }

  /* Extra small screens */
  @media (max-width: 480px) {
    .sidebar {
      width: 100%;
      max-width: var(--sidebarWidth);
    }

    .content {
      padding: 32px 12px 16px;
    }

    .topSection {
      padding: 12px 16px;
    }
  }
`;
