import { useState, useEffect } from "react";
import "../../css/DoctorDashboard.css";
import { APIBASE } from "../../config";

export default function DoctorDashboard({ user }) {
    const [appointments, setAppointments] = useState([]);
    const [search, setSearch] = useState("");
    const [schedulingId, setSchedulingId] = useState(null);
    const [scheduleInput, setScheduleInput] = useState({ date: "", time: "" });
    const [prescriptionModal, setPrescriptionModal] = useState(null);
    const [prescriptionData, setPrescriptionData] = useState({
        diagnosis: "",
        prescription: ""
    });

    function formatDateForInput(dateValue) {
        const date = new Date(dateValue);
        if (Number.isNaN(date.getTime())) return "";
        return date.toISOString().slice(0, 10);
    }

    async function fetchAppointments() {
        const token = localStorage.getItem("token");

        const res = await fetch(`${APIBASE}/api/appointments/doctor`, {
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

            const res = await fetch(`${APIBASE}/api/appointments/doctor`, {
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

        if (!scheduleInput.date || !scheduleInput.time) {
            return;
        }

        const res = await fetch(`${APIBASE}/api/appointments/accept/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                date: scheduleInput.date,
                time: scheduleInput.time,
            })
        });

        if (res.ok) {
            setSchedulingId(null);
            setScheduleInput({ date: "", time: "" });
            fetchAppointments();
        }
    }

    function openScheduleForm(appointment) {
        setSchedulingId(appointment._id);
        setScheduleInput({
            date: formatDateForInput(appointment.date),
            time: appointment.time || "",
        });
    }

    async function handleComplete(id) {
        const token = localStorage.getItem("token");

        await fetch(`${APIBASE}/api/appointments/complete/${id}`, {
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
            {user.phone && <p><strong>Doctor Phone: </strong>{user.phone}</p>}

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
                        {appointment.time && <p><strong>Time:</strong> {appointment.time}</p>}
                        <p><strong>Reason:</strong> {appointment.reason}</p>
                        <p><strong>Status:</strong> {appointment.status}</p>
                        {appointment.parentPhone && <p><strong>Parent Phone:</strong> {appointment.parentPhone}</p>}

                        {appointment.status === "pending" && (
                            <>
                                {schedulingId === appointment._id ? (
                                    <>
                                        <input
                                            type="date"
                                            className="search-bar"
                                            value={scheduleInput.date}
                                            onChange={(e) =>
                                                setScheduleInput({ ...scheduleInput, date: e.target.value })
                                            }
                                        />
                                        <input
                                            type="time"
                                            className="search-bar"
                                            value={scheduleInput.time}
                                            onChange={(e) =>
                                                setScheduleInput({ ...scheduleInput, time: e.target.value })
                                            }
                                        />
                                        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                                            <button
                                                className="primary-btn"
                                                onClick={() => handleAccept(appointment._id)}
                                            >
                                                Confirm
                                            </button>
                                            <button
                                                className="secondary-btn"
                                                onClick={() => {
                                                    setSchedulingId(null);
                                                    setScheduleInput({ date: "", time: "" });
                                                }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <button
                                        className="primary-btn"
                                        onClick={() => openScheduleForm(appointment)}
                                    >
                                        Accept & Set Schedule
                                    </button>
                                )}
                            </>
                        )}

                        {appointment.status === "approved" && (
                            <>
                                {schedulingId === appointment._id ? (
                                    <>
                                        <input
                                            type="date"
                                            className="search-bar"
                                            value={scheduleInput.date}
                                            onChange={(e) =>
                                                setScheduleInput({ ...scheduleInput, date: e.target.value })
                                            }
                                        />
                                        <input
                                            type="time"
                                            className="search-bar"
                                            value={scheduleInput.time}
                                            onChange={(e) =>
                                                setScheduleInput({ ...scheduleInput, time: e.target.value })
                                            }
                                        />
                                        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                                            <button
                                                className="primary-btn"
                                                onClick={() => handleAccept(appointment._id)}
                                            >
                                                Save New Schedule
                                            </button>
                                            <button
                                                className="secondary-btn"
                                                onClick={() => {
                                                    setSchedulingId(null);
                                                    setScheduleInput({ date: "", time: "" });
                                                }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <button
                                        className="secondary-btn"
                                        onClick={() => openScheduleForm(appointment)}
                                    >
                                        Reschedule
                                    </button>
                                )}

                                <button
                                    className="primary-btn"
                                    onClick={() => setPrescriptionModal(appointment._id)}
                                    style={{ marginTop: "10px" }}
                                >
                                    Add Prescription
                                </button>
                            </>
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
