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
      <header className="h-12 md:h-14 bg-stone-900 flex items-center justify-between px-3 md:px-5 shrink-0 safe-top">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg shrink-0">💎</span>
          <span className="text-white font-semibold text-sm tracking-wide truncate">Conchita Plata</span>
          <span className="text-stone-500 text-xs hidden sm:inline">·</span>
          <span className="text-stone-400 text-xs hidden sm:inline">Panel de administración</span>
        </div>
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <span className="text-stone-400 text-xs hidden md:block max-w-[180px] truncate">{user.email}</span>
          <form action={signOut}>
            <button
              type="submit"
              className="text-stone-400 hover:text-white text-xs transition-colors px-2 py-1.5 rounded hover:bg-stone-700"
            >
              Salir
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
