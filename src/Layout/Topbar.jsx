import styled from "styled-components";
import { getCurrentUrl } from "preact-router";
import ProfileMenu from "../components/ProfileMenu";

const Topbar = ({ className }) => {
  const url = getCurrentUrl().split("?")[0].split("#")[0];

  const pageTitles = {
    "/": "Home",
    "/proposal": "Generate Proposal",
    "/history": "History",
    "/settings": "Profile setup",
    "/import-export": "Import & Export",
    "/about": "About",
  };

  return (
    <div className={className}>
      <h1 className="page-title">{pageTitles[url] || "Home"}</h1>
      <ProfileMenu />
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

  @media (max-width: 767px) {
    .page-title {
      font-size: 1.2rem;
    }
  }
`;
