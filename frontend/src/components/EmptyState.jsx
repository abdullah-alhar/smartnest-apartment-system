import { Link } from "react-router-dom";

// icon is a Lucide component, not an element, so we can set its size/color here
// actionTo renders a Link, actionOnClick renders a button — pass whichever fits the target
function EmptyState({ icon: Icon, title, description, actionTo, actionOnClick, actionLabel }) {
  return (
    <div className="empty-state">
      {Icon && (
        <div className="empty-icon">
          <Icon size={40} strokeWidth={1.5} />
        </div>
      )}
      <h2 className="empty-title">{title}</h2>
      {description && <p className="empty-desc">{description}</p>}
      {actionLabel && actionOnClick && (
        <button type="button" onClick={actionOnClick} className="btn btn-primary mt-4">{actionLabel}</button>
      )}
      {actionLabel && actionTo && !actionOnClick && (
        <Link to={actionTo} className="btn btn-primary mt-4">{actionLabel}</Link>
      )}
    </div>
  );
}

export default EmptyState;
