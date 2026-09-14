"use client";

import { useActionState, useState } from "react";
import { signIn } from "../actions";

function WhatsAppMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function LoginPage() {
  const [state, action, pending] = useActionState(signIn, null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="fixed inset-0 overflow-y-auto bg-[#d1d7db]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[120px] md:h-[222px]"
        style={{ background: "#00a884" }}
      />

      <div
        className="relative z-10 min-h-full flex items-center justify-center"
        style={{
          paddingLeft: "max(1.25rem, env(safe-area-inset-left))",
          paddingRight: "max(1.25rem, env(safe-area-inset-right))",
          paddingTop: "max(1.25rem, env(safe-area-inset-top))",
          paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))",
        }}
      >
        <div className="w-full max-w-[400px] md:max-w-[440px]">
          <div className="bg-white rounded-2xl sm:rounded-xl shadow-[0_8px_24px_rgba(11,20,26,0.12)] overflow-hidden">
            <div className="px-6 sm:px-9 pt-8 sm:pt-10 pb-7 sm:pb-8">
              <div className="flex flex-col items-center text-center mb-7 sm:mb-8">
                <div className="w-14 h-14 rounded-full bg-[#25d366] text-white flex items-center justify-center mb-4">
                  <WhatsAppMark className="w-8 h-8" />
                </div>
                <h1 className="text-[#111b21] text-[22px] leading-tight font-medium">
                  Conchita Plata
                </h1>
                <p className="text-[#667781] text-sm mt-1.5 max-w-[260px]">
                  Inicia sesión para abrir el panel de chats
                </p>
              </div>

              <form action={action} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-[13px] font-medium text-[#54656f] mb-1.5">
                    Correo electrónico
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    inputMode="email"
                    placeholder="tu correo"
                    className="w-full h-12 px-3.5 rounded-lg bg-[#f0f2f5] text-[#111b21] placeholder-[#8696a0] text-sm border border-transparent focus:outline-none focus:bg-white focus:border-[#00a884] focus:ring-2 focus:ring-[#00a884]/20"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-[13px] font-medium text-[#54656f] mb-1.5">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      placeholder="Tu contraseña"
                      className="w-full h-12 px-3.5 pr-12 rounded-lg bg-[#f0f2f5] text-[#111b21] placeholder-[#8696a0] text-sm border border-transparent focus:outline-none focus:bg-white focus:border-[#00a884] focus:ring-2 focus:ring-[#00a884]/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full text-[#667781] hover:bg-[#e9edef] hover:text-[#111b21]"
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.5 10.7a3 3 0 004.1 4.1M9.9 5.1A9.8 9.8 0 0112 5c5 0 9.3 3.1 11 7.5a11.7 11.7 0 01-3.5 4.6M6.6 6.6A11.6 11.6 0 001 12.5C2.7 16.9 7 20 12 20c1.7 0 3.3-.3 4.8-1" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2 12.5C3.7 8.1 8 5 12 5s8.3 3.1 10 7.5C20.3 16.9 16 20 12 20S3.7 16.9 2 12.5z" />
                          <circle cx="12" cy="12.5" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {state?.error && (
                  <div className="rounded-lg px-3.5 py-3 bg-[#fff0f0] border border-[#f5c2c7]">
                    <p className="text-[#d92d20] text-sm">{state.error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={pending}
                  className="w-full h-12 mt-1 bg-[#00a884] hover:bg-[#008f72] disabled:bg-[#aebac1] text-white font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {pending ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    "Iniciar sesión"
                  )}
                </button>
              </form>
            </div>

            <div className="px-6 sm:px-9 py-3.5 bg-[#f0f2f5] border-t border-[#e9edef]">
              <p className="text-[#667781] text-xs text-center leading-relaxed">
                Acceso exclusivo para el equipo de Conchita Plata.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
