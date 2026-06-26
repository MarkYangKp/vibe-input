import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDevices } from '../hooks/useDevices';
import { useApi } from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import { useAppContext } from '../store/AppContext';
import { saveSettings } from '../services/storage';
import { PreviewOverlay } from '../components/PreviewOverlay';

export function InputPage() {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();
  const { devices, removeDevice } = useDevices();
  const { sendText, polishText, getConfig } = useApi();
  const { showToast } = useToast();
  const { state, dispatch } = useAppContext();

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [polishedText, setPolishedText] = useState('');
  const [originalText, setOriginalText] = useState('');

  const device = devices.find(d => d.id === deviceId);
  const aiEnabled = state.settings.llmEnabled;
  const aiAvailable = state.llmConfigured;

  // Check LLM config on mount
  useEffect(() => {
    if (!device) return;
    getConfig(device).then(result => {
      if (result.ok && result.data) {
        dispatch({ type: 'SET_LLM_CONFIGURED', payload: result.data.llm.configured });
      }
    });
  }, [device, getConfig, dispatch]);

  useEffect(() => {
    if (!device && deviceId) {
      showToast('设备不存在', 'error');
      navigate('/');
    }
  }, [device, deviceId, navigate, showToast]);

  const handleToggleAi = useCallback(async () => {
    const newValue = !aiEnabled;
    if (newValue && !aiAvailable) {
      showToast('请先在电脑端配置 LLM API Key', 'error');
      return;
    }
    await saveSettings({ llmEnabled: newValue });
    dispatch({ type: 'SET_SETTINGS', payload: { llmEnabled: newValue } });
  }, [aiEnabled, aiAvailable, dispatch, showToast]);

  const handleSend = useCallback(async () => {
    if (!device || !text.trim() || sending) return;

    // If AI is enabled, polish first
    if (aiEnabled) {
      setSending(true);
      setOriginalText(text.trim());
      try {
        const result = await polishText(device, text.trim());
        if (result.ok && result.text) {
          setPolishedText(result.text);
          setShowPreview(true);
        }
      } finally {
        setSending(false);
      }
      return;
    }

    // Direct send
    setSending(true);
    setSent(false);
    try {
      const result = await sendText(device, text.trim());
      if (result.ok) {
        setSent(true);
        setText('');
        setTimeout(() => setSent(false), 2000);
      }
    } catch {
      showToast('发送失败', 'error');
    } finally {
      setSending(false);
    }
  }, [device, text, sending, aiEnabled, sendText, polishText, showToast]);

  const handleConfirmPolish = useCallback(async (editedText: string) => {
    setShowPreview(false);
    if (!device) return;

    setSending(true);
    try {
      const result = await sendText(device, editedText);
      if (result.ok) {
        setSent(true);
        setText('');
        setTimeout(() => setSent(false), 2000);
      }
    } catch {
      showToast('发送失败', 'error');
    } finally {
      setSending(false);
    }
  }, [device, sendText, showToast]);

  const handleDelete = useCallback(async () => {
    if (!deviceId) return;
    if (window.confirm('确定删除此设备？')) {
      await removeDevice(deviceId);
      showToast('设备已删除', 'success');
      navigate('/');
    }
  }, [deviceId, removeDevice, navigate, showToast]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  if (!device) return null;

  const charCount = text.length;

  return (
    <div className="page" id="inputPage">
      <div className="top-bar">
        <button className="back-btn" onClick={() => navigate('/')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          <span>设备</span>
        </button>
        <div className="device-info">
          <span className="device-name">{device.name}</span>
          <span className="device-status">
            {device.isOnline ? '● 在线' : '○ 离线'}
          </span>
        </div>
        <button className="icon-btn" onClick={handleDelete} aria-label="删除设备">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>

      <section className="editor">
        <div className="editor-header">
          <span className="editor-label">语音转文字</span>
        </div>
        <div className="editor-area">
          <textarea
            id="input"
            placeholder="在此输入文字，或点击键盘上的语音按钮..."
            autoComplete="off"
            autoCapitalize="sentences"
            spellCheck={false}
            enterKeyHint="send"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="bottom-bar">
          <div className="bottom-left">
            <span className="char-count">{charCount}</span>
              <button
                type="button"
                className={`ai-toggle ${aiEnabled ? 'active' : ''} ${!aiAvailable ? 'disabled' : ''}`}
                onClick={handleToggleAi}
                title={!aiAvailable ? '请先在电脑端配置 LLM' : aiEnabled ? 'AI 整理已开启' : 'AI 整理已关闭'}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l1.09 3.36L16.18 6l-2.72 2.18L14.36 12 12 9.82 9.64 12l.9-3.82L7.82 6l3.09-.64L12 2z"/>
                  <path d="M5 16l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z"/>
                  <path d="M19 16l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z"/>
                </svg>
                <span>AI</span>
              </button>
          </div>
          <div className="bottom-actions">
            <button type="button" className="icon-btn" onClick={() => setText('')} title="清空">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"/>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
              </svg>
            </button>
            <button
              type="button"
              className={`send-btn ${sent ? 'success' : ''} ${aiEnabled ? 'ai-mode' : ''}`}
              onClick={handleSend}
              disabled={!text.trim() || sending}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              <span>{sending ? '发送中...' : sent ? '已发送' : aiEnabled ? 'AI 发送' : '发送'}</span>
            </button>
          </div>
        </div>
      </section>

      <p className="hint mobile-hint">点击发送按钮或使用键盘发送</p>
      <p className="hint desktop-hint"><kbd>Ctrl</kbd> + <kbd>Enter</kbd> 快捷发送</p>

      {showPreview && (
        <PreviewOverlay
          originalText={originalText}
          polishedText={polishedText}
          onConfirm={handleConfirmPolish}
          onCancel={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
