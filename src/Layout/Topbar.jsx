import styled from "styled-components";
import { useState } from "preact/hooks";
import { CircleX, Settings2 } from "lucide-preact";

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
      <div className="icon-wrapper" onClick={handleClick}>
        <CircleX className={`icon ${isOpen ? "show" : ""}`} />
        <Settings2 className={`icon ${!isOpen ? "show" : ""}`} />
      </div>

      <div className={`inputField ${isOpen && "show"}`}>
        <input type="text" className="toggle" defaultValue={apiKey} />
        <button onClick={handleSave}>Set Api Key</button>
      </div>
    </div>
  );
};

export default styled(Topbar)`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: row-reverse;
  align-items: center;
  gap: 10px;

  .icon-wrapper {
    position: relative;
    width: 24px;
    height: 24px;
  }

  .icon {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    cursor: pointer;
    opacity: 0;
    transition:
      opacity 0.3s ease-in-out,
      transform 0.3s ease-in-out;
  }

  .show {
    opacity: 1;
    transform: scale(1);
  }

  .inputField {
    display: flex;
    align-items: center;
    gap: 5px;
    visibility: hidden;
    transition:
      opacity 0.3s ease-in-out,
      transform 0.5s ease-in-out,
      visibility 0.5s ease-in-out;
    opacity: 0;
    transform: translateX(50px);

    input {
      height: 100%;
      padding: 5px 10px;
      width: 30%;
      min-width: 250px;
    }

    button {
      height: 100%;
      padding: 5px 10px;
      background-color: #14a800;
      border: none;
      border-radius: 2px;
      word-wrap: normal;
      cursor: pointer;

      &:hover {
        background-color: #2bcc16;
      }
    }

    &.show {
      visibility: visible;
      opacity: 1;
      transform: translateX(0px);
    }
  }
`;
