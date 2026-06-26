import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { useDevices } from '../hooks/useDevices';
import { useToast } from '../hooks/useToast';
import { testConnection } from '../services/api';
import { WebQRScanner } from '../components/WebQRScanner';
import type { Device } from '../../../shared/types';

export function AddDevicePage() {
  const navigate = useNavigate();
  const { addDevice } = useDevices();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'scan' | 'manual'>('manual');
  const [name, setName] = useState('');
  const [ip, setIp] = useState('');
  const [port, setPort] = useState('3900');
  const [token, setToken] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [adding, setAdding] = useState(false);
  const [webScannerOpen, setWebScannerOpen] = useState(false);

  const handleScanResult = useCallback((rawValue: string) => {
    try {
      const data = JSON.parse(rawValue);
      if (data.type === 'vibe-input' && data.ip && data.port) {
        setIp(data.ip);
        setPort(String(data.port));
        if (data.name) setName(data.name);
        if (data.token) setToken(data.token);
        setActiveTab('manual');
        showToast('二维码扫描成功', 'success');
      } else {
        showToast('无效的二维码格式', 'error');
      }
    } catch {
      showToast('二维码内容无法解析', 'error');
    }
  }, [showToast]);

  const handleNativeScan = async () => {
    try {
      const { BarcodeScanner, BarcodeFormat } = await import('@capacitor-mlkit/barcode-scanning');

      const permission = await BarcodeScanner.requestPermissions();
      if (permission.camera !== 'granted' && permission.camera !== 'limited') {
        showToast('需要相机权限才能扫码', 'error');
        return;
      }

      const result = await BarcodeScanner.scan({
        formats: [BarcodeFormat.QrCode],
      });

      const barcode = result.barcodes[0];
      if (!barcode) {
        showToast('未识别到二维码', 'error');
        return;
      }

      handleScanResult(barcode.displayValue);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('cancelled') || msg.includes('canceled')) {
        return;
      }
      showToast('扫码失败: ' + msg, 'error');
    }
  };

  const handleScan = async () => {
    if (Capacitor.isNativePlatform()) {
      await handleNativeScan();
    } else {
      setWebScannerOpen(true);
    }
  };

  const handleTestConnection = async () => {
    if (!ip.trim()) {
      showToast('请输入IP地址', 'error');
      return;
    }
    const portNum = parseInt(port, 10);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      showToast('端口范围 1-65535', 'error');
      return;
    }

    setTesting(true);
    setTestResult(null);
    try {
      const testDevice: Device = {
        id: 'test',
        name: 'test',
        ip: ip.trim(),
        port: portNum,
        token: token.trim() || undefined,
        lastConnected: 0,
        isOnline: false,
      };
      const result = await testConnection(testDevice);
      setTestResult(result.ok ? 'success' : 'error');
      if (!result.ok) {
        showToast(result.error || '连接失败', 'error');
      }
    } catch {
      setTestResult('error');
      showToast('连接测试失败', 'error');
    } finally {
      setTesting(false);
    }
  };

  const handleAddDevice = async () => {
    if (!ip.trim()) {
      showToast('请输入IP地址', 'error');
      return;
    }
    const portNum = parseInt(port, 10);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      showToast('端口范围 1-65535', 'error');
      return;
    }

    setAdding(true);
    try {
      const device: Device = {
        id: `device_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        name: name.trim() || `设备 (${ip.trim()})`,
        ip: ip.trim(),
        port: portNum,
        token: token.trim() || undefined,
        lastConnected: Date.now(),
        isOnline: false,
      };
      await addDevice(device);
      showToast('设备已添加', 'success');
      navigate('/');
    } catch {
      showToast('添加失败', 'error');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="page" id="addDevicePage">
      <div className="top-bar">
        <button className="back-btn" onClick={() => navigate('/')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          <span>返回</span>
        </button>
        <span className="page-title">添加设备</span>
        <div className="top-bar-spacer"></div>
      </div>

      <div className="add-device-content">
        <div className="add-method-tabs">
          <button 
            className={`tab-btn ${activeTab === 'scan' ? 'active' : ''}`}
            onClick={() => setActiveTab('scan')}
          >
            扫码添加
          </button>
          <button 
            className={`tab-btn ${activeTab === 'manual' ? 'active' : ''}`}
            onClick={() => setActiveTab('manual')}
          >
            手动输入
          </button>
        </div>

        <div className="add-method-content">
          {activeTab === 'scan' ? (
            <div className="method-panel active" id="scanPanel">
              <div className="scan-area">
                <div className="scan-frame">
                  <div className="scan-line"></div>
                </div>
                <p className="scan-hint">扫描电脑端显示的二维码</p>
              </div>
              <button className="scan-btn" onClick={handleScan}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                <span>打开摄像头</span>
              </button>
            </div>
          ) : (
            <div className="method-panel active" id="manualPanel">
              <div className="form-group">
                <label htmlFor="deviceName">设备名称</label>
                <input 
                  type="text" 
                  id="deviceName" 
                  placeholder="例如：我的电脑" 
                  autoComplete="off"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="deviceIp">IP 地址</label>
                <input 
                  type="text" 
                  id="deviceIp" 
                  placeholder="192.168.1.100" 
                  autoComplete="off"
                  value={ip}
                  onChange={(e) => setIp(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="devicePort">端口号</label>
                <input
                  type="number"
                  id="devicePort"
                  placeholder="3900"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="form-group">
                <label htmlFor="deviceToken">配对码（服务器启动时显示）</label>
                <input
                  type="text"
                  id="deviceToken"
                  placeholder="输入终端显示的6位配对码"
                  autoComplete="off"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
              </div>
              <button
                className={`test-connection-btn ${testResult === 'success' ? 'success' : testResult === 'error' ? 'error' : ''}`}
                onClick={handleTestConnection}
                disabled={testing}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <span>{testing ? '测试中...' : testResult === 'success' ? '连接成功' : '测试连接'}</span>
              </button>
              <button 
                className="add-device-submit-btn"
                onClick={handleAddDevice}
                disabled={adding}
              >
                <span>{adding ? '添加中...' : '添加设备'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
      {webScannerOpen && (
        <WebQRScanner
          onScan={(data) => {
            setWebScannerOpen(false);
            handleScanResult(data);
          }}
          onClose={() => setWebScannerOpen(false)}
        />
      )}
    </div>
  );
}
