import "../css/Footer.css";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer>
      <div className="footer-left">
        <p>© 2026 College Health System</p>
      </div>

      <div className="footer-right">
        <Link to="/privacy-policy">Privacy Policy</Link>
        <Link to="/terms-of-service">Terms of Service</Link>
        <Link to="/contact">Contact</Link>
        <Link to="/about-us">About Us</Link>
      </div>
    </footer>
  );
}
