import styled from "styled-components";
import logo from "/logo.svg";

const Logo = ({ className }) => {
  return (
    <div className={className}>
      {/* <img
        src={logo}
        width={"50px"}
        height={"50px"}
        className="logo"
        alt="logo Instant Bid"
      /> */}
      <h1> Freelance helper</h1>
    </div>
  );
};

export default styled(Logo)`
  display: flex;
  align-items: center;
  gap: 10px;

  .logo {
  }
`;
