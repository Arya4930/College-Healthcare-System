import './App.css'
import { Routes, Route } from 'react-router-dom';
import Footer from './components/Footer.jsx';
import Home from './components/Home.jsx';
import LoginStudent from './components/Login/LoginStudent.jsx';
import LoginParent from './components/Login/LoginParent.jsx';
import LoginDoctor from './components/Login/LoginDoctor.jsx';
import StudentDashboard from './components/Dashboard/StudentDashboard.jsx';
import ParentDashboard from './components/Dashboard/ParentDashboard.jsx';
import DoctorDashboard from './components/Dashboard/DoctorDashboard.jsx';
import Header from './components/Header.jsx';
import { useState, useEffect } from 'react';

export default function App() {
  const [LoggedIn, setLoggedIn] = useState(false);

  const [user, setUser] = useState(null);

  useEffect(() => {
    async function verify() {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch(`http://localhost:4000/api/auth/verify`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        const data = await res.json();

        if (data.success) {
          setUser(data.data);
          setLoggedIn(true);
        } else {
          localStorage.removeItem("token");
        }
      } catch (err) {
        console.error("Verification error:", err instanceof Error ? err.message : "Unknown error");
        localStorage.removeItem("token");
      }
    }

    verify();
  }, []);

  async function handleLogin(LoginData) {
    try {
      const res = await fetch(`http://localhost:4000/api/auth/loginUser`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(LoginData),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      if (data.data?.accessToken) {
        localStorage.setItem("token", data.data.accessToken);
      }

      if (data.data?.user) {
        setUser(data.data.user);
      }

    } catch (err) {
      return err instanceof Error ? err.message : "Unknown error during login";
    }
  }

  async function handleRegister(RegisterData) {
    try {
      const res = await fetch(`http://localhost:4000/api/auth/registerUser`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(RegisterData),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      alert("Registration successful!");
    } catch (err) {
      return err instanceof Error ? err.message : "Unknown error during registration";
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    setUser(null);
  }

  return (
    <>
      <Header LoggedIn={LoggedIn} setLoggedIn={setLoggedIn} handleLogout={handleLogout} />
      <div style={{ height: '60px' }}></div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login-student" element={<LoginStudent handleLogin={handleLogin} />} />
        <Route path="/login-parent" element={<LoginParent handleLogin={handleLogin} />} />
        <Route path="/login-doctor" element={<LoginDoctor handleLogin={handleLogin} />} />
        <Route path="/login-admin" element={<LoginAdmin handleLogin={handleLogin} />} />
        <Route path="/student-dashboard" element={<StudentDashboard user={user} handleLogout={handleLogout} />} />
        <Route path="/parent-dashboard" element={<ParentDashboard user={user} handleLogout={handleLogout} />} />
        <Route path="/doctor-dashboard" element={<DoctorDashboard user={user} handleLogout={handleLogout} />} />
        <Route path="/admin-dashboard" element={<AdminDashboard user={user} handleRegister={handleRegister} handleLogout={handleLogout} />} />
      </Routes>
      <Footer />
    </>
  )
}