import { render, screen } from '@testing-library/react';
import { Palindromo } from './palindromo';
import userEvent from '@testing-library/user-event';

describe('Given the Palindromo component', () => {
    test('When rendered, Then it should show heading and input', () => {
        render(<Palindromo />);
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hola');
        expect(screen.getByPlaceholderText('Escribe una palabra')).toBeInTheDocument();
    });

    test('When a palindrome is entered, Then it should show "Si" in the result div', async () => {
        render(<Palindromo />);
        const input = screen.getByPlaceholderText('Escribe una palabra');
        await userEvent.type(input, 'Anita lava la tina');
        const matches = screen.getAllByText((_, el) => {
            return Boolean(el && el.textContent && el.textContent.replace(/\s+/g, ' ').includes('¿Es un palíndromo?: Si'));
        });
        expect(matches.length).toBeGreaterThan(0);
    });

    test('When a non-palindrome is entered, Then it should show "No" in the result div', async () => {
        render(<Palindromo />);
        const input = screen.getByPlaceholderText('Escribe una palabra');
        await userEvent.type(input, 'palabra');
        const matches = screen.getAllByText((_, el) => {
            return Boolean(el && el.textContent && el.textContent.replace(/\s+/g, ' ').includes('¿Es un palíndromo?: No'));
        });
        expect(matches.length).toBeGreaterThan(0);
    });
});

