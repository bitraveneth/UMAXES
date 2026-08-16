"use client";

import { FormEvent, useState } from "react";
import { SITE_CONTACT_EMAIL } from "@/lib/site";

export default function ContactForm({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const [sent, setSent] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const topic = String(data.get("topic") || "").trim();
    const order = String(data.get("order") || "").trim();
    const message = String(data.get("message") || "").trim();
    const subject = encodeURIComponent(
      [topic, order ? `Order ${order}` : null, "UMAXES inquiry"]
        .filter(Boolean)
        .join(" · "),
    );
    const body = encodeURIComponent(
      [
        `Name: ${name}`,
        `Email: ${email}`,
        topic ? `Topic: ${topic}` : null,
        order ? `Order: ${order}` : null,
        "",
        message,
      ]
        .filter((line) => line !== null)
        .join("\n"),
    );
    window.location.href = `mailto:${SITE_CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-[1.5rem] bg-white p-8 text-center sm:p-10">
        <p className="font-display text-2xl font-bold text-black">Message sent</p>
        <p className="mt-3 font-body text-base text-black/60">
          Thanks — our team will get back to you at {SITE_CONTACT_EMAIL} within
          1–2 business days.
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
      className={
        embedded
          ? "h-full space-y-5"
          : "h-full space-y-5 rounded-[1.5rem] bg-white p-6 shadow-[0_12px_36px_rgba(0,0,0,0.08)] ring-1 ring-black/10 sm:p-8"
      }
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Name" id="name" required placeholder="Your name" />
        <Field
          label="Email"
          id="email"
          type="email"
          required
          placeholder="you@email.com"
        />
      </div>
      <div>
        <label
          htmlFor="topic"
          className="font-display text-xs font-semibold tracking-[0.14em] text-black/45 uppercase"
        >
          Topic
        </label>
        <select
          id="topic"
          name="topic"
          required
          defaultValue=""
          className="mt-2 w-full rounded-xl border border-black/10 bg-umx-cream px-4 py-3.5 font-body text-base text-black outline-none transition focus:border-umx-orange focus:ring-2 focus:ring-umx-orange/20"
        >
          <option value="" disabled>
            What can we help with?
          </option>
          <option value="Product">Product &amp; MaxCore™</option>
          <option value="Order">Order, shipping &amp; returns</option>
          <option value="Wholesale">Wholesale consultation</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <Field
        label="Order number (optional)"
        id="order"
        placeholder="If you have one"
      />
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
          placeholder="Tell us what you need — flavor, order, or wholesale."
          className="mt-2 w-full resize-y rounded-xl border border-black/10 bg-umx-cream px-4 py-3.5 font-body text-base text-black outline-none transition placeholder:text-black/35 focus:border-umx-orange focus:ring-2 focus:ring-umx-orange/20"
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
  placeholder,
}: {
  label: string;
  id: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
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
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-black/10 bg-umx-cream px-4 py-3.5 font-body text-base text-black outline-none transition placeholder:text-black/35 focus:border-umx-orange focus:ring-2 focus:ring-umx-orange/20"
      />
    </div>
  );
}
