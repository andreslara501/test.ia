import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'

describe('App component', () => {
  it('renders title', () => {
    render(<App />)
    expect(screen.getByText(/Vite \+ Resssact/i)).toBeInTheDocument()
  })

  it('renders counter button with initial value 0', () => {
    render(<App />)
    const button = screen.getByRole('button', { name: /count is 0/i })
    expect(button).toBeInTheDocument()
  })

  it('increments counter when button is clicked', () => {
    render(<App />)
    const button = screen.getByRole('button', { name: /count is 0/i })

    fireEvent.click(button)
    expect(screen.getByRole('button', { name: /count is 1/i })).toBeInTheDocument()

    fireEvent.click(button)
    expect(screen.getByRole('button', { name: /count is 2/i })).toBeInTheDocument()
  })
})