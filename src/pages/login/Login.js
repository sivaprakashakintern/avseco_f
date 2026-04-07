import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.js";
import logo from "../../assets/logo.png";
import "./Login.css";

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loginStatus, setLoginStatus] = useState(null); // null, 'success', 'error'
    const [error, setError] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setLoginStatus(null);

        try {
            const data = await login(username, password);
            setLoginStatus('success');
            setIsLoading(false);
            
            // Short delay to show success message
            setTimeout(() => {
                // Redirect based on access
                if (data.role === 'admin' || (data.modules && data.modules.includes('dashboard'))) {
                    navigate("/dashboard");
                } else if (data.modules && data.modules.length > 0) {
                    navigate(`/${data.modules[0]}`);
                } else {
                    navigate("/dashboard");
                }
            }, 1000);
        } catch (err) {
            setIsLoading(false);
            setLoginStatus('error');
            const errorMessage = err.response?.data?.message || err.message || "Invalid Credentials";
            setError(errorMessage);
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
                        <h1>Management Portal</h1>
                    </div>

                    <form className="login-form" onSubmit={handleLogin}>
                        {loginStatus === 'error' && <div className="login-error-pill">
                            <span className="material-symbols-outlined">error</span>
                            {error}
                        </div>}
                        {loginStatus === 'success' && <div className="login-success-pill">
                            <span className="material-symbols-outlined">check_circle</span>
                            Login successful! Redirecting...
                        </div>}

                        <div className="form-group">
                            <label htmlFor="username">EMAIL ADDRESS</label>
                            <div className="input-wrapper">
                                <span className="material-symbols-outlined input-icon">mail</span>
                                <input
                                    type="text"
                                    id="username"
                                    placeholder="name@gmail.com"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">PASSWORD</label>
                            <div className="input-wrapper">
                                <span className="material-symbols-outlined input-icon">lock</span>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    placeholder="••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
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

                        <div className="login-footer">
                            <Link to="/forgot-password">Forgot password?</Link>
                        </div>

                        <button type="submit" className="login-submit" disabled={isLoading}>
                            {isLoading ? (
                                <div className="loader"></div>
                            ) : (
                                <>
                                    Login
                                    <span className="material-symbols-outlined">login</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
