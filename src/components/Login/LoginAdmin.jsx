import { useState } from "react";
import "../../css/Login.css";
import admin from "/assets/admin.png"; // optional image
import { Link } from "react-router-dom";

export default function LoginAdmin({ handleLogin }) {
    const [formData, setFormData] = useState({
        ID: "",
        password: "",
        type: "admin",
    });

    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.ID || !formData.password) {
            setError("Please fill in all fields");
            return;
        }

        const errMessage = await handleLogin(formData);

        if (errMessage) {
            setError(errMessage);
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
                            }}
                        />
                    </div>

                    {error && <p className="error">{error}</p>}

                    <button type="submit" className="login-btn">
                        Login
                    </button>
                </form>

                <div className="links">
                    <Link to="/">Contact Support</Link>
                    <Link to="/">Back Home</Link>
                </div>
            </div>
        </div>
    );
}
