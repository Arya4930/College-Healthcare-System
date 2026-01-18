import { useState } from "react";
import "../css/Login.css";
import parent from "/assets/parent.png";
import { Link } from "react-router-dom";

export default function LoginParent() {
    const [formData, SetFormData] = useState({
        wardID: "",
        password: "",
    });

    const [error, SetError] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.wardID || !formData.password) {
            SetError("Please fill in all fields");
            return;
        }

        SetError("");
        console.log("Form submitted", formData);
    }

    return (
        <div className="login-container" style={{ backgroundImage: `url(${parent})` }}>
            <div className="login-card">
                <h1>Parent Login</h1>
                <p>Login to view your ward's prescriptions</p>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Ward ID</label>
                        <input
                            type="text"
                            id="wardID"
                            name="wardID"
                            placeholder="Enter your Ward ID"
                            value={formData.wardID}
                            onChange={(e) => { SetFormData({ ...formData, wardID: e.target.value }); SetError(null) }}
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