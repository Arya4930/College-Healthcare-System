import "../../css/InfoPages.css";

export default function AboutUs() {
    return (
        <main className="info-page">
            <section className="info-card">
                <h1>About Us</h1>
                <p className="info-subtitle">Team behind the College Health System project</p>

                <article className="info-section">
                    <h2>Project Vision</h2>
                    <p>
                        We designed this portal to simplify communication between students, parents, doctors, and
                        administrators through one connected healthcare workflow.
                    </p>
                </article>

                <section className="info-team-grid">
                    <article className="info-team-card">
                        <h3>Arya Panwar</h3>
                        <p>
                            Focused on backend logic and authentication workflows. Helped design secure login, role-based
                            access, and appointment route handling.
                        </p>
                    </article>

                    <article className="info-team-card">
                        <h3>Kushagra Singh</h3>
                        <p>
                            Focused on frontend implementation and UI consistency. Worked on dashboards, responsive
                            screens, and improving the overall user experience.
                        </p>
                    </article>
                </section>
            </section>
        </main>
    );
}