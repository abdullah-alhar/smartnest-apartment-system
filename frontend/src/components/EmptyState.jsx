import { Button } from "./ui";

function EmptyState({ icon: Icon, title, description, actionTo, actionOnClick, actionLabel, className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-8 text-center ${className}`}>
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-off-white flex items-center justify-center text-grey-300 mb-4">
          <Icon size={30} strokeWidth={1.5} />
        </div>
      )}
      <p className="text-base font-semibold text-primary mb-1">{title}</p>
      {description && <p className="text-sm text-grey-400 max-w-sm">{description}</p>}
      {actionLabel && actionOnClick && <Button className="mt-5" onClick={actionOnClick}>{actionLabel}</Button>}
      {actionLabel && actionTo && !actionOnClick && <Button className="mt-5" variant="accent" to={actionTo}>{actionLabel}</Button>}
    </div>
  );
}

export default EmptyState;
