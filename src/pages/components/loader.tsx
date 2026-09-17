type LoaderProps = {
  label?: string
}

function Loader({ label = 'Loading' }: LoaderProps) {
  return (
    <div className="cute-loader" role="status" aria-label={label}>
      <span className="cute-loader__dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span className="cute-loader__label">{label}...</span>
    </div>
  )
}

export default Loader
