import "./styles.css";

export const Loader = () => (
  <div className="layout">
    <div className="loader">
      <div className="dots">
        <span className="dot dot-1"></span>
        <span className="dot dot-2"></span>
        <span className="dot dot-3"></span>
      </div>
    </div>
  </div>
)

export const Progress = () => (
  <div className="progress"><div /></div>
)

export const Spinner = () => (
  <div className="spinner" />
)

export const Skeleton = () => (
  <div className="skeleton" />
)