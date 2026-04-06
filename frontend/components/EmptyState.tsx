interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon, title, description, actionLabel, actionHref, onAction }: EmptyStateProps) {
  const button = actionLabel ? (
    actionHref ? (
      <a href={actionHref}
        className="inline-block bg-emerald-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-emerald-700 transition shadow-sm">
        {actionLabel}
      </a>
    ) : onAction ? (
      <button onClick={onAction}
        className="bg-emerald-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-emerald-700 transition shadow-sm">
        {actionLabel}
      </button>
    ) : null
  ) : null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm text-center py-16 px-6">
      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
        <span className="text-3xl">{icon}</span>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">{description}</p>
      {button}
    </div>
  );
}
