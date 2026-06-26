import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-stone-50 to-stone-100 p-8">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-stone-800 tracking-tight">
            Conchita Plata
          </h1>
          <p className="text-stone-500 text-lg">Asistente Virtual con IA</p>
        </div>

        <div className="w-16 h-0.5 bg-stone-300 mx-auto" />

        <p className="text-stone-600 text-sm leading-relaxed">
          Sistema de atención al cliente por WhatsApp impulsado por inteligencia artificial.
          Accede al panel de administración para gestionar conversaciones.
        </p>

        <Link
          href="/dashboard"
          className="inline-block bg-stone-800 text-white px-8 py-3 rounded-lg text-sm font-medium hover:bg-stone-700 transition-colors"
        >
          Ir al Dashboard
        </Link>
      </div>
    </main>
  );
}
