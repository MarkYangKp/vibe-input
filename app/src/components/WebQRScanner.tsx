import { useEffect, useRef, useState } from 'react';

interface WebQRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

/**
 * 浏览器端 QR 扫码组件
 * 使用 Web BarcodeDetector API（Chrome / Safari / Edge 支持）
 * 作为原生 Capacitor 扫码的降级方案
 */
export function WebQRScanner({ onScan, onClose }: WebQRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    let cancelled = false;

    const startScanning = async () => {
      // 检测 BarcodeDetector API 支持
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const BarcodeDetectorClass = (globalThis as any).BarcodeDetector as
        | { new (opts?: { formats?: string[] }): { detect(source: HTMLVideoElement): Promise<Array<{ rawValue: string }>> } }
        | undefined;

      if (!BarcodeDetectorClass) {
        setError('当前浏览器不支持扫码，请使用 Chrome 或 Safari 浏览器，或下载原生 APP');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });

        if (cancelled) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const detector = new BarcodeDetectorClass({ formats: ['qr_code'] });

        const detect = async () => {
          if (cancelled || !videoRef.current) return;

          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0 && !cancelled) {
              onScanRef.current(barcodes[0].rawValue);
              return;
            }
          } catch {
            // 单帧检测失败，继续下一帧
          }

          if (!cancelled) {
            animFrameRef.current = requestAnimationFrame(detect);
          }
        };

        detect();
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : String(e);
          if (msg.includes('NotAllowed') || msg.includes('Permission')) {
            setError('相机权限被拒绝，请在浏览器设置中允许访问相机');
          } else if (msg.includes('NotFound') || msg.includes('not found')) {
            setError('未找到可用的相机设备');
          } else {
            setError('无法访问相机: ' + msg);
          }
        }
      }
    };

    startScanning();

    return () => {
      cancelled = true;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  return (
    <div className="web-scanner-overlay">
      <div className="web-scanner-container">
        <div className="web-scanner-header">
          <span className="web-scanner-title">扫描二维码</span>
          <button className="web-scanner-close" onClick={onClose} aria-label="关闭">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {error ? (
          <div className="web-scanner-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="48" height="48">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <p>{error}</p>
            <button className="web-scanner-retry" onClick={onClose}>关闭</button>
          </div>
        ) : (
          <div className="web-scanner-viewport">
            <video
              ref={videoRef}
              className="web-scanner-video"
              playsInline
              muted
            />
            <div className="web-scanner-frame">
              <div className="scan-line" />
            </div>
          </div>
        )}

        {!error && <p className="web-scanner-hint">将二维码对准扫描框</p>}
      </div>
    </div>
  );
}
