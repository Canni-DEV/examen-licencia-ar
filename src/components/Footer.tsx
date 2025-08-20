export default function Footer() {
  return (
    <footer className="mt-8 border-t border-gray-200 dark:border-gray-700 bg-background">
      <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-gray-500 dark:text-gray-400">
        © {new Date().getFullYear()} Licencia de Conducir
      </div>
    </footer>
  )
}
