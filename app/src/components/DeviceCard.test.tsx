import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DeviceCard } from './DeviceCard';

const mockDevice = {
  id: 'device_1',
  name: 'My Computer',
  ip: '192.168.1.100',
  port: 3900,
  lastConnected: Date.now() - 60000,
  isOnline: true,
};

describe('DeviceCard', () => {
  it('renders device name', () => {
    render(<DeviceCard device={mockDevice} onClick={() => {}} />);
    expect(screen.getByText('My Computer')).toBeInTheDocument();
  });

  it('renders device IP and port', () => {
    render(<DeviceCard device={mockDevice} onClick={() => {}} />);
    expect(screen.getByText('192.168.1.100:3900')).toBeInTheDocument();
  });

  it('shows online status when device is online', () => {
    render(<DeviceCard device={mockDevice} onClick={() => {}} />);
    const statusDot = document.querySelector('.status-dot');
    expect(statusDot).toHaveClass('online');
  });

  it('shows offline status when device is offline', () => {
    const offlineDevice = { ...mockDevice, isOnline: false };
    render(<DeviceCard device={offlineDevice} onClick={() => {}} />);
    const statusDot = document.querySelector('.status-dot');
    expect(statusDot).toHaveClass('offline');
  });

  it('shows correct time for recent connection', () => {
    const recentDevice = { ...mockDevice, lastConnected: Date.now() - 30000 };
    render(<DeviceCard device={recentDevice} onClick={() => {}} />);
    expect(screen.getByText('刚刚')).toBeInTheDocument();
  });

  it('shows minutes ago for connection within hour', () => {
    const minutesAgo = Date.now() - 5 * 60000;
    const device = { ...mockDevice, lastConnected: minutesAgo };
    render(<DeviceCard device={device} onClick={() => {}} />);
    expect(screen.getByText('5 分钟前')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<DeviceCard device={mockDevice} onClick={handleClick} />);
    const card = document.querySelector('.device-card') as HTMLElement | null;
    card?.click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
