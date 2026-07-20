"use client";

import { FormEvent, useState } from "react";

export default function ContactForm() {
  const [sent, setSent] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-[1.5rem] bg-white p-8 text-center shadow-[0_12px_36px_rgba(61,22,5,0.08)] ring-1 ring-black/6 sm:p-10">
        <p className="font-display text-2xl font-bold text-black">Message sent</p>
        <p className="mt-3 font-body text-base text-black/60">
          Thanks — our team will get back to you within 1–2 business days.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-6 font-display text-sm font-semibold text-umx-orange"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 rounded-[1.5rem] bg-white p-6 shadow-[0_12px_36px_rgba(61,22,5,0.08)] ring-1 ring-black/6 sm:p-8"
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Name" id="name" required />
        <Field label="Email" id="email" type="email" required />
      </div>
      <Field label="Order number (optional)" id="order" />
      <div>
        <label
          htmlFor="message"
          className="font-display text-xs font-semibold tracking-[0.14em] text-black/45 uppercase"
        >
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className="mt-2 w-full resize-y rounded-xl border border-black/10 bg-umx-cream px-4 py-3.5 font-body text-base text-black outline-none transition focus:border-umx-orange focus:ring-2 focus:ring-umx-orange/20"
        />
      </div>
      <button
        type="submit"
        className="inline-flex rounded-full bg-black px-7 py-3.5 font-display text-sm font-semibold text-umx-cream transition hover:bg-umx-orange hover:text-white"
      >
        Send message
      </button>
    </form>
  );
}

function Field({
  label,
  id,
  type = "text",
  required,
}: {
  label: string;
  id: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="font-display text-xs font-semibold tracking-[0.14em] text-black/45 uppercase"
      >
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        className="mt-2 w-full rounded-xl border border-black/10 bg-umx-cream px-4 py-3.5 font-body text-base text-black outline-none transition focus:border-umx-orange focus:ring-2 focus:ring-umx-orange/20"
      />
    </div>
  );
}
