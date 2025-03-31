import styled from "styled-components";

const Card = ({ className }) => {
  return <div className={className}></div>;
};

export default styled(Card)`

  background-color: rgba(0, 0, 0, 0.3);
  min-height: 100px;
  padding: 5px;
  border-radius: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .iconBox {
    img {
    }
  }
`;
