import "../css/Header.css"

export default function Header() {
    return (
        <header>
            <div className="header-left" onClick={() => window.location.href = "/"}>
                <img src="/logo.jpg" alt="College Health System Logo" className="logo" />
                <h2>College Health System</h2>
            </div>
            <div className="header-right">
                <a href="/login-student">Student Login</a>
                <a href="/login-parent">Parent Login</a>
                <a href="/login-doctor">Doctor Login</a>
            </div>
        </header>
    )
}