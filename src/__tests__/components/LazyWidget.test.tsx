/**
 * Vitest Component Test: LazyWidget
 * 
 * Testet Intersection Observer Lazy Loading.
 * Kann in Lovable/Browser ausgeführt werden.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { act } from 'react';
import { LazyWidget } from '@/components/common/lazy-widget';

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
const mockDisconnect = vi.fn();
const mockObserve = vi.fn();

beforeEach(() => {
  mockIntersectionObserver.mockImplementation((callback) => ({
    observe: mockObserve,
    disconnect: mockDisconnect,
    unobserve: vi.fn(),
  }));
  
  vi.stubGlobal('IntersectionObserver', mockIntersectionObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('LazyWidget', () => {
  it('sollte Skeleton anzeigen wenn nicht sichtbar', () => {
    const { queryByTestId } = render(
      <LazyWidget>
        <div data-testid="child-content">Loaded Content</div>
      </LazyWidget>
    );
    
    // Skeleton sollte sichtbar sein
    expect(queryByTestId('child-content')).toBeNull();
  });

  it('sollte Children anzeigen wenn sichtbar', async () => {
    // Simulate intersection
    mockIntersectionObserver.mockImplementation((callback) => {
      // Trigger intersection immediately
      setTimeout(() => {
        callback([{ isIntersecting: true }]);
      }, 0);
      
      return {
        observe: mockObserve,
        disconnect: mockDisconnect,
        unobserve: vi.fn(),
      };
    });

    const { getByTestId } = render(
      <LazyWidget>
        <div data-testid="child-content">Loaded Content</div>
      </LazyWidget>
    );

    // Wait for intersection callback
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    expect(getByTestId('child-content')).toBeTruthy();
  });

  it('sollte Observer trennen nach Sichtbarkeit', async () => {
    mockIntersectionObserver.mockImplementation((callback) => {
      setTimeout(() => {
        callback([{ isIntersecting: true }]);
      }, 0);
      
      return {
        observe: mockObserve,
        disconnect: mockDisconnect,
        unobserve: vi.fn(),
      };
    });

    render(
      <LazyWidget>
        <div>Content</div>
      </LazyWidget>
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('sollte Custom minHeight respektieren', () => {
    const { container } = render(
      <LazyWidget minHeight={300}>
        <div>Content</div>
      </LazyWidget>
    );
    
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.minHeight).toBe('300px');
  });

  it('sollte Fallback rendern wenn IO nicht unterstützt', () => {
    // Remove IntersectionObserver
    vi.stubGlobal('IntersectionObserver', undefined);
    
    const { getByTestId } = render(
      <LazyWidget>
        <div data-testid="fallback-content">Fallback Content</div>
      </LazyWidget>
    );
    
    // Sollte sofort rendern ohne IO
    expect(getByTestId('fallback-content')).toBeTruthy();
  });
});
