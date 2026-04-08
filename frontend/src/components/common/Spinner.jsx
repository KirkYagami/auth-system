export default function Spinner({ fullPage = false, size = 'md' }) {
  const spinner = <span className={`spinner spinner--${size}`} aria-label="Loading" />

  if (fullPage) {
    return <div className="spinner-overlay">{spinner}</div>
  }
  return spinner
}
