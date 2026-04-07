import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "../../utils/axiosConfig.js";
import logo from "../../assets/logo.png";
import "../login/Login.css";
import "./ForgotPassword.css";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState(null); // null, 'success', 'error'
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus(null);
        setMessage("");

        try {
            const { data } = await axios.post("/auth/forgot-password", { email });
            setStatus("success");
            setMessage(data.message);
        } catch (err) {
            setStatus("error");
            setMessage(err.response?.data?.message || "Something went wrong. Please try again.");
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
                        <h1>Forgot Password</h1>
                        <p className="forgot-subtitle">
                            Enter your email address and we'll send you a link to reset your password.
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
                                <span className="material-symbols-outlined">mark_email_read</span>
                                {message}
                            </div>
                        )}

                        {status !== "success" && (
                            <>
                                <div className="form-group">
                                    <label htmlFor="reset-email">EMAIL ADDRESS</label>
                                    <div className="input-wrapper">
                                        <span className="material-symbols-outlined input-icon">mail</span>
                                        <input
                                            type="email"
                                            id="reset-email"
                                            placeholder="name@gmail.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="login-submit" disabled={isLoading}>
                                    {isLoading ? (
                                        <div className="loader"></div>
                                    ) : (
                                        <>
                                            Send Reset Link
                                            <span className="material-symbols-outlined">send</span>
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

export default ForgotPassword;
