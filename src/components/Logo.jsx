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
  gap: 10px;
  min-width: 0;

  .logo {
    object-fit: contain;
    flex-shrink: 0;
  }

  h1 {
    margin: 0;
    font-size: 1.35rem;
    font-weight: 700;
    line-height: 1.1;
    white-space: nowrap;
  }
`;
