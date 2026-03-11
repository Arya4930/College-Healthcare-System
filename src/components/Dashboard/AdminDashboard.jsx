import { useState } from "react";
import "../../css/DoctorDashboard.css";
import { FilterIcon, UserPlus } from "lucide-react";
import { useEffect } from "react";
import { APIBASE } from "../../config.js";

// e.g. JSON for bulk user creation
// [
//   {
//     "name": "Alice",
//     "ID": "alice01",
//     "password": "pass123",
//     "type": "student",
//     "role": "user",
//     "parent": "parent01"
//   },
//   {
//     "name": "Dr. Kumar",
//     "ID": "doc01",
//     "password": "pass123",
//     "type": "doctor",
//     "role": "user"
//   }
// ]

export default function AdminDashboard({ handleRegister }) {
    const [search, setSearch] = useState("");
    const [users, setUsers] = useState([]);
    const [bulkJSON, setBulkJSON] = useState("");

    const [newUser, setNewUser] = useState({
        name: "",
        ID: "",
        password: "",
        type: "student",
        role: "user",
        parent: "",
    });

    useEffect(() => {
        document.title = "Admin Dashboard - College Health System";
        const token = localStorage.getItem("token");
        const fetchUsers = async () => {
            try {
                const response = await fetch(`${APIBASE}/api/users`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    credentials: "include",
                });
                const data = await response.json();

                if (data.success) {
                    setUsers(data.data);
                } else {
                    console.error("Failed to fetch users:", data.message);
                }
            } catch (err) {
                console.error("Error fetching users:", err);
            }
        };
        fetchUsers();
    }, []);

    const parents = users.filter(u => u.type === "parent");

    const filteredUsers = users.filter((u) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.ID.toLowerCase().includes(search.toLowerCase())
    );

    async function handleCreateUser(e) {
        e.preventDefault();

        if (!newUser.name || !newUser.ID || !newUser.password) {
            alert("Please fill all fields");
            return;
        }

        const error = await handleRegister(newUser);

        if (error) {
            alert(error);
        } else {
            setNewUser({
                name: "",
                ID: "",
                password: "",
                type: "student",
                role: "user"
            });
        }
    }

    async function handleBulkCreate(e) {
        e.preventDefault();

        let parsed;

        try {
            parsed = JSON.parse(bulkJSON);
        } catch {
            alert("Invalid JSON format");
            return;
        }

        if (!Array.isArray(parsed)) {
            alert("JSON must be an array of users");
            return;
        }

        for (const user of parsed) {
            const error = await handleRegister(user);
            if (error) {
                console.error("Error creating user:", error);
            }
        }

        alert("Bulk user creation complete");
        setBulkJSON("");
    }

    return (
        <div className="doctor-dashboard">
            <h1>Admin Dashboard</h1>

            <div className="prescription-list" style={{ marginTop: "40px" }}>
                <h2>Create New User</h2>

                <div className="prescription-card" style={{ cursor: "default" }}>
                    <form onSubmit={handleCreateUser} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

                        <input
                            type="text"
                            placeholder="Full Name"
                            className="search-bar"
                            style={{ width: "100%" }}
                            value={newUser.name}
                            onChange={(e) =>
                                setNewUser({ ...newUser, name: e.target.value })
                            }
                        />

                        <input
                            type="text"
                            placeholder="User ID"
                            className="search-bar"
                            style={{ width: "100%" }}
                            value={newUser.ID}
                            onChange={(e) =>
                                setNewUser({ ...newUser, ID: e.target.value })
                            }
                        />

                        <input
                            type="password"
                            placeholder="Password"
                            className="search-bar"
                            style={{ width: "100%" }}
                            value={newUser.password}
                            onChange={(e) =>
                                setNewUser({ ...newUser, password: e.target.value })
                            }
                        />

                        <select
                            className="search-bar"
                            style={{ width: "100%" }}
                            value={newUser.type}
                            onChange={(e) =>
                                setNewUser({
                                    ...newUser,
                                    type: e.target.value,
                                    parent: "",
                                })
                            }
                        >
                            <option value="student">Student</option>
                            <option value="doctor">Doctor</option>
                            <option value="parent">Parent</option>
                            <option value="admin">Admin</option>
                        </select>
                        {newUser.type === "student" && parents.length > 0 && (
                            <select
                                className="search-bar"
                                style={{ width: "100%" }}
                                value={newUser.parent}
                                onChange={(e) =>
                                    setNewUser({ ...newUser, parent: e.target.value })
                                }
                            >
                                <option value="">Select Parent</option>
                                {parents.map((p) => (
                                    <option key={p._id} value={p.ID}>
                                        {p.name} ({p.ID})
                                    </option>
                                ))}
                            </select>
                        )}

                        <button type="submit" className="primary-btn">
                            Add User
                        </button>
                    </form>
                    <div className="prescription-list" style={{ marginTop: "30px" }}>
                        <h2>Bulk Create Users (Paste JSON)</h2>

                        <div className="prescription-card">

                            <textarea
                                placeholder={`Paste JSON like:
[
  { "name": "John Doe", "ID": "john1", "password": "123", "type": "student", "role": "user" },
  { "name": "Jane Smith", "ID": "jane1", "password": "123", "type": "doctor", "role": "user" }
]`}
                                className="search-bar"
                                style={{ width: "100%", height: "160px" }}
                                value={bulkJSON}
                                onChange={(e) => setBulkJSON(e.target.value)}
                            />

                            <button
                                className="primary-btn"
                                style={{ marginTop: "10px" }}
                                onClick={handleBulkCreate}
                            >
                                Add Users from JSON
                            </button>

                        </div>
                    </div>
                </div>
            </div>

            <div className="dashboard-actions">
                <input
                    type="text"
                    placeholder="Search by User ID or Name"
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
                <h2>All Users</h2>

                {filteredUsers.length === 0 ? (
                    <p>No users found.</p>
                ) : (
                    filteredUsers.map((user) => (
                        <div className="prescription-card" key={user.ID}>
                            <p><strong>Name:</strong> {user.name}</p>
                            <p><strong>User ID:</strong> {user.ID}</p>
                            <p><strong>Type:</strong> {user.type}</p>
                            <p><strong>Role:</strong> {user.role}</p>
                            {user.type === "student" && user.parent && (
                                <p><strong>Parent:</strong> {user.parent}</p>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
