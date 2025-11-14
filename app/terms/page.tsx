// app/terms/page.tsx

export default function TermsPage() {
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
        Terms of Use
      </h1>

      <p style={{ marginBottom: "1rem", lineHeight: 1.6, color: "#475569" }}>
        These Terms of Use ("Terms") govern your access to and use of Budget Shark and any related
        services.
      </p>

      <h2
        style={{
          fontSize: "1.1rem",
          fontWeight: 600,
          marginTop: "2rem",
          marginBottom: "0.5rem",
        }}
      >
        Use of the site
      </h2>
      <p style={{ marginBottom: "1rem", lineHeight: 1.6, color: "#475569" }}>
        You agree to use thebudgetshark.com only for lawful purposes and in a way that does not
        infringe on the rights of others or restrict their use of the site.
      </p>

      <h2
        style={{
          fontSize: "1.1rem",
          fontWeight: 600,
          marginTop: "2rem",
          marginBottom: "0.5rem",
        }}
      >
        No warranties
      </h2>
      <p style={{ marginBottom: "1rem", lineHeight: 1.6, color: "#475569" }}>
        Budget Shark is currently a pre-release product. We provide the site "as is" without
        warranties of any kind.
      </p>

      <h2
        style={{
          fontSize: "1.1rem",
          fontWeight: 600,
          marginTop: "2rem",
          marginBottom: "0.5rem",
        }}
      >
        Limitation of liability
      </h2>
      <p style={{ marginBottom: "1rem", lineHeight: 1.6, color: "#475569" }}>
        To the fullest extent permitted by law, Budget Shark and its operators will not be liable
        for any indirect, incidental, or consequential damages arising from use of the site.
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
        For questions about these Terms, contact{" "}
        <a href="mailto:support@thebudgetshark.com">support@thebudgetshark.com</a>.
      </p>
    </main>
  );
}
