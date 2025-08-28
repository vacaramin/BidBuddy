import styled from "styled-components";

const Card = ({ className }) => {
  return <div className={className}></div>;
};

export default styled(Card)`
  background-color: #2372cc8a;
  min-height: 100px;
  padding: 5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 12px;
  box-shadow: #2372cc8a 0px 2px 8px 0px;
  .iconBox {
    img {
    }
  }
`;
