import './App.css'
import { Routes, Route } from 'react-router-dom';
import Footer from './components/Footer.jsx';
import Home from './components/Home.jsx';
import LoginStudent from './components/LoginStudent.jsx';
import LoginParent from './components/LoginParent.jsx';
import LoginDoctor from './components/LoginDoctor.jsx';
import Header from './components/Header.jsx';

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login-student" element={<LoginStudent />} />
        <Route path="/login-parent" element={<LoginParent />} />
        <Route path="/login-doctor" element={<LoginDoctor />} />
      </Routes>
      <Footer />
    </>
  )
}