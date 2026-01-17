import './App.css'
import { Routes, Route } from 'react-router-dom';
import About from './about/about.jsx';
import Hello from './about/Hello.jsx';

function App() {

  return (
    <>
      <Routes>
        <Route path="/" element={<Hello />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </>
  )
}

export default App
