import "../css/Home.css";
import doctor2 from "/assets/doctor-2.png";
import parent from "/assets/parent.png";
import student from "/assets/student.avif";
import hospitalLogo from "/assets/hospital.jpg";
import medicosLogo from "/assets/medicos.jpg";

export default function Home() {
  const hospitalLinks = [
    "https://www.apollohospitals.com/",
    "https://www.fortishealthcare.com/",
    "https://www.manipalhospitals.com/",
    "https://www.kauveryhospital.com/",
    "https://www.cmch-vellore.edu/",
  ];

  const affiliatedHospitals = [
    { name: "Vellore City Care", image: hospitalLogo, location: "Vellore, Tamil Nadu" },
    { name: "Sunrise Multispeciality", image: hospitalLogo, location: "Katpadi, Vellore" },
    { name: "Green Valley Hospital", image: hospitalLogo, location: "Gandhi Nagar, Vellore" },
    { name: "Unity Medical Center", image: hospitalLogo, location: "Chennai, Tamil Nadu" },
    { name: "Lifeline Clinic", image: hospitalLogo, location: "Bengaluru, Karnataka" },
  ];

  const affiliatedMedicos = [
    { name: "MediPlus Pharmacy", image: medicosLogo, location: "VIT Main Gate" },
    { name: "HealthHub Medicos", image: medicosLogo, location: "Katpadi Road" },
    { name: "CareKart Medicos", image: medicosLogo, location: "Gandhi Nagar" },
    { name: "Apollo Day Medicos", image: medicosLogo, location: "CMC Road" },
    { name: "Campus Pharmacy", image: medicosLogo, location: "Near VIT Hostel" },
  ];

  const openRandomHospital = () => {
    const randomIndex = Math.floor(Math.random() * hospitalLinks.length);
    const selectedLink = hospitalLinks[randomIndex];
    window.open(selectedLink, "_blank", "noopener,noreferrer");
  };

  const handleCardKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openRandomHospital();
    }
  };

  return (
    <div className="home-page">
      <section className="main">
        <div className="main-content">
          <h1><span style={{ fontSize: "45px" }}>O</span>ne Place for Doctors, Parents and Students of VIT</h1>
          <p>
            An unified digital health platform for medical staff, parents, and students for better care and communication.
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

      <section className="affiliates-section" id="affiliated-hospitals">
        <h1>Affiliated Hospitals</h1>
        <div className="carousel-window">
          <div className="carousel-track">
            {[...affiliatedHospitals, ...affiliatedHospitals].map((hospital, idx) => (
              <div
                className="affiliate-card"
                key={`hospital-${idx}`}
                onClick={openRandomHospital}
                onKeyDown={handleCardKeyDown}
                role="button"
                tabIndex={0}
                aria-label={`Open hospital site for ${hospital.name}`}
              >
                <img src={hospital.image} alt={hospital.name} />
                <div className="affiliate-card-content">
                  <h3>{hospital.name}</h3>
                  <p>{hospital.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="affiliates-section" id="affiliated-medicos">
        <h1>Affiliated Medicos</h1>
        <div className="carousel-window">
          <div className="carousel-track reverse-scroll">
            {[...affiliatedMedicos, ...affiliatedMedicos].map((medico, idx) => (
              <div
                className="affiliate-card"
                key={`medico-${idx}`}
                onClick={openRandomHospital}
                onKeyDown={handleCardKeyDown}
                role="button"
                tabIndex={0}
                aria-label={`Open hospital site from ${medico.name}`}
              >
                <img src={medico.image} alt={medico.name} />
                <div className="affiliate-card-content">
                  <h3>{medico.name}</h3>
                  <p>{medico.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
