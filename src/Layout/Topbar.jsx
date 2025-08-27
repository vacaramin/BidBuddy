import styled from "styled-components";
import { useState } from "preact/hooks";
import Github from "@/assets/icons/github.svg";

const Topbar = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  const handleSave = (e) => {
    setApiKey(e.target.value);
  };

  return (
    <div className={className}>
      <a href="https://github.com/vacaramin/InstantBids" target="_blank" className="github-contribute">
        <img className="github-icon" src={Github} />
        <p>Want to contribute?</p>
      </a>
    </div>
  );
};

export default styled(Topbar)`
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: flex-end;
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

    .github-icon {
      height: 25px;
    }

    &:hover {
      background-color: rgba(255, 255, 255, 0.3);
    }

    p {
      color: var(--primaryTextColor);
      margin: 0;
    }
  }
`;
