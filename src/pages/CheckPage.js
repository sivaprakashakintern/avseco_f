import React, { useState, useEffect } from "react";
import { healthApi } from "../utils/api.js";
import "./CheckPage.css";

const CheckPage = () => {
    const [connectionStatus, setConnectionStatus] = useState("checking"); // checking, connected, error
    const [dbStatus, setDbStatus] = useState("unknown");
    const [errorMessage, setErrorMessage] = useState("");
    const [lastChecked, setLastChecked] = useState(null);

    const checkConnection = async () => {
        setConnectionStatus("checking");
        setErrorMessage("");

        try {
            const data = await healthApi.check();
            if (data.status === 'healthy') {
                setConnectionStatus("connected");
                setDbStatus(data.database || "connected");
            } else {
                setConnectionStatus("error");
                setErrorMessage("Backend reported an unhealthy status.");
            }
        } catch (error) {
            setConnectionStatus("error");
            setErrorMessage("Failed to connect to the server. Please check if the backend is running and verify your network connection.");
            setDbStatus("disconnected");
        } finally {
            setLastChecked(new Date());
        }
    };

    useEffect(() => {
        checkConnection();
        // Auto-check every 60 seconds
        const interval = setInterval(checkConnection, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="check-page-container">
            <div className="check-card">
                <header className="check-header">
                    <h1 className="check-title">System Status Check</h1>
                    <p className="check-subtitle">Real-time connection monitoring for database & API</p>
                </header>

                <div className="status-indicator-wrapper">
                    {connectionStatus === "checking" && (
                        <div className="status-animation checking">
                            <span className="material-symbols-outlined spin">sync</span>
                            <p>Establishing Connection...</p>
                        </div>
                    )}

                    {connectionStatus === "connected" && (
                        <div className="status-animation connected">
                            <div className="pulse-ring green"></div>
                            <span className="material-symbols-outlined icon-large">check_circle</span>
                            <h2>Fully Connected</h2>
                            <p className="status-text">Your system is optimally connected to the cloud infrastructure.</p>
                            
                            <div className="status-details-grid">
                                <div className="detail-item">
                                    <span className="detail-label">Backend API</span>
                                    <span className="detail-value success">Active</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Database</span>
                                    <span className="detail-value success">{dbStatus.toUpperCase()}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {connectionStatus === "error" && (
                        <div className="status-animation error">
                            <div className="pulse-ring red"></div>
                            <span className="material-symbols-outlined icon-large">error</span>
                            <h2>Connection Failed</h2>
                            <p className="error-text">{errorMessage}</p>
                            
                            <div className="status-details-grid">
                                <div className="detail-item">
                                    <span className="detail-label">Backend API</span>
                                    <span className="detail-value error">Unreachable</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Database</span>
                                    <span className="detail-value error">OFFLINE</span>
                                </div>
                            </div>

                            <button className="retry-btn" onClick={checkConnection}>
                                <span className="material-symbols-outlined">refresh</span>
                                Retry System Check
                            </button>
                        </div>
                    )}
                </div>

                {lastChecked && (
                    <div className="last-checked">
                        <span className="material-symbols-outlined">schedule</span>
                        Last verified at: {lastChecked.toLocaleTimeString()}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CheckPage;
