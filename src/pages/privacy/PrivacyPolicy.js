import React from "react";

const PrivacyPolicy = () => {
  return (
    <div style={{
      fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
      color: "#334155",
      backgroundColor: "#f8fafc",
      minHeight: "100vh",
      padding: "40px 20px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    }}>
      <div style={{
        backgroundColor: "#ffffff",
        maxWidth: "800px",
        width: "100%",
        padding: "40px",
        borderRadius: "24px",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
        border: "1px solid #e2e8f0"
      }}>
        {/* Header / Brand */}
        <div style={{
          textAlign: "center",
          marginBottom: "32px",
          borderBottom: "1px solid #f1f5f9",
          paddingBottom: "24px"
        }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            color: "#006A4E",
            fontWeight: 800,
            fontSize: "24px",
            textTransform: "uppercase",
            letterSpacing: "1px",
            marginBottom: "8px"
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: "32px" }}>shield</span>
            AVSECO
          </div>
          <h1 style={{
            fontSize: "28px",
            fontWeight: 800,
            color: "#1e293b",
            margin: "8px 0"
          }}>Privacy Policy</h1>
          <p style={{
            color: "#64748b",
            fontSize: "14px",
            margin: 0
          }}>Last Updated: May 19, 2026</p>
        </div>

        {/* Content */}
        <div style={{
          lineHeight: "1.7",
          fontSize: "15px"
        }}>
          <p style={{ marginBottom: "20px" }}>
            Welcome to <strong>AVSECO</strong>. We respect your privacy and are committed to protecting the personal data of our users, employees, and clients. This Privacy Policy explains how we collect, use, and safeguard your information when you use our ERP system.
          </p>

          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginTop: "28px", marginBottom: "12px", borderLeft: "4px solid #006A4E", paddingLeft: "10px" }}>
            1. Information We Collect
          </h2>
          <p style={{ marginBottom: "16px" }}>
            We collect information necessary to manage our manufacturing production, stock, sales, and employee directory:
          </p>
          <ul style={{ paddingLeft: "20px", marginBottom: "20px" }}>
            <li style={{ marginBottom: "8px" }}><strong>Employee Information:</strong> Name, contact details, attendance logs, and credentials for system access.</li>
            <li style={{ marginBottom: "8px" }}><strong>Client & Transaction Data:</strong> Business names, billing information, purchase history, and delivery details.</li>
            <li style={{ marginBottom: "8px" }}><strong>System Logs:</strong> Activity logs related to production data entries and stock transfers.</li>
          </ul>

          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginTop: "28px", marginBottom: "12px", borderLeft: "4px solid #006A4E", paddingLeft: "10px" }}>
            2. How We Use Your Information
          </h2>
          <p style={{ marginBottom: "16px" }}>
            We process your personal data for the following operational purposes:
          </p>
          <ul style={{ paddingLeft: "20px", marginBottom: "20px" }}>
            <li style={{ marginBottom: "8px" }}>To run our daily production planning and stock monitoring.</li>
            <li style={{ marginBottom: "8px" }}>To compute payrolls, generate financial reports, and maintain employee attendance records.</li>
            <li style={{ marginBottom: "8px" }}>To communicate transaction updates, sales bills, and system notifications (including automated messages via WhatsApp).</li>
          </ul>

          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginTop: "28px", marginBottom: "12px", borderLeft: "4px solid #006A4E", paddingLeft: "10px" }}>
            3. WhatsApp & Communications
          </h2>
          <p style={{ marginBottom: "20px" }}>
            Our system integrates notification services to send order status, production updates, or alerts. These messages are sent strictly to authorized business contacts, clients, or employees. We do not sell or share contact numbers with third-party advertisers.
          </p>

          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginTop: "28px", marginBottom: "12px", borderLeft: "4px solid #006A4E", paddingLeft: "10px" }}>
            4. Data Security
          </h2>
          <p style={{ marginBottom: "20px" }}>
            We implement industry-standard technical and organizational measures, including secure MongoDB hosting and token-based API authentication, to prevent unauthorized access, alteration, or deletion of your data.
          </p>

          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginTop: "28px", marginBottom: "12px", borderLeft: "4px solid #006A4E", paddingLeft: "10px" }}>
            5. Contact Us
          </h2>
          <p style={{ marginBottom: "20px" }}>
            If you have questions about this Privacy Policy or our data management practices, please contact us at:
            <br />
            <strong>Email:</strong> admin@avseco.com
            <br />
            <strong>Phone:</strong> +91 9047023266
          </p>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: "center",
          marginTop: "40px",
          borderTop: "1px solid #f1f5f9",
          paddingTop: "24px",
          color: "#94a3b8",
          fontSize: "13px"
        }}>
          © {new Date().getFullYear()} AVSECO. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
