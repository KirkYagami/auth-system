import Spinner from './Spinner'

/**
 * variant: 'primary' | 'secondary' | 'danger' | 'ghost'
 */
export default function Button({
  children,
  loading = false,
  variant = 'primary',
  className = '',
  ...props
}) {
  return (
    <button
      className={`btn btn--${variant} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : children}
    </button>
  )
}


