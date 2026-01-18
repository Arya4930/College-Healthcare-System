import { useState } from "react";
import "../../css/Login.css";
import student from "/assets/student.avif";
import { Link } from "react-router-dom";

export default function LoginStudent() {
    const [formData, SetFormData] = useState({
        studentID: "",
        password: "",
    });

    const [error, SetError] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.studentID || !formData.password) {
            SetError("Please fill in all fields");
            return;
        }

        SetError("");
        console.log("Form submitted", formData);
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
                            id="studentID"
                            name="studentID"
                            placeholder="Enter your Student ID (e.g 24BCE5274)"
                            value={formData.studentID}
                            onChange={(e) => { SetFormData({ ...formData, studentID: e.target.value }); SetError(null) }}
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