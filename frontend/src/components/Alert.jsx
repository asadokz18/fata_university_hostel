// <div class="alert alert-xxx"> used all over the original pages
export default function Alert({ type = 'danger', icon, children, style }) {
  if (!children) return null;
  return (
    <div className={`alert alert-${type}`} style={style}>
      {icon && <><i className={`fas fa-${icon}`}></i>{' '}</>}{children}
    </div>
  );
}
