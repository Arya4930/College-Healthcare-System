import { useState } from "react";
import "../../css/Login.css";
import doctor from "/assets/doctor.png";
import { Link } from "react-router-dom";

export default function LoginDoctor({ handleLogin }) {
    const [formData, SetFormData] = useState({
        ID: "",
        password: "",
        type: "doctor",
    });

    const [error, SetError] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.ID || !formData.password) {
            SetError("Please fill in all fields");
            return;
        }

        SetError("");
        handleLogin(formData);
    }

    return (
        <div className="login-container" style={{ backgroundImage: `url(${doctor})` }}>
            <div className="login-card">
                <h1>Doctor Login</h1>
                <p>Login to add and view prescriptions</p>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Doctor ID</label>
                        <input
                            type="text"
                            id="ID"
                            name="ID"
                            placeholder="Enter your ID"
                            value={formData.ID}
                            onChange={(e) => { SetFormData({ ...formData, ID: e.target.value }); SetError(null) }}
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
                            onChange={(e) => { SetFormData({ ...formData, password: e.target.value }); SetError(null) }}
                        />
                    </div>

                    {error && <p className="error">{error}</p>}

                    <button type="submit" className="login-btn">Login</button>
                </form>

                <div className="links">
                    <Link to="/">Contact Admin</Link>
                    <Link to="/">Back Home</Link>
                </div>
            </div>
        </div>
    )
}