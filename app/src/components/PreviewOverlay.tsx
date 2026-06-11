import { useState } from 'react';

interface PreviewOverlayProps {
  originalText: string;
  polishedText: string;
  onConfirm: (text: string) => void;
  onCancel: () => void;
}

export function PreviewOverlay({ originalText, polishedText, onConfirm, onCancel }: PreviewOverlayProps) {
  const [editedText, setEditedText] = useState(polishedText);

  return (
    <div className="preview-overlay" id="previewOverlay">
      <div className="preview-nav">
        <span className="preview-nav-title">
          <span className="ai-dot"></span>
          AI 整理结果
        </span>
        <button type="button" className="preview-nav-close" onClick={onCancel} aria-label="关闭">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div className="preview-body">
        <div className="preview-section">
          <span className="preview-section-label">原文</span>
          <div className="preview-original">{originalText}</div>
        </div>
        <div className="preview-section preview-section-editable">
          <span className="preview-section-label">整理后（可编辑）</span>
          <textarea 
            className="preview-polished" 
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
          />
        </div>
      </div>
      <div className="preview-footer">
        <button type="button" className="preview-cancel" onClick={onCancel}>取消</button>
        <button type="button" className="preview-send" onClick={() => onConfirm(editedText)}>确认发送</button>
      </div>
    </div>
  );
}
