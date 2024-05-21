import './App.css';
import Home from "./pages/Home";
import Tutorial from "./pages/Tutorial";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";

export default function App() {
  return (
    <div className="app">
      <Router>
        <header className="header">
          <Link to="/" id="logo-link">Chessicle</Link>
          <Link to="/tutorial" id="tutorial-link">Tutorial</Link>
        </header>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tutorial" element={<Tutorial />} />
        </Routes>
      </Router>
    </div>
  );
}