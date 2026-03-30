import "../../css/Login.css";

export default function LoginFailedModal({ message, onClose }) {
    return (
        <div className="login-failed-modal-overlay" onClick={onClose}>
            <div
                className="login-failed-modal"
                onClick={(e) => e.stopPropagation()}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="login-failed-title"
                aria-describedby="login-failed-message"
            >
                <h2 id="login-failed-title">Login Failed</h2>
                <p id="login-failed-message">{message}</p>
                <button type="button" className="login-failed-modal-btn" onClick={onClose}>
                    Try Again
                </button>
            </div>
        </div>
    );
}