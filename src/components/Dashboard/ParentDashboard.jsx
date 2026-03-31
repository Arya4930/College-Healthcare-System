import { useState, useEffect } from "react";
import "../../css/DoctorDashboard.css";
import { APIBASE } from "../../config.js";
import { medicinesData } from "../medicines/medicine-data.js";

export default function ParentDashboard({ user }) {
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("status");
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("");
    const [prescriptionFilter, setPrescriptionFilter] = useState("");
    const [medicines, setMedicines] = useState([]);

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
            console.log("Fetched appointments:", data); 
            if (data.success) {
                setAppointments(data.data);
            }
        }
        const fetchAllMedicines = async () => {
            try {
                const res = await fetch(`${APIBASE}/api/medicine/parent`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                    credentials: "include",
                });
                const data = await res.json();

                if (data.success) {
                    setMedicines(data.data);
                } else {
                    console.error("Failed to fetch medicines:", data.message);
                }
            } catch (err) {
                console.error("Error fetching medicines:", err);
            }
        };
        fetchAllMedicines();
        fetchAppointments();
    }, []);


    const filteredVisits = appointments
        .filter((v) =>
            v.reason.toLowerCase().includes(search.toLowerCase()) ||
            new Date(v.date).toLocaleDateString().includes(search)
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
            <h1>Parent Dashboard</h1>
            <p><strong>Parent Name: </strong>{user?.name}</p>
            {user?.phone && <p><strong>Parent Phone: </strong>{user.phone}</p>}

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
            </div>

            <div className="prescription-list">
                <h2>Ward Medical History</h2>

                {filteredVisits.length === 0 ? (
                    <p>No medical records found.</p>
                ) : (
                    filteredVisits.map((visit) => (
                        <div className="prescription-card" key={visit.id}>
                            <p><strong>Ward ID:</strong> {visit.student}</p>
                            <p><strong>Date:</strong> {new Date(visit.date).toLocaleDateString()} {visit.time ? visit.time : null}</p>
                            <p><strong>Reason:</strong> {visit.reason}</p>
                            <p><strong>Status:</strong> {visit.status}</p>
                            {visit.doctorPhone && <p><strong>Doctor Phone:</strong> {visit.doctorPhone}</p>}

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

            <div className="prescription-list">
                <h2>My Ward's Medical Orders</h2>

                {medicines.length === 0 ? (
                    <p>No orders found.</p>
                ) : (
                    medicines.map((medicine) => {
                        const medData = medicinesData.find(
                            (m) => m.name === medicine.name
                        );

                        return (
                            <div className="prescription-card" key={medicine._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div className="card-left">
                                    <p><strong>Ward Name:</strong> {medicine.wardName}</p>
                                    <p><strong>Ward ID:</strong> {medicine.student_id}</p>
                                    <p><strong>Date:</strong> {new Date(medicine.createdAt).toLocaleDateString()}</p>
                                    <p><strong>Medicine:</strong> {medicine.name}</p>
                                    <p><strong>Status:</strong> {medicine.order}</p>

                                    {medicine.price && <p><strong>Price:</strong> ₹{medicine.price}</p>}
                                    {medicine.quantity && <p><strong>Quantity:</strong> {medicine.quantity}</p>}
                                    {medicine.description && <p><strong>Description:</strong> {medicine.description}</p>}
                                </div>
                                <div className="card-right">
                                    <img
                                        src={medData?.image}
                                        alt={medicine.name}
                                        className="medicine-img"
                                    />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
