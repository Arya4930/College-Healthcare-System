import { useState } from "react";
import "../../css/DoctorDashboard.css";
import { FilterIcon } from "lucide-react";

export default function StudentDashboard() {
    const [search, setSearch] = useState("");

    const visits = [
        {
            id: 1,
            visitDate: "2026-01-10",
            sickness: "Common Cold",
            doctorName: "Dr. R. Kumar",
            prescription: "Paracetamol, Cough Syrup",
        },
        {
            id: 2,
            visitDate: "2026-01-12",
            sickness: "Migraine",
            doctorName: "Dr. S. Mehta",
            prescription: "Pain Reliever, Rest",
        },
        {
            id: 3,
            visitDate: "2026-01-14",
            sickness: "Vitamin Deficiency",
            doctorName: "Dr. A. Verma",
            prescription: "Vitamin Supplements",
        },
        {
            id: 4,
            visitDate: "2026-01-15",
            sickness: "Allergic Reaction",
            doctorName: "Dr. N. Kapoor",
            prescription: "Antihistamines",
        },
        {
            id: 5,
            visitDate: "2026-01-18",
            sickness: "Stomach Ache",
            doctorName: "Dr. P. Singh",
            prescription: "Antacids, Fluids",
        }
    ];

    const filteredVisits = visits.filter((v) =>
        v.sickness.toLowerCase().includes(search.toLowerCase()) ||
        v.doctorName.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="doctor-dashboard">
            <h1>Student Dashboard</h1>

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
                <h2>My Medical Visits</h2>

                {filteredVisits.length === 0 ? (
                    <p>No visits found.</p>
                ) : (
                    filteredVisits.map((visit) => (
                        <div className="prescription-card" key={visit.id}>
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
