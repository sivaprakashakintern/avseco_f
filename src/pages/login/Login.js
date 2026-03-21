import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.js";
import axios from '../../utils/axiosConfig.js';
import logo from "../../assets/avs.png";
import bgImage from "../../assets/bg1.png";
import "./Login.css";

const Login = () => {
    const navigate = useNavigate();
    const { login, employee } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const data = await login(username, password);
            setIsLoading(false);
            
            // Redirect based on access
            if (data.role === 'admin' || (data.modules && data.modules.includes('dashboard'))) {
                navigate("/dashboard");
            } else if (data.modules && data.modules.length > 0) {
                // Navigate to first allowed module
                navigate(`/${data.modules[0]}`);
            } else {
                navigate("/dashboard");
            }
        } catch (err) {
            setIsLoading(false);
            const errorMessage = err.response?.data?.message || err.message || "Invalid Credentials";
            setError(errorMessage);
        }
    };

    return (
        <div className="login-page" style={{
            backgroundImage: `linear-gradient(180deg, rgba(0, 31, 23, 0.4) 0%, rgba(0, 15, 10, 0.75) 100%), url(${bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
        }}>
            <div className="login-container">
                <div className="login-card">
                    <div className="login-header">
                        <div className="logo-section">
                            <img src={logo} alt="AVSECO Logo" className="login-logo" />
                        </div>
                        <h1>Management Portal</h1>
                    </div>

                    <form className="login-form" onSubmit={handleLogin}>
                        {error && <div className="login-error">{error}</div>}

                        <div className="form-group">
                            <label htmlFor="username">Username</label>
                            <div className="input-wrapper">
                                <span className="material-symbols-outlined input-icon">person</span>
                                <input
                                    type="text"
                                    id="username"
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <div className="input-wrapper">
                                <span className="material-symbols-outlined input-icon">lock</span>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    placeholder="••••••••"
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
