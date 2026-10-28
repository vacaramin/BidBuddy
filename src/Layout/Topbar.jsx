import styled from "styled-components";
import { useState } from "preact/hooks";
import Github from "@/assets/icons/github.svg";
import { getCurrentUrl } from "preact-router";

const Topbar = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  const handleSave = (e) => {
    setApiKey(e.target.value);
  };
  const url = getCurrentUrl().split("?")[0].split("#")[0];

  const pageTitles = {
    "/": "Home",
    "/proposal": "Generate Proposal",
    "/history": "History",
    "/settings": "Settings",
    "/import-export": "Import & Export",
    "/about": "About",
  };

  return (
    <div className={className}>
      <h1 className="page-title">{pageTitles[url] || "Home"}</h1>

      <a
        href="https://github.com/vacaramin/InstantBids"
        target="_blank"
        className="github-contribute"
        aria-label="Want to contribute?"
      >
        <img className="github-icon" src={Github} alt="" />
        <span className="contribute-long">Want to contribute?</span>
        <span className="contribute-short">Contribute</span>
      </a>
    </div>
  );
};

export default styled(Topbar)`
  height: 100%;
  width: 100%;
  min-width: 0;
  flex: 1;
  max-height: var(--topBarHeight);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;

  .page-title {
    margin: 0;
    min-width: 0;
    color: #1c1c1c;
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: -0.02em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .github-contribute {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    gap: 10px;
    padding: 10px 20px;
    cursor: pointer;
    text-decoration: none;
    white-space: nowrap;
    transition: background-color 300ms ease-in;
    background-color: #6296d3;
    color: white;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.2;

    .github-icon {
      height: 25px;
      width: 25px;
      filter: brightness(0) invert(1);
    }

    &:hover {
      background-color: #3969a0;
    }

    .contribute-long,
    .contribute-short {
      color: white;
    }

    .contribute-short {
      display: none;
    }
  }

  @media (max-width: 767px) {
    .github-contribute {
      gap: 6px;
      padding: 5px 10px;
      border-radius: 8px;
      font-size: 0.75rem;

      .github-icon {
        height: 14px;
        width: 14px;
      }
    }
  }

  @media (max-width: 480px) {
    .github-contribute {
      gap: 5px;
      padding: 4px 8px;

      .contribute-long {
        display: none;
      }

      .contribute-short {
        display: inline;
      }
    }
  }
`;
