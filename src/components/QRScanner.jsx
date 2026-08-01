"use client";

import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

/**
 * Escáner de cámara. Llama a onScanSuccess(decodedText) cada vez
 * que detecta un QR válido.
 */
export default function QRScanner({ onScanSuccess, onScanError }) {
  const scannerRef = useRef(null);
  const containerId = "qr-reader-container";

  useEffect(() => {
    const html5Qrcode = new Html5Qrcode(containerId);
    scannerRef.current = html5Qrcode;

    html5Qrcode
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          onScanSuccess?.(decodedText);
        },
        () => {
          // errores de lectura frame a frame, se ignoran silenciosamente
        }
      )
      .catch((err) => {
        onScanError?.(err);
      });

    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => scannerRef.current.clear())
          .catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full max-w-sm mx-auto">
      <div id={containerId} className="rounded-xl overflow-hidden border-2 border-primary" />
    </div>
  );
}
