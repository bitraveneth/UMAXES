"use client";

import { FormEvent, useEffect, useState } from "react";

type Member = {
  id: string;
  name: string | null;
  email: string | null;
  companyRole: string | null;
  status: string;
};

export default function TeamManager() {
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    companyRole: "BUYER",
  });

  async function load() {
    const res = await fetch("/api/account/members");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Unable to load team");
      return;
    }
    setMembers(data.members || []);
    setError(null);
  }

  useEffect(() => {
    load();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/account/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not create member");
      return;
    }
    setForm({ name: "", email: "", password: "", companyRole: "BUYER" });
    await load();
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <section>
        <h2 className="font-display text-lg font-semibold">Team members</h2>
        <ul className="mt-4 divide-y divide-black/8 border border-black/10 bg-white">
          {members.map((m) => (
            <li key={m.id} className="p-4 font-body text-sm">
              <p className="font-display font-semibold">
                {m.name} · {m.companyRole || "OWNER"}
              </p>
              <p className="text-black/55">{m.email}</p>
            </li>
          ))}
        </ul>
      </section>

      <form onSubmit={onSubmit} className="border border-black/10 bg-white p-6">
        <h2 className="font-display text-lg font-semibold">Invite sub-account</h2>
        <p className="mt-1 font-body text-xs text-black/55">
          BUYER can order · FINANCE can view orders/PI (same portal for now).
        </p>
        {(["name", "email", "password"] as const).map((key) => (
          <label key={key} className="mt-3 block font-display text-sm font-semibold">
            {key}
            <input
              type={key === "password" ? "password" : key === "email" ? "email" : "text"}
              required
              value={form[key]}
              onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
              className="mt-1 w-full border border-black/15 px-3 py-2.5 font-body font-normal"
            />
          </label>
        ))}
        <label className="mt-3 block font-display text-sm font-semibold">
          Role
          <select
            value={form.companyRole}
            onChange={(e) => setForm((p) => ({ ...p, companyRole: e.target.value }))}
            className="mt-1 w-full border border-black/15 px-3 py-2.5 font-body font-normal"
          >
            <option value="BUYER">BUYER</option>
            <option value="FINANCE">FINANCE</option>
          </select>
        </label>
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
        <button
          type="submit"
          className="mt-5 w-full border border-black bg-black py-3 font-display text-sm font-semibold text-umx-cream"
        >
          Create sub-account
        </button>
      </form>
    </div>
  );
}
