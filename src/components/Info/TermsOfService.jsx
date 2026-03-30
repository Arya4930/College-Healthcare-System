import "../../css/InfoPages.css";

export default function TermsOfService() {
    return (
        <main className="info-page">
            <section className="info-card">
                <h1>Terms of Service</h1>
                <p className="info-subtitle">Last updated: March 30, 2026</p>

                <article className="info-section">
                    <h2>1. Platform Purpose</h2>
                    <p>
                        This platform is built for a college health workflow demo. It helps students, parents, doctors,
                        and admins manage appointments and prescriptions in one place.
                    </p>
                </article>

                <article className="info-section">
                    <h2>2. User Responsibility</h2>
                    <p>
                        Users should enter correct details while booking appointments, viewing records, and updating
                        profile information. Shared credentials and unauthorized account usage are not allowed.
                    </p>
                </article>

                <article className="info-section">
                    <h2>3. Service Availability</h2>
                    <p>
                        We try to keep the system available at all times, but temporary interruptions may happen during
                        updates, maintenance, or network issues.
                    </p>
                </article>

                <article className="info-section">
                    <h2>4. Changes to These Terms</h2>
                    <p>
                        The project team may revise these terms at any time for academic improvements or feature updates.
                        Continued use of the platform means you accept the updated terms.
                    </p>
                </article>
            </section>
        </main>
    );
}