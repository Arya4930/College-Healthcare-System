import "../css/Home.css";
import doctor2 from "/assets/doctor-2.png";
import parent from "/assets/parent.png";
import student from "/assets/student.avif";

export default function Home() {
  return (
    <div className="home-page">
      <section className="main">
        <div className="main-content">
          <h1>One Place for Doctors Parents and Students of VIT</h1>
          <p>
            A unified digital health platform connecting medical staff, parents,
            and students for better care and communication.
          </p>
        </div>
      </section>
      <section className="goals" id="our-goals">
        <h1>Our Goals</h1>

        <div className="goal-row">
          <img src={doctor2} alt="Doctors" />
          <div className="goal-text">
            <h3>Empower Doctors</h3>
            <p>
              Provide all doctors inside VIT with quick access to student health records, reports, and medical history with a quick search.
            </p>
          </div>
        </div>

        <div className="goal-row reverse">
          <img src={parent} alt="Parents" />
          <div className="goal-text">
            <h3>Keep Parents Informed</h3>
            <p>
              Enable parents to stay updated about their ward’s health status, prescriptions and medical visits.
            </p>
          </div>
        </div>

        <div className="goal-row">
          <img src={student} alt="Students" />
          <div className="goal-text">
            <h3>Support Students</h3>
            <p>
              Help students easily book appointments, view prescriptions, and manage their health records.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
