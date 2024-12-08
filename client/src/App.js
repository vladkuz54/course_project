import './App.css';
import GraphPage from './containers/GraphPage/GraphPage.js';
import DataPage from './containers/DataPage/DataPage.js';
import MainPage from './containers/MainPage/MainPage.js';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  return (
    <main>
      <Router>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/graph" element={<GraphPage />} />
          <Route path="/data" element={<DataPage />} />
        </Routes>
      </Router>
    </main>
  );
}

export default App;
