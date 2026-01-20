import "../css/Header.css";
import { Link, useNavigate } from "react-router-dom";
import logo from "/logo.png";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function Header({ LoggedIn, setLoggedIn }) {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header>
            <div className="header-left" onClick={() => navigate("/")}>
                <img src={logo} alt="College Health System Logo" className="logo" />
                <h2 className="header-title">College Health System</h2>
            </div>
            <div className="header-right">
                <button
                    className="hamburger-menu"
                    onClick={() => setMenuOpen(!menuOpen)}
                >
                    {menuOpen ? <X /> : <Menu />}
                </button>

                <div className={`nav-links ${menuOpen ? "open" : ""}`}>
                    <button
                        className="other-buttons"
                        onClick={() => {
                            navigate("/");
                            setMenuOpen(false);
                            setTimeout(() => {
                                const section = document.getElementById("our-goals");
                                section?.scrollIntoView({ behavior: "smooth" });
                            }, 100);
                        }}
                    >
                        Our Goals
                    </button>

                    {LoggedIn ? (
                        <>
                            <Link to="/student-dashboard" onClick={() => setMenuOpen(false)}>Student Dashboard</Link>
                            <Link to="/parent-dashboard" onClick={() => setMenuOpen(false)}>Parent Dashboard</Link>
                            <Link to="/doctor-dashboard" onClick={() => setMenuOpen(false)}>Doctor Dashboard</Link>
                            <button onClick={() => { setLoggedIn(false); setMenuOpen(false); }}>Logout</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login-student" onClick={() => setMenuOpen(false)}>Student Login</Link>
                            <Link to="/login-parent" onClick={() => setMenuOpen(false)}>Parent Login</Link>
                            <Link to="/login-doctor" onClick={() => setMenuOpen(false)}>Doctor Login</Link>
                            <button onClick={() => { setLoggedIn(true); setMenuOpen(false); }}>Login</button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}