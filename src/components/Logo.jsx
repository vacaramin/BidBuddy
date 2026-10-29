import styled from "styled-components";
import logo from "/logo.png";

const Logo = ({ className }) => {
  return (
    <div className={className}>
      <img
        src={logo}
        width={36}
        height={36}
        className="logo"
        alt="Bid buddy logo"
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
  height: 100%;

  .logo {
    width: 36px;
    height: 36px;
    object-fit: contain;
    flex-shrink: 0;
  }

  h1 {
    margin: 0;
    color: #1c1c1c;
    font-size: 1.05rem;
    font-weight: 700;
    line-height: 1.1;
    letter-spacing: -0.02em;
    white-space: nowrap;
  }
`;
