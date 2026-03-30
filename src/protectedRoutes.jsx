import { Navigate } from "react-router-dom";

export function ProtectedRoute({ user, children }) {
    if(!user) {
        return <Navigate to="/" replace />;
    }
    return children;
}

export function TypeRoute({ user, allowedTypes, children }) {
    if(!user) {
        return <Navigate to="/" replace />;
    }
    if (!allowedTypes.includes(user.type)) {
        return <Navigate to="/" replace />;
    }
    return children;
}

export function LoggedIn({ user, children }) {
    if(user) {
        const dashboardByType = {
            student: "/student-dashboard",
            parent: "/parent-dashboard",
            doctor: "/doctor-dashboard",
            admin: "/admin-dashboard",
        };

        return <Navigate to={dashboardByType[user.type] || "/"} replace />;
    }
    return children;
}