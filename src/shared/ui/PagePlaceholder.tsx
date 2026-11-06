interface PagePlaceholderProps {
  title: string;
  description: string;
}

export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <section className="page-section">
      <p className="eyebrow">Мини CRM</p>
      <h1>{title}</h1>
      <p className="page-description">{description}</p>
    </section>
  );
}
