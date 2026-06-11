import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';

export function SettingsPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  return (
    <div className="page" id="settingsPage">
      <div className="top-bar">
        <button className="back-btn" onClick={() => navigate('/')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          <span>返回</span>
        </button>
        <span className="page-title">设置</span>
        <div className="top-bar-spacer"></div>
      </div>

      <div className="settings-content">
        <div className="settings-section">
          <h3>外观</h3>
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-label">深色模式</span>
              <span className="setting-desc">跟随系统或手动切换</span>
            </div>
            <select 
              value={theme} 
              onChange={(e) => setTheme(e.target.value as 'system' | 'light' | 'dark')}
              className="theme-select"
            >
              <option value="system">跟随系统</option>
              <option value="light">浅色</option>
              <option value="dark">深色</option>
            </select>
          </div>
        </div>

        <div className="settings-section">
          <h3>关于</h3>
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-label">版本</span>
              <span className="setting-desc">2.0.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
