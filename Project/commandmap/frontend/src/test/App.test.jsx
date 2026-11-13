import { render, screen, fireEvent } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import App from '../App.jsx';

beforeAll(() => {
  globalThis.ResizeObserver = class { observe() {} disconnect() {} unobserve() {} };
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 1200 });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 800 });
  SVGElement.prototype.setPointerCapture = () => {};
  SVGElement.prototype.releasePointerCapture = () => {};
  globalThis.fetch = vi.fn(() => Promise.reject(new TypeError('offline')));
});

describe('App', () => {
  it('opens the sample scenario with its units drawn', () => {
    const { container } = render(<App />);
    expect(screen.getAllByText('Operation Iron Ford').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-kind="unit"]').length).toBe(11);
    expect(container.querySelectorAll('[data-kind="formation"]').length).toBe(4);
    // one merged territory per team
    expect(container.querySelectorAll('svg.map-svg path[fill-rule="evenodd"]').length).toBeGreaterThanOrEqual(3);
  });

  it('selects a unit and shows its properties', () => {
    const { container } = render(<App />);
    const unit = container.querySelector('[data-kind="unit"]');
    fireEvent(unit, new MouseEvent('pointerdown', { bubbles: true, button: 0 }));
    expect(screen.getByText('Influence radius')).toBeTruthy();
  });

  it('opens the new scenario dialog', () => {
    render(<App />);
    fireEvent.click(screen.getByTitle('New scenario'));
    expect(screen.getByText('Create scenario')).toBeTruthy();
  });
});
