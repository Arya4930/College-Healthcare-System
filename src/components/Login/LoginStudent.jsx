import { useState } from "react";
import "../../css/Login.css";
import student from "/assets/student.avif";
import { Link } from "react-router-dom";
import LoginFailedModal from "./LoginFailedModal";

export default function LoginStudent({ handleLogin }) {
    const [formData, SetFormData] = useState({
        ID: "",
        password: "",
        type: "student",
    });

    const [error, SetError] = useState(null);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    function showLoginError(message) {
        SetError(message);
        setShowErrorModal(true);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isLoading) return;

        if (!formData.ID || !formData.password) {
            showLoginError("Please fill in all fields");
            return;
        }

        setIsLoading(true);

        try {
            const errMessage = await handleLogin(formData);

            if (errMessage) {
                showLoginError(errMessage);
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="login-container" style={{ backgroundImage: `url(${student})` }}>
            <div className="login-card">
                <h1>Student Login</h1>
                <p>Login to view your prescriptions</p>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Student ID</label>
                        <input
                            type="text"
                            id="ID"
                            name="ID"
                            placeholder="Enter your Student ID (e.g 24BCE5274)"
                            value={formData.ID}
                            onChange={(e) => { SetFormData({ ...formData, ID: e.target.value }); SetError(null); setShowErrorModal(false); }}
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={(e) => { SetFormData({ ...formData, password: e.target.value }); SetError(null); setShowErrorModal(false); }}
                        />
                    </div>

                    <button type="submit" className="login-btn" disabled={isLoading} aria-busy={isLoading}>
                        <span className="login-btn-content">
                            {isLoading && <span className="login-btn-loader" aria-hidden="true"></span>}
                            {isLoading ? "Logging in..." : "Login"}
                        </span>
                    </button>
                </form>

                <div className="links">
                    <Link to="/">Contact Admin</Link>
                    <Link to="/">Back Home</Link>
                </div>
            </div>

            {showErrorModal && (
                <LoginFailedModal
                    message={error}
                    onClose={() => {
                        setShowErrorModal(false);
                        SetError(null);
                    }}
                />
            )}
        </div>
    )
}