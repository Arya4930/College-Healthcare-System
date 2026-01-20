import "../css/Header.css"
import { Link, useNavigate } from "react-router-dom";
import logo from "/logo.png";

export default function Header({ LoggedIn, setLoggedIn }) {
    const navigate = useNavigate();

    return (
        <header>
            <div className="header-left" onClick={() => navigate("/")}>
                <img src={logo} alt="College Health System Logo" className="logo" />
                <h2>College Health System</h2>
            </div>
            <div className="header-right">
                <button
                    className="other-buttons"
                    onClick={() => {
                        navigate("/");
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
                        <Link to="/student-dashboard">Student Dashboard</Link>
                        <Link to="/parent-dashboard">Parent Dashboard</Link>
                        <Link to="/doctor-dashboard">Doctor Dashboard</Link>
                        <button onClick={() => setLoggedIn(false)}>Logout</button>
                    </>
                ) : (
                    <>
                        <Link to="/login-student">Student Login</Link>
                        <Link to="/login-parent">Parent Login</Link>
                        <Link to="/login-doctor">Doctor Login</Link>
                        <button onClick={() => setLoggedIn(true)}>Login</button>
                    </>
                )}
            </div>
        </header>
    )
}