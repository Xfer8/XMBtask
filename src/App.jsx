import { useEffect, useState } from "react";
import { BuilderComponent, builder } from "@builder.io/react";
import './App.css';

// Put your Public API Key from Builder Space Settings here
builder.init("76d30dc4efc8465aa381751038fbe946");

export default function App() {
  const [content, setContent] = useState(null);

  useEffect(() => {
    // This tells Builder to look for a "page" model
    builder.get("page", { url: window.location.pathname })
      .promise().then(setContent);
  }, []);

  return (
    <div style={{ display: "flex", justifyContent: "center", minHeight: "100vh", backgroundColor: "#2A2A2A" }}>
      <div style={{ width: "100%", maxWidth: "760px", minWidth: "760px", display: "flex", flexDirection: "column", color: "white" }}>
        {/* Persistent title bar */}
        <div style={{ padding: "20px 50px", display: "flex", justifyContent: "flex-end", borderBottom: "1px solid #444" }}>
          <div style={{ fontSize: "18px", fontWeight: "bold" }}>XMBtask</div>
        </div>

        {/* Content area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "center", overflow: "auto" }}>
          {/* This is the "slot" where your Builder designs will appear */}
          <BuilderComponent model="page" content={content} />

          {/* If Builder is empty, show a fallback message */}
          {!content && (
            <div style={{ padding: "50px", textAlign: "center", width: "700px" }}>
              <div style={{ display: "flex", flexDirection: "column", position: "relative", marginTop: "20px", height: "auto", alignSelf: "start" }}>
              </div>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", position: "relative", marginTop: "20px", height: "200px" }} />
        </div>
      </div>
    </div>
  );
}
