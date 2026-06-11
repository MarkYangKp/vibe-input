import type { Device } from '../../../shared/types';

interface DeviceCardProps {
  device: Device;
  onClick: () => void;
}

function formatLastConnected(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  return `${Math.floor(diff / 86400000)} 天前`;
}

export function DeviceCard({ device, onClick }: DeviceCardProps) {
  return (
    <div className="device-card" onClick={onClick}>
      <div className="device-info">
        <span className="device-name">{device.name}</span>
        <span className="device-meta">{device.ip}:{device.port}</span>
      </div>
      <div className="device-status">
        <span className={`status-dot ${device.isOnline ? 'online' : 'offline'}`}></span>
        <span className="last-connected">{formatLastConnected(device.lastConnected)}</span>
      </div>
    </div>
  );
}
