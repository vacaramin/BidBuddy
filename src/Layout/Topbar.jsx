import styled from "styled-components";
import { useState, useEffect } from "preact/hooks";
import { Settings2 } from "lucide-preact";

const Topbar = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {}, [apiKey]);
  const handleSave = (e) => {
    setApiKey(e.target.value);
  };
  return (
    <div className={className}>
      <Settings2 onClick={handleClick}></Settings2>
      {isOpen && (
        <div className="inputField">
          <input type="text" className="toggle" defaultValue={apiKey} />
          <button onClick={handleSave}>Set Api Key</button>
        </div>
      )}
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

  .inputField {
    display: flex;
    gap: 5px;
  
    input {
      height: 100%;
    }
  
    button {
      height: 100%;
    }
  }
`;
