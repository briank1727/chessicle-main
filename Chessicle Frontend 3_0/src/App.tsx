import './App.css';
import Home from "./pages/Home";
import HowToPlay from './pages/HowToPlay';
import { Week1, Week2, Week3, Week4, Week5, Week6, Week7, Week8 } from './pages/HowToPlay/';
import Tutorial from "./pages/Tutorial";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";

export default function App() {
  return (
    <div className="app">
      <Router>
        <header className="header">
          <Link to="/" id="logo-link">Chessicle</Link>
          <div>
            <Link to="/tutorial" id="tutorial-link">Tutorial</Link>
            <Link to="/howToPlay" id="how-to-play-chess-link">How to Play Chess</Link>
          </div>
        </header>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tutorial" element={<Tutorial />} />
          <Route path="/howToPlay/" element={<HowToPlay />} />
          <Route path="/howToPlay/week1" element={<Week1 />} />
          <Route path="/howToPlay/week2" element={<Week2 />} />
          <Route path="/howToPlay/week3" element={<Week3 />} />
          <Route path="/howToPlay/week4" element={<Week4 />} />
          <Route path="/howToPlay/week5" element={<Week5 />} />
          <Route path="/howToPlay/week6" element={<Week6 />} />
          <Route path="/howToPlay/week7" element={<Week7 />} />
          <Route path="/howToPlay/week8" element={<Week8 />} />
        </Routes>
      </Router>
    </div>
  );
}