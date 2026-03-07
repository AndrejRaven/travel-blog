type PageHeaderProps = {
  title: string;
  subtitle?: string;
  className?: string;
};

export default function PageHeader({
  title,
  subtitle,
  className = "",
}: PageHeaderProps) {
  return (
    <div
      className={`mb-6 border-b border-gray-200 dark:border-gray-700 pb-4 ${className}`}
    >
      <h1 className="text-2xl font-medium text-gray-900 dark:text-gray-100 mb-1">
        {title}
      </h1>
      {subtitle && (
        <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
      )}
    </div>
  );
}
