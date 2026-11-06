interface AsyncStateProps {
  isLoading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyText?: string;
}

export function AsyncState({ isLoading, error, empty, emptyText = 'Данных пока нет' }: AsyncStateProps) {
  if (isLoading) return <p className="muted">Загрузка…</p>;
  if (error) return <p className="error-text">{error}</p>;
  if (empty) return <p className="empty-state">{emptyText}</p>;
  return null;
}
