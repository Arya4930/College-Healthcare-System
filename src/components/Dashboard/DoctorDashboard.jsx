import { useState } from "react";
import "../../css/DoctorDashboard.css";
import { FilterIcon } from "lucide-react";

export default function DoctorDashboard() {
    const [search, setSearch] = useState("");

    const prescriptions = [
        {
            id: 1,
            patientName: "Aarav Sharma",
            studentID: "24BCE5274",
            date: "2026-01-10",
            diagnosis: "Common Cold",
        },
        {
            id: 2,
            patientName: "Riya Mehta",
            studentID: "24DS1305",
            date: "2026-01-12",
            diagnosis: "Migraine",
        },
        {
            id: 3,
            patientName: "Kunal Verma",
            studentID: "24BPS1001",
            date: "2026-01-14",
            diagnosis: "Vitamin Deficiency",
        },
        {
            id: 4,
            patientName: "Sneha Kapoor",
            studentID: "24BCE1405",
            date: "2026-01-15",
            diagnosis: "Allergic Reaction",
        },
        {
            id: 5,
            patientName: "Aditya Singh",
            studentID: "23BCE1278",
            date: "2026-01-18",
            diagnosis: "Stomach Ache",
        }
    ];

    const filteredPrescriptions = prescriptions.filter((p) =>
        p.patientName.toLowerCase().includes(search.toLowerCase()) ||
        p.studentID.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="doctor-dashboard">
            <h1>Doctor Dashboard</h1>

            <div className="dashboard-actions">
                <input 
                    type="text" 
                    placeholder="Search by Student ID or Name" 
                    className="search-bar"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)} 
                />
                <button className="primary-btn">Add New Prescription</button>
                <button className="secondary-btn">
                    <FilterIcon size={18} />
                    <span>Filter</span>
                </button>
            </div>

            <div className="prescription-list">
                <h2>Previous Prescriptions</h2>

                {filteredPrescriptions.length === 0 ? (
                    <p>No prescriptions found.</p>
                ) : (
                    filteredPrescriptions.map((prescription) => (
                        <div className="prescription-card" key={prescription.id}>
                            <p><strong>Patient:</strong> {prescription.patientName}</p>
                            <p><strong>Student ID:</strong> {prescription.studentID}</p>
                            <p><strong>Date:</strong> {prescription.date}</p>
                            <p><strong>Diagnosis:</strong> {prescription.diagnosis}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
