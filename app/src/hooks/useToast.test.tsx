import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast } from './useToast';
import { AppProvider } from '../store/AppContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AppProvider>{children}</AppProvider>
);

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('initially has no toast', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    expect(result.current.toast).toBeNull();
  });

  it('shows toast with message', () => {
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.showToast('Test message', 'success');
    });

    expect(result.current.toast).toEqual({
      message: 'Test message',
      type: 'success',
    });
  });

  it('hides toast after 3 seconds', () => {
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.showToast('Test message');
    });

    expect(result.current.toast).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.toast).toBeNull();
  });

  it('hideToast clears toast immediately', () => {
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.showToast('Test message');
    });

    expect(result.current.toast).not.toBeNull();

    act(() => {
      result.current.hideToast();
    });

    expect(result.current.toast).toBeNull();
  });

  it('defaults to info type', () => {
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.showToast('Info message');
    });

    expect(result.current.toast?.type).toBe('info');
  });
});
