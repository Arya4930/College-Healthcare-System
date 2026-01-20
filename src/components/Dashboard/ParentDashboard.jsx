import { useState } from "react";
import "../../css/DoctorDashboard.css";
import { FilterIcon } from "lucide-react";

export default function ParentDashboard() {
    const [search, setSearch] = useState("");

    const wardVisits = [
        {
            id: 1,
            studentName: "Aarav Sharma",
            studentID: "24BCE5274",
            visitDate: "2026-01-10",
            sickness: "Common Cold",
            doctorName: "Dr. R. Kumar",
            prescription: "Paracetamol, Cough Syrup",
        },
        {
            id: 2,
            studentName: "Aarav Sharma",
            studentID: "24BCE5274",
            visitDate: "2026-01-14",
            sickness: "Migraine",
            doctorName: "Dr. S. Mehta",
            prescription: "Pain Reliever, Rest",
        },
        {
            id: 3,
            studentName: "Aarav Sharma",
            studentID: "24BCE5274",
            visitDate: "2026-01-18",
            sickness: "Stomach Ache",
            doctorName: "Dr. P. Singh",
            prescription: "Antacids, Fluids",
        }
    ];

    const filteredVisits = wardVisits.filter((v) =>
        v.sickness.toLowerCase().includes(search.toLowerCase()) ||
        v.visitDate.includes(search)
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
                            <p><strong>Student:</strong> {visit.studentName}</p>
                            <p><strong>Student ID:</strong> {visit.studentID}</p>
                            <p><strong>Date:</strong> {visit.visitDate}</p>
                            <p><strong>Sickness:</strong> {visit.sickness}</p>
                            <p><strong>Doctor:</strong> {visit.doctorName}</p>
                            <p><strong>Prescription:</strong> {visit.prescription}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
