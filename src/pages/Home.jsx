import styled from "styled-components";
import Card from "../components/Card";

const Home = ({ className }) => {
  return (
    <div className={className}>
      <h1>Home</h1>
      <section className="cards">
      <Card/>
      <Card/>
      <Card/>
        </section>
    </div>
  );
};

export default styled(Home)`
  .cards {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 10px;

   
  }
`;
