// app/privacy/page.tsx

export default function PrivacyPage() {
  return (
    <main
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "4rem 1.5rem",
      }}
    >
      <h1
        style={{
          fontSize: "2rem",
          fontWeight: 700,
          marginBottom: "1.5rem",
        }}
      >
        Privacy Policy
      </h1>

      <p style={{ marginBottom: "1rem", lineHeight: 1.6, color: "#475569" }}>
        This Privacy Policy explains how Budget Shark ("we", "us", or "our") collects, uses,
        and protects information when you visit or use our website at thebudgetshark.com.
      </p>

      <h2
        style={{
          fontSize: "1.1rem",
          fontWeight: 600,
          marginTop: "2rem",
          marginBottom: "0.5rem",
        }}
      >
        Information we collect
      </h2>
      <p style={{ marginBottom: "1rem", lineHeight: 1.6, color: "#475569" }}>
        Right now we only collect the information you voluntarily provide, such as your email
        address when you join the waitlist.
      </p>

      <h2
        style={{
          fontSize: "1.1rem",
          fontWeight: 600,
          marginTop: "2rem",
          marginBottom: "0.5rem",
        }}
      >
        How we use it
      </h2>
      <p style={{ marginBottom: "1rem", lineHeight: 1.6, color: "#475569" }}>
        We use your email to contact you about early access, product updates, and relevant Budget
        Shark features. We do not sell your data.
      </p>

      <h2
        style={{
          fontSize: "1.1rem",
          fontWeight: 600,
          marginTop: "2rem",
          marginBottom: "0.5rem",
        }}
      >
        Contact
      </h2>
      <p style={{ marginBottom: "1rem", lineHeight: 1.6, color: "#475569" }}>
        Questions? Email us at{" "}
        <a href="mailto:support@thebudgetshark.com">support@thebudgetshark.com</a>.
      </p>
    </main>
  );
}
