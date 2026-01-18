import './App.css'
import { Routes, Route } from 'react-router-dom';
import Footer from './components/Footer.jsx';
import Home from './components/Home.jsx';
import LoginStudent from './components/LoginStudent.jsx';
import LoginParent from './components/LoginParent.jsx';
import LoginDoctor from './components/LoginDoctor.jsx';
import StudentDashboard from './components/StudentDashboard.jsx';
import ParentDashboard from './components/ParentDashboard.jsx';
import DoctorDashboard from './components/DoctorDashboard.jsx';
import Header from './components/Header.jsx';
import { useState } from 'react';

export default function App() {
  const [LoggedIn, setLoggedIn] = useState(false);

  return (
    <>
      <Header LoggedIn={LoggedIn} />
      <div style={{ height: '60px' }}></div>
      <button onClick={() => setLoggedIn(!LoggedIn)}>{LoggedIn ? "Set Logged Out" : "Set Logged In"}</button> ( For testing purposes )
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login-student" element={<LoginStudent />} />
        <Route path="/login-parent" element={<LoginParent />} />
        <Route path="/login-doctor" element={<LoginDoctor />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/parent-dashboard" element={<ParentDashboard />} />
        <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
      </Routes>
      <Footer />
    </>
  )
}