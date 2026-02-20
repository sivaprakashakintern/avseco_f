import React, { useState, useEffect } from "react";
import "./CheckPage.css";

const CheckPage = () => {
    const [connectionStatus, setConnectionStatus] = useState("checking"); // checking, connected, error
    const [errorMessage, setErrorMessage] = useState("");
    const [lastChecked, setLastChecked] = useState(null);

    const checkConnection = () => {
        setConnectionStatus("checking");
        setErrorMessage("");

        // Simulate API connection check
        setTimeout(() => {
            // For demonstration, we'll assume it succeeds most of the time
            // unless we want to simulate an error.
            // Let's use random for now, or just success as default.
            const isSuccess = Math.random() > 0.1;

            if (isSuccess) {
                setConnectionStatus("connected");
            } else {
                setConnectionStatus("error");
                setErrorMessage("Failed to connect to the server. Please check your internet connection or contact support.");
            }
            setLastChecked(new Date());
        }, 1500);
    };

    useEffect(() => {
        checkConnection();

        // Auto-check every 30 seconds
        const interval = setInterval(checkConnection, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="check-page-container">
            <div className="check-card">
                <h1 className="check-title">System Status Check</h1>

                <div className="status-indicator-wrapper">
                    {connectionStatus === "checking" && (
                        <div className="status-animation checking">
                            <span className="material-symbols-outlined spin">sync</span>
                            <p>Checking Connection...</p>
                        </div>
                    )}

                    {connectionStatus === "connected" && (
                        <div className="status-animation connected">
                            <div className="pulse-ring green"></div>
                            <span className="material-symbols-outlined icon-large">check_circle</span>
                            <h2>System Connected</h2>
                            <p className="status-text">All systems are operational.</p>
                        </div>
                    )}

                    {connectionStatus === "error" && (
                        <div className="status-animation error">
                            <div className="pulse-ring red"></div>
                            <span className="material-symbols-outlined icon-large">error</span>
                            <h2>Connection Failed</h2>
                            <p className="error-text">{errorMessage}</p>
                            <button className="retry-btn" onClick={checkConnection}>
                                <span className="material-symbols-outlined">refresh</span>
                                Retry Connection
                            </button>
                        </div>
                    )}
                </div>

                {lastChecked && (
                    <div className="last-checked">
                        Last checked: {lastChecked.toLocaleTimeString()}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CheckPage;
