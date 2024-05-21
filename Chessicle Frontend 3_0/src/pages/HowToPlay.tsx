import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";

export default function HowToPlay() {

  return (
    <div id="how-to-play">
      <Link to="week1">
        <button className="week-button">Week 1</button>
      </Link>
      <Link to="week2">
        <button className="week-button">Week 2</button>
      </Link>
      <Link to="week3">
        <button className="week-button">Week 3</button>
      </Link>
      <Link to="week4">
        <button className="week-button">Week 4</button>
      </Link>
      <Link to="week5">
        <button className="week-button">Week 5</button>
      </Link>
      <Link to="week6">
        <button className="week-button">Week 6</button>
      </Link>
      <Link to="week7">
        <button className="week-button">Week 7</button>
      </Link>
      <Link to="week8">
        <button className="week-button">Week 8</button>
      </Link>
    </div >
  );
}