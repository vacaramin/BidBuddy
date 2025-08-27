import styled from "styled-components";
import logo from "/logo.png";

const Logo = ({ className }) => {
  return (
    <div className={className}>
      <img
        src={logo}
        width={"50px"}
        height={"50px"}
        className="logo"
        alt="logo Instant Bid"
      />
      <h1>Bid buddy</h1>
    </div>
  );
};

export default styled(Logo)`
  display: flex;
  align-items: center;
  gap: 5px;

  .logo {
    object-fit: contain;
  }
`;
