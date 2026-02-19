import { useState, useEffect } from "react";
import "../../css/DoctorDashboard.css";

export default function DoctorDashboard({ user }) {
    const [appointments, setAppointments] = useState([]);
    const [search, setSearch] = useState("");
    const [acceptingId, setAcceptingId] = useState(null);
    const [timeInput, setTimeInput] = useState("");
    const [prescriptionModal, setPrescriptionModal] = useState(null);
    const [prescriptionData, setPrescriptionData] = useState({
        diagnosis: "",
        prescription: ""
    });

    async function fetchAppointments() {
        const token = localStorage.getItem("token");

        const res = await fetch("http://localhost:4000/api/appointments/doctor", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await res.json();
        if (data.success) {
            setAppointments(data.data);
        }
    }

    useEffect(() => {
        async function loadAppointments() {
            const token = localStorage.getItem("token");

            const res = await fetch("http://localhost:4000/api/appointments/doctor", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await res.json();
            if (data.success) {
                setAppointments(data.data);
            }
        }

        loadAppointments();
    }, []);

    async function handleAccept(id) {
        const token = localStorage.getItem("token");

        const res = await fetch(`http://localhost:4000/api/appointments/accept/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ time: timeInput })
        });

        if (res.ok) {
            setAcceptingId(null);
            setTimeInput("");
            fetchAppointments();
        }
    }

    async function handleComplete(id) {
        const token = localStorage.getItem("token");

        await fetch(`http://localhost:4000/api/appointments/complete/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(prescriptionData)
        });

        setPrescriptionModal(null);
        setPrescriptionData({ diagnosis: "", prescription: "" });
        fetchAppointments();
    }

    const filtered = appointments.filter(a =>
        a.student.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="doctor-dashboard">
            <h1>Doctor Dashboard</h1>
            <p><strong>Doctor Name: </strong>{user.name}</p>

            <div className="dashboard-actions">
                <input
                    type="text"
                    placeholder="Search by Student ID"
                    className="search-bar"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="prescription-list">
                <h2>Appointments</h2>

                {filtered.map((appointment) => (
                    <div className="prescription-card" key={appointment._id}>
                        <p><strong>Student:</strong> {appointment.student}</p>
                        <p><strong>Date:</strong> {new Date(appointment.date).toLocaleDateString()}</p>
                        <p><strong>Reason:</strong> {appointment.reason}</p>
                        <p><strong>Status:</strong> {appointment.status}</p>

                        {appointment.status === "pending" && (
                            <>
                                {acceptingId === appointment._id ? (
                                    <>
                                        <input
                                            type="time"
                                            className="search-bar"
                                            value={timeInput}
                                            onChange={(e) => setTimeInput(e.target.value)}
                                        />
                                        <button
                                            className="primary-btn"
                                            onClick={() => handleAccept(appointment._id)}
                                        >
                                            Confirm
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        className="primary-btn"
                                        onClick={() => setAcceptingId(appointment._id)}
                                    >
                                        Accept
                                    </button>
                                )}
                            </>
                        )}

                        {appointment.status === "approved" && (
                            <button
                                className="primary-btn"
                                onClick={() => setPrescriptionModal(appointment._id)}
                            >
                                Add Prescription
                            </button>
                        )}

                        {appointment.status === "completed" && (
                            <>
                                <p><strong>Diagnosis:</strong> {appointment.diagnosis}</p>
                                <p><strong>Prescription:</strong> {appointment.prescription}</p>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {prescriptionModal && (
                <div className="modal-overlay">
                    <div className="prescription-card" style={{ width: "400px" }}>
                        <h2>Add Prescription</h2>

                        <textarea
                            placeholder="Diagnosis"
                            className="search-bar"
                            value={prescriptionData.diagnosis}
                            onChange={(e) =>
                                setPrescriptionData({
                                    ...prescriptionData,
                                    diagnosis: e.target.value
                                })
                            }
                        />

                        <textarea
                            placeholder="Prescription"
                            className="search-bar"
                            value={prescriptionData.prescription}
                            onChange={(e) =>
                                setPrescriptionData({
                                    ...prescriptionData,
                                    prescription: e.target.value
                                })
                            }
                        />

                        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                            <button
                                className="primary-btn"
                                onClick={() => handleComplete(prescriptionModal)}
                            >
                                Save
                            </button>
                            <button
                                className="secondary-btn"
                                onClick={() => setPrescriptionModal(null)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
