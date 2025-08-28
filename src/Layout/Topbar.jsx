import styled from "styled-components";
import { useState } from "preact/hooks";
import Github from "@/assets/icons/github.svg";
import { Breadcrumb } from "antd";
import { getCurrentUrl, Link } from "preact-router";
import { HomeIcon } from "lucide-preact";

const Topbar = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  const handleSave = (e) => {
    setApiKey(e.target.value);
  };
  const url = getCurrentUrl();

  const breadCrumbMapping = {
    "/proposal": "Generate Proposal",
    "/history": "History",
    "/settings": "Settings",
    "/": "",
  };

  return (
    <div className={className}>
      <Breadcrumb
        items={[
          { title: <HomeIcon size={20} />, href: "/" },
          ...(url !== "/"
            ? [{ title: breadCrumbMapping[url] }]
            : [{ title: "Home" }]),
        ]}
      />

      <a
        href="https://github.com/vacaramin/InstantBids"
        target="_blank"
        className="github-contribute"
      >
        <img className="github-icon" src={Github} />
        <p>Want to contribute?</p>
      </a>
    </div>
  );
};

export default styled(Topbar)`
  .ant-breadcrumb {
    padding: 10px 0px;
  }

  height: 100%;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;

  .github-contribute {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 5px 10px;
    cursor: pointer;
    text-decoration: none;
    transition: background-color 300ms ease-in;
    background-color: #6296d3;
    color: white;
    padding: 10px 20px;
    border-radius: 12px;

    .github-icon {
      height: 25px;
      filter: brightness(0) invert(1);
    }

    &:hover {
      background-color: #3969a0;
    }

    p {
      margin: 0;
      color: white;
    }
  }
`;
