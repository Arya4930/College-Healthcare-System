import "../../css/InfoPages.css";

export default function ContactPage() {
    return (
        <main className="info-page">
            <section className="info-card">
                <h1>Contact</h1>
                <p className="info-subtitle">Reach the College Health System team</p>

                <article className="info-section">
                    <h2>General Support</h2>
                    <p>
                        Email: support@sdc.com<br />
                        Phone: +91 123456780
                    </p>
                </article>

                <article className="info-section">
                    <h2>Health Center Office</h2>
                    <p>
                        College Health Center, Near B block<br />
                        Mon-Sun: 8:30 AM to 6:00 PM
                    </p>
                </article>

                <article className="info-section">
                    <h2>Emergency Guidance</h2>
                    <p>
                        In urgent medical situations, contact campus emergency services directly and do not wait for an
                        online response.
                    </p>
                </article>
            </section>
        </main>
    );
}