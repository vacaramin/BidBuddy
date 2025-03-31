import { useState } from "preact/hooks";
import { Dropdown } from "antd";
import ApiKey from "./ApiKey";
import styled, { keyframes } from "styled-components";
import { Settings2 } from "lucide-preact";

// Keyframes for the pulsing animation
const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.6;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const LiveBadge = styled.div`
  position: absolute;
  top: 15px;
  right: -4px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: ${({ is_online }) => (is_online ? "#52c41a" : "red")};
  box-shadow: 0 0 5px ${({ is_online }) => (is_online ? "#52c41a" : "red")};
  animation: ${pulse} 1.5s infinite;
`;

const IconContainer = styled.div`
  position: relative;
  display: inline-block;
  margin-top: 8px;
`;

const ApiKeyDropdown = () => {
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  const handleMenuClick = (e) => {
    e.stopPropagation();
  };

  const notificationMenu = [
    {
      label: (
        <div onClick={handleMenuClick}>
          <ApiKey />
        </div>
      ),
      key: "0",
    },
  ];

  const handleDropdownVisibleChange = (flag) => {
    setDropdownOpen(flag);
  };

  return (
    <Dropdown
      menu={{ items: notificationMenu }}
      trigger={["click"]}
      placement="bottomRight"
      open={isDropdownOpen}
      onOpenChange={handleDropdownVisibleChange}
    >
      <IconContainer onClick={() => setDropdownOpen(!isDropdownOpen)}>
        <Settings2 />
      </IconContainer>
    </Dropdown>
  );
};

export default ApiKeyDropdown;
