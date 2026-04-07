import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "../../utils/axiosConfig.js";
import logo from "../../assets/logo.png";
import "../login/Login.css";
import "../forgot-password/ForgotPassword.css";

const ResetPassword = () => {
    const { token } = useParams();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState(null); // null, 'success', 'error'
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (password.length < 4) {
            setStatus("error");
            setMessage("Password must be at least 4 characters long.");
            return;
        }

        if (password !== confirmPassword) {
            setStatus("error");
            setMessage("Passwords do not match.");
            return;
        }

        setIsLoading(true);
        setStatus(null);
        setMessage("");

        try {
            const { data } = await axios.post(`/auth/reset-password/${token}`, { password });
            setStatus("success");
            setMessage(data.message + " You can now return to the login page.");
            // Removed automatic navigate to let user see success state
        } catch (err) {
            setStatus("error");
            setMessage(err.response?.data?.message || "Something went wrong. Link might be expired.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-card">
                    <div className="login-header">
                        <div className="logo-section">
                            <img src={logo} alt="AVSECO Logo" className="login-logo" />
                        </div>
                        <div className="header-divider"></div>
                        <h1>Reset Password</h1>
                        <p className="forgot-subtitle">
                            Set a new password for your account.
                        </p>
                    </div>

                    <form className="login-form" onSubmit={handleSubmit}>
                        {status === "error" && (
                            <div className="login-error-pill">
                                <span className="material-symbols-outlined">error</span>
                                {message}
                            </div>
                        )}
                        {status === "success" && (
                            <div className="login-success-pill">
                                <span className="material-symbols-outlined">check_circle</span>
                                {message}
                            </div>
                        )}

                        {status !== "success" && (
                            <>
                                <div className="form-group">
                                    <label htmlFor="password">NEW PASSWORD</label>
                                    <div className="input-wrapper">
                                        <span className="material-symbols-outlined input-icon">lock</span>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            id="password"
                                            placeholder="••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            <span className="material-symbols-outlined">
                                                {showPassword ? "visibility_off" : "visibility"}
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="confirmPassword">CONFIRM PASSWORD</label>
                                    <div className="input-wrapper">
                                        <span className="material-symbols-outlined input-icon">lock</span>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            id="confirmPassword"
                                            placeholder="••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="login-submit" disabled={isLoading}>
                                    {isLoading ? (
                                        <div className="loader"></div>
                                    ) : (
                                        <>
                                            Update Password
                                            <span className="material-symbols-outlined">lock_reset</span>
                                        </>
                                    )}
                                </button>
                            </>
                        )}

                        <Link to="/login" className="forgot-back-link">
                            <span className="material-symbols-outlined">arrow_back</span>
                            Back to Login
                        </Link>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
