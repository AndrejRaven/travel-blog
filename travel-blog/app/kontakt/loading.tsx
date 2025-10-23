export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 dark:border-gray-400 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400 font-sans">
          Ładowanie kontaktu...
        </p>
      </div>
    </div>
  );
}
