import { useState } from "react";

export const Palindromo = () => {
    const [isPalindromo, setIsPalindromo] = useState<boolean>(false);

    const calculatePalindromo = (str: string): boolean => {
        const cleanedStr = str.replace(/[^A-Za-z0-9]/g, '').toLowerCase();
        const reversedStr = cleanedStr.split('').reverse().join('');
        return cleanedStr === reversedStr;
    }

    return (
        <div>
            <h1>Hola</h1>
            <input type="text" placeholder="Escribe una palabra" onChange={(e) => {
                const isPalindromo = calculatePalindromo(e.target.value);
                setIsPalindromo(isPalindromo);
            }} />

            <div>¿Es un palíndromo?: {isPalindromo ? 'Si' : 'No'}</div>
        </div>
    );
};