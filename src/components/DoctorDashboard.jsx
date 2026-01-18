import "../css/DoctorDashboard.css";
import { FilterIcon } from "lucide-react";

export default function DoctorDashboard() {
    const prescriptions = [
        {
            id: 1,
            patientName: "Aarav Sharma",
            date: "2026-01-10",
            diagnosis: "Common Cold",
        },
        {
            id: 2,
            patientName: "Riya Mehta",
            date: "2026-01-12",
            diagnosis: "Migraine",
        },
        {
            id: 3,
            patientName: "Kunal Verma",
            date: "2026-01-14",
            diagnosis: "Vitamin Deficiency",
        },
        {
            id: 4,
            patientName: "Sneha Kapoor",
            date: "2026-01-15",
            diagnosis: "Allergic Reaction",
        },
        {
            id: 5,
            patientName: "Aditya Singh",
            date: "2026-01-18",
            diagnosis: "Stomach Ache",
        }
    ];

    return (
        <div className="doctor-dashboard">
            <h1>Doctor Dashboard</h1>

            <div className="dashboard-actions">
                <button className="primary-btn">Add New Prescription</button>
                <button className="secondary-btn">
                    <FilterIcon size={18} />
                    <span>Filter</span>
                </button>
            </div>

            <div className="prescription-list">
                <h2>Previous Prescriptions</h2>

                {prescriptions.length === 0 ? (
                    <p>No prescriptions found.</p>
                ) : (
                    prescriptions.map((prescription) => (
                        <div className="prescription-card" key={prescription.id}>
                            <p><strong>Patient:</strong> {prescription.patientName}</p>
                            <p><strong>Date:</strong> {prescription.date}</p>
                            <p><strong>Diagnosis:</strong> {prescription.diagnosis}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
