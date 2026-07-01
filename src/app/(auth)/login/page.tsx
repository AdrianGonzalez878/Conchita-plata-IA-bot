"use client";

import { useActionState } from "react";
import { signIn } from "../actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(signIn, null);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 p-4 sm:p-6">
      <div className="w-full max-w-sm">
        {/* Logo / Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-stone-800 mb-4">
            <span className="text-2xl">💎</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-800 tracking-tight">Conchita Plata</h1>
          <p className="text-stone-500 text-sm mt-1">Panel de administración</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 sm:p-8">
          <form action={action} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-stone-700">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="admin@ejemplo.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-stone-700">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition"
              />
            </div>

            {state?.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <p className="text-red-600 text-sm">{state.error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full bg-stone-800 hover:bg-stone-700 disabled:bg-stone-400 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
            >
              {pending ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
