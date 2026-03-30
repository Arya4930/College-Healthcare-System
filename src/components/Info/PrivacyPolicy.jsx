import "../../css/InfoPages.css";

export default function PrivacyPolicy() {
    return (
        <main className="info-page">
            <section className="info-card">
                <h1>Privacy Policy</h1>
                <p className="info-subtitle">Last updated: March 30, 2026</p>

                <article className="info-section">
                    <h2>1. Information Collected</h2>
                    <p>
                        We collect user details like role, ID, login credentials, and appointment-related data to run
                        the college health service features.
                    </p>
                </article>

                <article className="info-section">
                    <h2>2. How Data Is Used</h2>
                    <p>
                        Data is used for authentication, appointment management, and showing relevant prescriptions to
                        approved users such as doctors, students, parents, and admins.
                    </p>
                </article>

                <article className="info-section">
                    <h2>3. Data Access</h2>
                    <p>
                        Access is role-based. Each user sees only the data required for their workflow. Admins can
                        manage system users under college policy.
                    </p>
                </article>

                <article className="info-section">
                    <h2>4. Data Retention</h2>
                    <p>
                        Project data may be retained for academic demonstration, testing, and reporting needs. Records
                        can be updated or removed by the project administrators when required.
                    </p>
                </article>
            </section>
        </main>
    );
}