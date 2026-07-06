"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, Camera, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QRScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<any[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = "qr-scanner-video";

  useEffect(() => {
    // 1. Get available cameras
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Try to select back camera by default
          const backCam = devices.find((d) =>
            d.label.toLowerCase().includes("back") ||
            d.label.toLowerCase().includes("environment") ||
            d.label.toLowerCase().includes("rear")
          );
          setActiveCameraId(backCam ? backCam.id : devices[0].id);
        } else {
          setError("ไม่พบกล้องในอุปกรณ์นี้");
        }
      })
      .catch((err) => {
        console.error("Camera access error:", err);
        setError("ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตสิทธิ์กล้องถ่ายรูป");
      });

    return () => {
      // Cleanup on unmount
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch((e) => console.error("Scanner stop error", e));
      }
    };
  }, []);

  // Start scanner when camera ID is set
  useEffect(() => {
    if (!activeCameraId) return;

    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().then(() => {
        startScanning(activeCameraId);
      });
    } else {
      startScanning(activeCameraId);
    }
  }, [activeCameraId]);

  const startScanning = (cameraId: string) => {
    setIsScanning(false);
    setError(null);

    const html5QrCode = new Html5Qrcode(containerId);
    scannerRef.current = html5QrCode;

    html5QrCode
      .start(
        cameraId,
        {
          fps: 15,
          qrbox: (width, height) => {
            const size = Math.min(width, height) * 0.7;
            return { width: size, height: size };
          },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Success
          // If code is a full classroom URL like http://.../classroom/join?code=ABCDEF, extract code
          let code = decodedText;
          try {
            if (decodedText.startsWith("http")) {
              const url = new URL(decodedText);
              const urlCode = url.searchParams.get("code");
              if (urlCode) code = urlCode;
            }
          } catch (e) {
            // Treat as raw text
          }
          
          // Stop and callback
          if (html5QrCode.isScanning) {
            html5QrCode.stop().then(() => {
              onScan(code);
            });
          } else {
            onScan(code);
          }
        },
        () => {
          // Keep scanning silently (verbose log ignored)
        }
      )
      .then(() => {
        setIsScanning(true);
      })
      .catch((err) => {
        console.error("Scanner start error:", err);
        setError("ไม่สามารถเปิดใช้งานกล้องนี้ได้");
      });
  };

  const switchCamera = () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex((c) => c.id === activeCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    setActiveCameraId(cameras[nextIndex].id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/85 dark:bg-black/85 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80">
          <div className="flex items-center gap-2">
            <Camera className="size-5 text-amber-400" />
            <span className="font-semibold text-sm">สแกนรหัส QR Code</span>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="size-8 rounded-full text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="size-4.5" />
          </Button>
        </div>

        {/* Video Area */}
        <div className="relative aspect-square w-full bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center overflow-hidden">
          <div id={containerId} className="w-full h-full object-cover [&_video]:w-full [&_video]:h-full [&_video]:object-cover" />

          {/* Scanner Overlay Line and Corners */}
          {isScanning && !error && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-[70%] h-[70%] border-2 border-dashed border-zinc-300/50 dark:border-zinc-700/50 rounded-xl flex items-center justify-center">
                {/* QR box focus frame */}
                <div className="absolute inset-0 border-2 border-amber-400 rounded-xl animate-pulse"></div>
                
                {/* Laser animation */}
                <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent top-0 animate-[scan_2.5s_ease-in-out_infinite]"></div>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-zinc-50/90 dark:bg-zinc-950/90 text-zinc-700 dark:text-zinc-300">
              <AlertCircle className="size-10 text-red-500 mb-3" />
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-1">เกิดข้อผิดพลาดในการโหลดกล้อง</p>
              <p className="text-xs text-zinc-500 max-w-[280px]">{error}</p>
            </div>
          )}

          {!isScanning && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 text-xs">
              <RefreshCw className="size-6 animate-spin text-zinc-500 mb-2" />
              กำลังเปิดกล้องถ่ายรูป...
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
            หันกล้องไปทางคิวอาร์โค้ดห้องเรียน
          </span>
          {cameras.length > 1 && (
            <Button
              onClick={switchCamera}
              variant="outline"
              size="sm"
              className="gap-1.5 h-8 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs"
            >
              <RefreshCw className="size-3.5" />
              <span>สลับกล้อง</span>
            </Button>
          )}
        </div>
      </div>

      {/* Embedded CSS for scan animation */}
      <style jsx global>{`
        @keyframes scan {
          0% { top: 15%; }
          50% { top: 85%; }
          100% { top: 15%; }
        }
      `}</style>
    </div>
  );
}
