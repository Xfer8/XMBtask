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
    <div style={{ backgroundColor: "#2A2A2A", minHeight: "100vh", color: "white" }}>
      {/* This is the "slot" where your Builder designs will appear */}
      <BuilderComponent model="page" content={content} />
      
      {/* If Builder is empty, show a fallback message */}
      {!content && (
        <div style={{ padding: "50px", textAlign: "center" }}>
          <h1>Design is empty!</h1>
          <p>Go to Builder.io and drag some blocks here.</p>
        </div>
      )}
    </div>
  );
}