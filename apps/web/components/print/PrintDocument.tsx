"use client";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

/**
 * PrintDocument — renders content in a portal attached directly to <body>
 * so that @media print CSS can cleanly show only the print content.
 *
 * How it works:
 *  1. Mounts a <div id="__print_root"> directly on <body>
 *  2. Adds class "printing" to <body>
 *  3. CSS hides body > *:not(#__print_root) when .printing is active
 *  4. Calls window.print() after a short delay
 *  5. Cleans up on unmount
 */
export function PrintDocument({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  const portalRef = useRef<HTMLDivElement | null>(null);

  if (!portalRef.current && typeof document !== "undefined") {
    // Create or reuse the print root div
    let el = document.getElementById("__print_root") as HTMLDivElement | null;
    if (!el) {
      el = document.createElement("div");
      el.id = "__print_root";
      document.body.appendChild(el);
    }
    portalRef.current = el;
  }

  useEffect(() => {
    // Add printing class to body — CSS will hide everything else
    document.body.classList.add("printing");

    // Give React one tick to fully render into the portal, then print
    const t = setTimeout(() => {
      window.print();
      // After print dialog closes, clean up
      cleanup();
    }, 250);

    function cleanup() {
      document.body.classList.remove("printing");
      onClose();
    }

    // Also clean up if the browser fires afterprint
    window.addEventListener("afterprint", cleanup, { once: true });

    return () => {
      clearTimeout(t);
      window.removeEventListener("afterprint", cleanup);
      document.body.classList.remove("printing");
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!portalRef.current) return null;
  return createPortal(
    <div style={{ fontFamily: "'IBM Plex Sans', Arial, sans-serif", padding: "0", margin: "0" }}>
      {children}
    </div>,
    portalRef.current
  );
}

/** Standard company letterhead for all printed documents */
export function PrintHeader({
  title,
  docNumber,
  status,
}: {
  title: string;
  docNumber: string;
  status?: string;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px", paddingBottom: "20px", borderBottom: "2px solid #1a1a1a" }}>
      <div>
        <div style={{ fontSize: "22px", fontWeight: "700", color: "#111", letterSpacing: "-0.5px" }}>Urban Furniture</div>
        <div style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>ERP Accounting System</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: "18px", fontWeight: "700", color: "#111", textTransform: "uppercase", letterSpacing: "2px" }}>{title}</div>
        <div style={{ fontSize: "15px", fontFamily: "monospace", color: "#444", marginTop: "4px" }}>{docNumber}</div>
        {status && (
          <div style={{ marginTop: "8px", display: "inline-block", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", border: "1px solid #333", padding: "2px 8px", borderRadius: "3px" }}>
            {status}
          </div>
        )}
      </div>
    </div>
  );
}

/** Two-column metadata rows */
export function PrintMeta({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 48px", marginBottom: "28px", fontSize: "12px" }}>
      {rows.map((r) => (
        <div key={r.label} style={{ display: "flex", gap: "8px" }}>
          <span style={{ color: "#666", minWidth: "90px", flexShrink: 0 }}>{r.label}:</span>
          <span style={{ fontWeight: "600", color: "#111" }}>{r.value || "—"}</span>
        </div>
      ))}
    </div>
  );
}

/** Lines table for invoices / bills / orders */
export function PrintLinesTable({
  lines,
  subtotal,
  tax,
  total,
}: {
  lines: { description: string; qty: number; price: number; subtotal: number }[];
  subtotal: number;
  tax: number;
  total: number;
}) {
  const fmt = (n: number) =>
    "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const tdStyle = (right = false): React.CSSProperties => ({
    padding: "7px 10px",
    border: "0.5pt solid #c0c0c0",
    fontSize: "11px",
    textAlign: right ? "right" : "left",
  });
  const thStyle = (right = false): React.CSSProperties => ({
    ...tdStyle(right),
    backgroundColor: "#f0f0f0",
    fontWeight: "700",
    fontSize: "10px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  });

  return (
    <div style={{ marginBottom: "24px" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={thStyle()}>Description / Product</th>
            <th style={{ ...thStyle(true), width: "60px" }}>Qty</th>
            <th style={{ ...thStyle(true), width: "110px" }}>Unit Price</th>
            <th style={{ ...thStyle(true), width: "110px" }}>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, i) => (
            <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#fafafa" }}>
              <td style={tdStyle()}>{line.description}</td>
              <td style={tdStyle(true)}>{line.qty}</td>
              <td style={tdStyle(true)}>{fmt(line.price)}</td>
              <td style={{ ...tdStyle(true), fontWeight: "600" }}>{fmt(line.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
        <div style={{ width: "220px", fontSize: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "0.5pt solid #ddd" }}>
            <span style={{ color: "#666" }}>Subtotal</span>
            <span>{fmt(subtotal)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "0.5pt solid #ddd" }}>
            <span style={{ color: "#666" }}>Tax</span>
            <span>{fmt(tax)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "2pt solid #111", fontWeight: "700", fontSize: "14px", marginTop: "4px" }}>
            <span>Total</span>
            <span>{fmt(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Footer for printed documents */
export function PrintFooter({ note }: { note?: string }) {
  return (
    <div style={{ marginTop: "48px", paddingTop: "16px", borderTop: "0.5pt solid #ccc", fontSize: "10px", color: "#888", display: "flex", justifyContent: "space-between" }}>
      <span>{note || "Thank you for your business."}</span>
      <span>Printed: {new Date().toLocaleString("en-IN")}</span>
    </div>
  );
}
