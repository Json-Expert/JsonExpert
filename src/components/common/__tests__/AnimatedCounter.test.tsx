import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { AnimatedCounter } from '../AnimatedCounter';

describe('AnimatedCounter', () => {
  vi.useFakeTimers();

  it('should animate to the target value', async () => {
    render(<AnimatedCounter value={100} duration={500} />);

    expect(screen.getByText('0')).toBeInTheDocument();

    // Fast-forward timers to the end of the animation
    await act(async () => {
      vi.runAllTimers();
    });

    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('should use the formatter function', async () => {
    const formatter = (v: number) => `$${v.toFixed(2)}`;
    render(<AnimatedCounter value={123.45} duration={500} formatter={formatter} />);

    await act(async () => {
      vi.runAllTimers();
    });

    expect(screen.getByText('$123.45')).toBeInTheDocument();
  });

  it('should handle initial value being the same as target value', () => {
    render(<AnimatedCounter value={0} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
