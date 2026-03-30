import { useState } from "react";
import "../../css/Login.css";
import admin from "/assets/admin.png"; // optional image
import { Link } from "react-router-dom";
import LoginFailedModal from "./LoginFailedModal";

export default function LoginAdmin({ handleLogin }) {
    const [formData, setFormData] = useState({
        ID: "",
        password: "",
        type: "admin",
    });

    const [error, setError] = useState(null);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    function showLoginError(message) {
        setError(message);
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
    };

    return (
        <div
            className="login-container"
            style={{ backgroundImage: `url(${admin})` }}
        >
            <div className="login-card">
                <h1>Admin Login</h1>
                <p>Login to manage users and system settings</p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Admin ID</label>
                        <input
                            type="text"
                            placeholder="Enter your Admin ID"
                            value={formData.ID}
                            onChange={(e) => {
                                setFormData({
                                    ...formData,
                                    ID: e.target.value,
                                });
                                setError(null);
                                setShowErrorModal(false);
                            }}
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={(e) => {
                                setFormData({
                                    ...formData,
                                    password: e.target.value,
                                });
                                setError(null);
                                setShowErrorModal(false);
                            }}
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
                    <Link to="/">Contact Support</Link>
                    <Link to="/">Back Home</Link>
                </div>
            </div>

            {showErrorModal && (
                <LoginFailedModal
                    message={error}
                    onClose={() => {
                        setShowErrorModal(false);
                        setError(null);
                    }}
                />
            )}
        </div>
    );
}
