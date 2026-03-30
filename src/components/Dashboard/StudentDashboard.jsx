import { useState } from "react";
import "../../css/DoctorDashboard.css";
import { useEffect } from "react";
import { APIBASE } from "../../config.js";

export default function StudentDashboard({ user }) {
    const [search, setSearch] = useState("");
    const [visits, setVisits] = useState([]);
    const [filterType, setFilterType] = useState("status");
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("");
    const [prescriptionFilter, setPrescriptionFilter] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [appointmentData, setAppointmentData] = useState({
        date: "",
        reason: "",
    });

    async function handleBookAppointment(e) {
        e.preventDefault();

        const token = localStorage.getItem("token");

        try {
            const res = await fetch(`${APIBASE}/api/appointments/book`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                credentials: "include",
                body: JSON.stringify(appointmentData),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message);

            alert("Appointment request sent!");
            setShowModal(false);
            setAppointmentData({ date: "", reason: "" });

        } catch (err) {
            alert(err.message);
        }
    }

    useEffect(() => {
        const fetchAllAppointments = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${APIBASE}/api/appointments`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    credentials: "include",
                });
                const data = await res.json();

                if (data.success) {
                    setVisits(data.data);
                } else {
                    console.error("Failed to fetch appointments:", data.message);
                }
            } catch (err) {
                console.error("Error fetching appointments:", err);
            }
        };
        fetchAllAppointments();
    }, []);

    const filteredVisits = visits
        .filter((v) =>
            v.reason.toLowerCase().includes(search.toLowerCase()) ||
            (v.doctor || "").toLowerCase().includes(search.toLowerCase())
        )
        .filter((v) => {
            if (filterType === "status") {
                return statusFilter === "all" ? true : v.status === statusFilter;
            }

            if (filterType === "date") {
                if (!dateFilter) return true;
                const visitDate = new Date(v.date).toISOString().slice(0, 10);
                return visitDate === dateFilter;
            }

            if (filterType === "prescription") {
                if (!prescriptionFilter.trim()) return true;
                return (v.prescription || "")
                    .toLowerCase()
                    .includes(prescriptionFilter.toLowerCase());
            }

            return true;
        });

    return (
        <div className="doctor-dashboard">
            <h1>Student Dashboard</h1>

            {showModal && (
                <div className="modal-overlay">
                    <div className="prescription-card" style={{ width: "400px" }}>
                        <h2>Book Appointment</h2>
                        <p><strong>Student ID:</strong> {user.ID}</p>
                        <p><strong>Name:</strong> {user.name}</p>
                        <p><strong>Parent ID:</strong> {user.parent || "None"}</p>

                        <br></br>
                        <form onSubmit={handleBookAppointment}
                            style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <input
                                type="date"
                                className="search-bar"
                                value={appointmentData.date}
                                onChange={(e) =>
                                    setAppointmentData({
                                        ...appointmentData,
                                        date: e.target.value
                                    })
                                }
                                required
                            />

                            <textarea
                                placeholder="Reason"
                                className="search-bar"
                                value={appointmentData.reason}
                                onChange={(e) =>
                                    setAppointmentData({
                                        ...appointmentData,
                                        reason: e.target.value
                                    })
                                }
                                required
                            />

                            <div style={{ display: "flex", gap: "10px" }}>
                                <button type="submit" className="primary-btn">
                                    Submit
                                </button>
                                <button
                                    type="button"
                                    className="secondary-btn"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="dashboard-actions">
                <input
                    type="text"
                    placeholder="Search by Student ID or Name"
                    className="search-bar"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <select
                    className="search-bar"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                >
                    <option value="status">Filter: Status</option>
                    <option value="date">Filter: Date</option>
                    <option value="prescription">Filter: Prescription</option>
                </select>

                {filterType === "status" && (
                    <select
                        className="search-bar"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="completed">Completed</option>
                    </select>
                )}

                {filterType === "date" && (
                    <input
                        type="date"
                        className="search-bar"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                    />
                )}

                {filterType === "prescription" && (
                    <input
                        type="text"
                        placeholder="Filter by prescription"
                        className="search-bar"
                        value={prescriptionFilter}
                        onChange={(e) => setPrescriptionFilter(e.target.value)}
                    />
                )}

                <button
                    className="primary-btn"
                    onClick={() => setShowModal(true)}
                >
                    Book Appointment
                </button>
            </div>

            <div className="prescription-list">
                <h2>My Medical Visits</h2>

                {filteredVisits.length === 0 ? (
                    <p>No visits found.</p>
                ) : (
                    filteredVisits.map((visit) => (
                        <div className="prescription-card" key={visit._id}>
                            <p><strong>Date:</strong> {new Date(visit.date).toLocaleDateString()}</p>
                            {visit.time && <p><strong>Time:</strong> {visit.time}</p>}
                            <p><strong>Reason:</strong> {visit.reason}</p>
                            <p><strong>Status:</strong> {visit.status}</p>
                            {visit.doctor && <p><strong>Doctor:</strong> {visit.doctorName}</p>}
                            {visit.doctorPhone && <p><strong>Doctor Phone:</strong> {visit.doctorPhone}</p>}
                            {visit.parentPhone && <p><strong>Parent Phone:</strong> {visit.parentPhone}</p>}
                            {visit.diagnosis && <p><strong>Diagnosis:</strong> {visit.diagnosis}</p>}
                            {visit.prescription && <p><strong>Prescription:</strong> {visit.prescription}</p>}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
