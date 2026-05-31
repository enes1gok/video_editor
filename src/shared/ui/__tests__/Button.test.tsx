import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Scissors } from 'lucide-react';
import { Button } from '../Button';

describe('Button', () => {
    it('renders its label', () => {
        render(<Button>Kes</Button>);
        expect(screen.getByRole('button', { name: 'Kes' })).toBeInTheDocument();
    });

    it('applies primary-variant token classes by default', () => {
        render(<Button>X</Button>);
        expect(screen.getByRole('button')).toHaveClass('bg-accent');
    });

    it('applies the danger variant', () => {
        render(<Button variant="danger">Sil</Button>);
        expect(screen.getByRole('button')).toHaveClass('bg-danger');
    });

    it('is disabled and non-interactive while loading', () => {
        const onClick = vi.fn();
        render(
            <Button loading onClick={onClick}>
                X
            </Button>,
        );
        const btn = screen.getByRole('button');
        expect(btn).toBeDisabled();
        fireEvent.click(btn);
        expect(onClick).not.toHaveBeenCalled();
    });

    it('calls onClick when enabled', () => {
        const onClick = vi.fn();
        render(<Button onClick={onClick}>X</Button>);
        fireEvent.click(screen.getByRole('button'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('renders a leading icon', () => {
        const { container } = render(<Button icon={Scissors}>Kes</Button>);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });
});
