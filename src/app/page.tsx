import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">O</span>
          </div>
          <span className="font-semibold text-lg">Ondu Sign</span>
        </div>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-6">
            One Platform.
            <br />
            <span className="text-brand-600">Secure Signatures.</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Upload documents, add signature fields, send to recipients, and get
            legally binding signatures — all in one place.
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-3 text-lg font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
          >
            Start Signing for Free
          </Link>
        </div>
      </main>

      <footer className="border-t bg-white px-6 py-4 text-center text-sm text-gray-500">
        Ondu Sign — One Platform. Secure Signatures.
      </footer>
    </div>
  );
}
