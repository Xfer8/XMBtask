import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import RequestAccessModal from "../components/RequestAccessModal";

export default function Login() {
  const { signInWithGoogle, error, accessDenied, deniedUser } = useAuth();
  const [showRequestModal, setShowRequestModal] = useState(false);

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      minHeight: "100vh", backgroundColor: "#212121",
      gap: "24px",
    }}>
      {/* Logo */}
      <div style={{ fontSize: "28px", fontWeight: 700, letterSpacing: "-0.5px" }}>
        <span style={{ color: "#4ADE80" }}>XMB</span>
        <span style={{ color: "#f0f0f0" }}>task</span>
      </div>

      {/* Card */}
      <div style={{
        background: "#2a2a2a", border: "1px solid #444450",
        borderRadius: "14px", padding: "32px 36px",
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: "20px", width: "320px",
        boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
      }}>
        {accessDenied ? (
          <>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "16px", fontWeight: 600, color: "#f0f0f0", marginBottom: "6px" }}>
                Access denied
              </div>
              <div style={{ fontSize: "13px", color: "#888890", lineHeight: 1.6 }}>
                Your account isn't on the access list. Contact the app owner to request access.
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
              <button onClick={signInWithGoogle} style={{
                background: "none", border: "1px solid #3a3a3a", borderRadius: "8px",
                cursor: "pointer", padding: "10px 20px",
                fontSize: "13px", color: "#888890",
                fontFamily: "inherit", width: "100%",
              }}>
                Try a different account
              </button>
              <button onClick={() => setShowRequestModal(true)} style={{
                background: "#4ADE80", border: "none", borderRadius: "8px",
                cursor: "pointer", padding: "10px 20px",
                fontSize: "13px", fontWeight: 700, color: "#0a1a0f",
                fontFamily: "inherit", width: "100%",
              }}>
                Request access
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "16px", fontWeight: 600, color: "#f0f0f0", marginBottom: "6px" }}>
                Sign in to continue
              </div>
              <div style={{ fontSize: "13px", color: "#888890" }}>
                Use your Google account to access XMBtask.
              </div>
            </div>
            <button onClick={signInWithGoogle} style={{
              display: "flex", alignItems: "center", gap: "10px",
              background: "#f0f0f0", border: "none", borderRadius: "8px",
              cursor: "pointer", padding: "10px 20px",
              fontSize: "14px", fontWeight: 600, color: "#1a1a1a",
              fontFamily: "inherit", width: "100%", justifyContent: "center",
            }}>
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
              Sign in with Google
            </button>
          </>
        )}

        {error && (
          <div style={{ fontSize: "12px", color: "#FF6B6B", textAlign: "center" }}>
            {error}
          </div>
        )}
      </div>

      {showRequestModal && (
        <RequestAccessModal
          initialEmail={deniedUser?.email ?? ""}
          initialName={deniedUser?.name ?? ""}
          onClose={() => setShowRequestModal(false)}
        />
      )}
    </div>
  );
}
