import "../css/Header.css";
import { Link, useNavigate } from "react-router-dom";
import logo from "/logo.png";
import { Menu, X, ShoppingCart } from "lucide-react";
import { useState } from "react";

export default function Header({ user, LoggedIn, setLoggedIn, handleLogout }) {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    const scrollTo = (id) => {
        const section = document.getElementById(id);
        section?.scrollIntoView({ behavior: "smooth" });
    };

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
                                scrollTo("affiliated-hospitals");
                            }, 100);
                        }}
                    >
                        Affiliated Hospitals
                    </button>
                    <button
                        className="other-buttons"
                        onClick={() => {
                            navigate("/");
                            setMenuOpen(false);
                            setTimeout(() => {
                                scrollTo("our-goals");
                            }, 100);
                        }}
                    >
                        Our Goals
                    </button>

                    {LoggedIn && user ? (
                        <>
                            {user.role === "admin" && (
                                <Link to="/admin-dashboard" onClick={() => setMenuOpen(false)}>Admin Dashboard</Link>
                            )}
                            {user.type === "student" && (
                                <>
                                    <Link to="/student-dashboard" onClick={() => setMenuOpen(false)}>Student Dashboard</Link>
                                    <Link to="/medicines" onClick={() => setMenuOpen(false)}>Medicines</Link>
                                    <Link to="/medicines/student-cart" onClick={() => setMenuOpen(false)}><ShoppingCart /><span style={{ fontSize: "18px" }}> Cart</span></Link>
                                </>
                            )}
                            {user.type === "parent" && (
                                <Link to="/parent-dashboard" onClick={() => setMenuOpen(false)}>Parent Dashboard</Link>
                            )}
                            {user.type === "doctor" && (
                                <>
                                    <Link to="/doctor-dashboard" onClick={() => setMenuOpen(false)}>Doctor Dashboard</Link>
                                    <Link to="/medicines" onClick={() => setMenuOpen(false)}>Stock</Link>
                                    <Link to="/medicines/doctor-stock-cart" onClick={() => setMenuOpen(false)}><ShoppingCart /><span style={{ fontSize: "18px" }}> Stock Cart</span></Link>
                                </>
                            )}

                            <button
                                onClick={() => {
                                    setLoggedIn(false);
                                    handleLogout();
                                    setMenuOpen(false);
                                }}
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login-student">Student Login</Link>
                            <Link to="/login-parent">Parent Login</Link>
                            <Link to="/login-doctor">Doctor Login</Link>
                            <Link to="/login-admin">Admin Login</Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}