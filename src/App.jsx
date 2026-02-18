import './App.css'
import { Routes, Route } from 'react-router-dom';
import Footer from './components/Footer.jsx';
import Home from './components/Home.jsx';
import LoginStudent from './components/Login/LoginStudent.jsx';
import LoginParent from './components/Login/LoginParent.jsx';
import LoginDoctor from './components/Login/LoginDoctor.jsx';
import LoginAdmin from './components/Login/LoginAdmin.jsx';
import StudentDashboard from './components/Dashboard/StudentDashboard.jsx';
import ParentDashboard from './components/Dashboard/ParentDashboard.jsx';
import DoctorDashboard from './components/Dashboard/DoctorDashboard.jsx';
import AdminDashboard from './components/Dashboard/AdminDashboard.jsx';
import { ProtectedRoute, TypeRoute, LoggedIn } from './protectedRoutes.jsx';
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
      const res = await fetch(`http://localhost:4000/api/auth/login`, {
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
      window.location.href = `/College-Healthcare-System/#/${LoginData.type}-dashboard`;

    } catch (err) {
      return err instanceof Error ? err.message : "Unknown error during login";
    }
  }

  async function handleRegister(RegisterData) {
    try {
      const token = localStorage.getItem("token");

      if (!token) return "Not authenticated";

      const res = await fetch(`http://localhost:4000/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(RegisterData),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      alert("User created successfully!");
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
      <Header user={user} LoggedIn={LoggedIn} setLoggedIn={setLoggedIn} handleLogout={handleLogout} />
      <div style={{ height: '60px' }}></div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="login-student"
          element={
            <LoggedIn user={user}>
              <LoginStudent handleLogin={handleLogin} />
            </LoggedIn>
          }
        />
        <Route
          path="login-parent"
          element={
            <LoggedIn user={user}>
              <LoginParent handleLogin={handleLogin} />
            </LoggedIn>
          }
        />
        <Route
          path="login-doctor"
          element={
            <LoggedIn user={user}>
              <LoginDoctor handleLogin={handleLogin} />
            </LoggedIn>
          }
        />
        <Route
          path="login-admin"
          element={
            <LoggedIn user={user}>
              <LoginAdmin handleLogin={handleLogin} />
            </LoggedIn>
          }
        />
        <Route
          path="/student-dashboard"
          element={
            <TypeRoute user={user} allowedTypes={["student"]}>
              <StudentDashboard user={user} handleLogout={handleLogout} />
            </TypeRoute>
          }
        />
        <Route
          path="/parent-dashboard"
          element={
            <TypeRoute user={user} allowedTypes={["parent"]}>
              <ParentDashboard user={user} handleLogout={handleLogout} />
            </TypeRoute>
          }
        />
        <Route
          path="/doctor-dashboard"
          element={
            <TypeRoute user={user} allowedTypes={["doctor"]}>
              <DoctorDashboard user={user} handleLogout={handleLogout} />
            </TypeRoute>
          }
        />
        <Route
          path="/admin-dashboard"
          element={
            <TypeRoute user={user} allowedTypes={["admin"]}>
              <AdminDashboard user={user} handleRegister={handleRegister} handleLogout={handleLogout} />
            </TypeRoute>
          }
        />
      </Routes>
      <Footer />
    </>
  )
}