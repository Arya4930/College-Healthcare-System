import './App.css'
import { Routes, Route } from 'react-router-dom';
import About from './components/about.jsx';
import Home from './components/Home.jsx';
import LoginStudent from './components/LoginStudent.jsx';
import LoginParent from './components/LoginParent.jsx';
import LoginDoctor from './components/LoginDoctor.jsx';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/login-student" element={<LoginStudent />} />
        <Route path="/login-parent" element={<LoginParent />} />
        <Route path="/login-doctor" element={<LoginDoctor />} />
      </Routes>
    </>
  )
}