/**
 * Card — LIVO Design System
 * A white container with 12px rounded corners and a soft shadow.
 */

export default function Card({ children, className = '', padding = 'p-6' }) {
  return (
    <div
      className={`bg-white rounded-card shadow-card ${padding} ${className}`}
    >
      {children}
    </div>
  )
}
