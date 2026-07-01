import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="h-screen flex flex-col bg-stone-50">
      {/* Top bar */}
      <header className="h-14 bg-stone-900 flex items-center justify-between px-5 shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">💎</span>
          <span className="text-white font-semibold text-sm tracking-wide">Conchita Plata</span>
          <span className="text-stone-500 text-xs">·</span>
          <span className="text-stone-400 text-xs">Panel de administración</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-stone-400 text-xs hidden sm:block">{user.email}</span>
          <form action={signOut}>
            <button
              type="submit"
              className="text-stone-400 hover:text-white text-xs transition-colors px-2 py-1 rounded hover:bg-stone-700"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
