import { render, screen } from '@testing-library/react';
import App from './App';
import userEvent from '@testing-library/user-event';

describe('Given the App component', () => {
    test('When rendered, Then it should display the Palindromo input and heading', () => {
        render(<App />);
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hola');
        expect(screen.getByPlaceholderText('Escribe una palabra')).toBeInTheDocument();
    });

    test('When a palindrome is entered, Then it should show "Si" in the result div', async () => {
        render(<App />);
        const input = screen.getByPlaceholderText('Escribe una palabra');
        await userEvent.type(input, 'Anita lava la tina');
        const matches = screen.getAllByText((_, el) => {
            return Boolean(el && el.textContent && el.textContent.replace(/\s+/g, ' ').includes('¿Es un palíndromo?: Si'));
        });
        expect(matches.length).toBeGreaterThan(0);
    });

    test('When a non-palindrome is entered, Then it should show "No" in the result div', async () => {
        render(<App />);
        const input = screen.getByPlaceholderText('Escribe una palabra');
        await userEvent.type(input, 'palabra');
        const matches = screen.getAllByText((_, el) => {
            return Boolean(el && el.textContent && el.textContent.replace(/\s+/g, ' ').includes('¿Es un palíndromo?: No'));
        });
        expect(matches.length).toBeGreaterThan(0);
    });
});
