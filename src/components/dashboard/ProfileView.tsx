"use client";

import { useEffect, useRef, useState } from "react";
import {
  PROFILE_LIMITS,
  SUGGESTED_PROFILE_TEXT,
} from "@/lib/whatsapp/profile-limits";

interface BusinessProfile {
  about: string;
  address: string;
  description: string;
  email: string;
  profile_picture_url: string;
  websites: string[];
  vertical: string;
  verified_name: string;
  display_phone_number: string;
}

const EMPTY_PROFILE: BusinessProfile = {
  about: "",
  address: "",
  description: "",
  email: "",
  profile_picture_url: "",
  websites: [""],
  vertical: "RETAIL",
  verified_name: "",
  display_phone_number: "",
};

const CATEGORIES = [
  { value: "RETAIL", label: "Tienda / Retail" },
  { value: "APPAREL", label: "Moda y accesorios" },
  { value: "SHOPPING", label: "Compras" },
  { value: "BEAUTY", label: "Belleza" },
  { value: "OTHER", label: "Otro" },
];

export function ProfileView() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<BusinessProfile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setProfile({
          ...EMPTY_PROFILE,
          ...data,
          websites: data.websites?.length ? data.websites : [""],
        });
      })
      .catch((err) => {
        setMessage({ type: "error", text: err.message });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          about: profile.about,
          address: profile.address,
          description: profile.description,
          email: profile.email,
          vertical: profile.vertical,
          websites: profile.websites.filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al guardar");
      setProfile({ ...profile, ...data, websites: data.websites?.length ? data.websites : [""] });
      setMessage({ type: "ok", text: "Perfil actualizado en WhatsApp" });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Error al guardar" });
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await fetch("/api/admin/profile/photo", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al subir foto");
      setProfile((prev) => ({ ...prev, profile_picture_url: data.profile_picture_url }));
      setMessage({ type: "ok", text: "Foto de perfil actualizada" });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Error al subir foto" });
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const applySuggestedTexts = () => {
    setProfile((prev) => ({
      ...prev,
      about: SUGGESTED_PROFILE_TEXT.about,
      description: SUGGESTED_PROFILE_TEXT.description,
      address: SUGGESTED_PROFILE_TEXT.address,
      email: SUGGESTED_PROFILE_TEXT.email,
      websites: [SUGGESTED_PROFILE_TEXT.website],
    }));
    setMessage({
      type: "ok",
      text: `Textos sugeridos cargados (Acerca de: ${SUGGESTED_PROFILE_TEXT.about.length}/${PROFILE_LIMITS.about}, Descripción: ${SUGGESTED_PROFILE_TEXT.description.length}/${PROFILE_LIMITS.description}). Revisa y guarda.`,
    });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: "#0b141a" }}>
        <div className="w-6 h-6 border-2 border-[#aebac1] border-t-teal-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "#0b141a" }}>
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-[#e9edef] text-xl font-semibold">Perfil de WhatsApp Business</h2>
          <p className="text-[#8696a0] text-sm mt-1">
            Estos datos aparecen cuando un cliente abre tu chat en WhatsApp
          </p>
        </div>

        {message && (
          <div
            className={`mb-6 rounded-lg px-4 py-3 text-sm ${
              message.type === "ok"
                ? "bg-emerald-900/30 text-emerald-400 border border-emerald-800/50"
                : "bg-red-900/30 text-red-400 border border-red-800/50"
            }`}
          >
            {message.text}
          </div>
        )}

        <section className="rounded-xl p-5 mb-6" style={{ background: "#182229", border: "1px solid #00a88440" }}>
          <p className="text-[#e9edef] text-sm font-medium mb-1">Textos sugeridos para Conchita Plata</p>
          <p className="text-[#8696a0] text-xs mb-3 leading-relaxed">
            WhatsApp limita Acerca de a {PROFILE_LIMITS.about} caracteres y Descripción a {PROFILE_LIMITS.description}.
            Estos textos ya caben — solo ajusta dirección, correo o web si hace falta.
          </p>
          <button
            type="button"
            onClick={applySuggestedTexts}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: "#00a884" }}
          >
            Usar textos sugeridos
          </button>
        </section>

        {/* Photo */}
        <section className="rounded-xl p-6 mb-6" style={{ background: "#202c33" }}>
          <p className="text-[#aebac1] text-xs font-semibold uppercase tracking-wider mb-4">
            Foto de perfil
          </p>
          <div className="flex items-center gap-5">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-[#2a3942] flex items-center justify-center shrink-0">
              {profile.profile_picture_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.profile_picture_url}
                  alt="Foto de perfil"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl">💎</span>
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
                style={{ background: "#00a884" }}
              >
                {uploadingPhoto ? "Subiendo..." : "Cambiar foto"}
              </button>
              <p className="text-[#8696a0] text-xs mt-2">JPG o PNG, máximo 5 MB. Recomendado: 640×640 px</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>
          </div>
        </section>

        {/* Business info */}
        <section className="rounded-xl p-6 mb-6 space-y-5" style={{ background: "#202c33" }}>
          <p className="text-[#aebac1] text-xs font-semibold uppercase tracking-wider">
            Información del negocio
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nombre verificado (solo lectura)">
              <input
                readOnly
                value={profile.verified_name}
                className="w-full rounded-lg px-3 py-2.5 text-sm bg-[#2a3942] text-[#8696a0] border border-[#ffffff12] cursor-not-allowed"
              />
            </Field>
            <Field label="Número (solo lectura)">
              <input
                readOnly
                value={profile.display_phone_number}
                className="w-full rounded-lg px-3 py-2.5 text-sm bg-[#2a3942] text-[#8696a0] border border-[#ffffff12] cursor-not-allowed"
              />
            </Field>
          </div>

          <Field label="Acerca de" hint={`Máx. ${PROFILE_LIMITS.about} caracteres — aparece debajo del nombre`}>
            <textarea
              value={profile.about}
              onChange={(e) => setProfile({ ...profile, about: e.target.value })}
              maxLength={PROFILE_LIMITS.about}
              rows={2}
              placeholder="Joyería de plata artesanal · Plata Ley .925"
              className="w-full rounded-lg px-3 py-2.5 text-sm bg-[#2a3942] text-[#e9edef] border border-[#ffffff12] focus:outline-none focus:ring-2 focus:ring-[#00a884] placeholder-[#8696a0] resize-none"
            />
            <CharCount current={profile.about.length} max={PROFILE_LIMITS.about} />
          </Field>

          <Field label="Descripción" hint={`Máx. ${PROFILE_LIMITS.description} caracteres — descripción completa del negocio`}>
            <textarea
              value={profile.description}
              onChange={(e) => setProfile({ ...profile, description: e.target.value })}
              maxLength={PROFILE_LIMITS.description}
              rows={4}
              placeholder="Somos una joyería especializada en plata de alta calidad..."
              className="w-full rounded-lg px-3 py-2.5 text-sm bg-[#2a3942] text-[#e9edef] border border-[#ffffff12] focus:outline-none focus:ring-2 focus:ring-[#00a884] placeholder-[#8696a0] resize-none"
            />
            <CharCount current={profile.description.length} max={PROFILE_LIMITS.description} />
          </Field>

          <Field label="Dirección">
            <input
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              maxLength={PROFILE_LIMITS.address}
              placeholder="Ciudad, Estado, México"
              className="w-full rounded-lg px-3 py-2.5 text-sm bg-[#2a3942] text-[#e9edef] border border-[#ffffff12] focus:outline-none focus:ring-2 focus:ring-[#00a884] placeholder-[#8696a0]"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Correo electrónico">
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                placeholder="contacto@conchitaplata.com"
                className="w-full rounded-lg px-3 py-2.5 text-sm bg-[#2a3942] text-[#e9edef] border border-[#ffffff12] focus:outline-none focus:ring-2 focus:ring-[#00a884] placeholder-[#8696a0]"
              />
            </Field>
            <Field label="Categoría">
              <select
                value={profile.vertical}
                onChange={(e) => setProfile({ ...profile, vertical: e.target.value })}
                className="w-full rounded-lg px-3 py-2.5 text-sm bg-[#2a3942] text-[#e9edef] border border-[#ffffff12] focus:outline-none focus:ring-2 focus:ring-[#00a884]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Sitio web">
            <input
              type="url"
              value={profile.websites[0] ?? ""}
              onChange={(e) => setProfile({ ...profile, websites: [e.target.value] })}
              placeholder="https://conchitaplata.com"
              className="w-full rounded-lg px-3 py-2.5 text-sm bg-[#2a3942] text-[#e9edef] border border-[#ffffff12] focus:outline-none focus:ring-2 focus:ring-[#00a884] placeholder-[#8696a0]"
            />
          </Field>
        </section>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto px-8 py-3 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50"
          style={{ background: "#00a884" }}
        >
          {saving ? "Guardando..." : "Guardar perfil en WhatsApp"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[#e9edef] text-sm font-medium mb-1.5">{label}</label>
      {hint && <p className="text-[#8696a0] text-xs mb-2">{hint}</p>}
      {children}
    </div>
  );
}

function CharCount({ current, max }: { current: number; max: number }) {
  return (
    <p className={`text-xs mt-1 text-right ${current > max * 0.9 ? "text-amber-400" : "text-[#8696a0]"}`}>
      {current}/{max}
    </p>
  );
}
