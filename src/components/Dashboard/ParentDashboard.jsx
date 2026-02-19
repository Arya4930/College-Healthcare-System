import { useState, useEffect } from "react";
import "../../css/DoctorDashboard.css";
import { FilterIcon } from "lucide-react";
import { APIBASE } from "../../config.js";

export default function ParentDashboard() {
    const [search, setSearch] = useState("");

    const [appointments, setAppointments] = useState([]);

    useEffect(() => {
        async function fetchAppointments() {
            const token = localStorage.getItem("token");

            const res = await fetch(`${APIBASE}/api/appointments/parent`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await res.json();
            if (data.success) {
                setAppointments(data.data);
            }
        }

        fetchAppointments();
    }, []);


    const filteredVisits = appointments.filter((v) =>
        v.reason.toLowerCase().includes(search.toLowerCase()) ||
        new Date(v.date).toLocaleDateString().includes(search)
    );

    return (
        <div className="doctor-dashboard">
            <h1>Parent Dashboard</h1>

            <div className="dashboard-actions">
                <input
                    type="text"
                    placeholder="Search by Student ID or Name"
                    className="search-bar"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <button className="secondary-btn">
                    <FilterIcon size={18} />
                    <span>Filter</span>
                </button>
            </div>

            <div className="prescription-list">
                <h2>Ward Medical History</h2>

                {filteredVisits.length === 0 ? (
                    <p>No medical records found.</p>
                ) : (
                    filteredVisits.map((visit) => (
                        <div className="prescription-card" key={visit.id}>
                            <p><strong>Date:</strong> {new Date(visit.date).toLocaleDateString()} {visit.time ? visit.time : null}</p>
                            <p><strong>Reason:</strong> {visit.reason}</p>
                            <p><strong>Status:</strong> {visit.status}</p>

                            {visit.status === "completed" && (
                                <>
                                    <p><strong>Diagnosis:</strong> {visit.diagnosis}</p>
                                    <p><strong>Prescription:</strong> {visit.prescription}</p>
                                </>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
