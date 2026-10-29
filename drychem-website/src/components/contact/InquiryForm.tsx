"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { solutions } from "@/content/solutions";
import { contact } from "@/content/company";
import { site } from "@/config/site";
import { Button } from "@/components/ui/Button";
import styles from "./InquiryForm.module.css";

/**
 * Inquiry form.
 *
 * Submission is honest about where the message goes:
 *  • With NEXT_PUBLIC_INQUIRY_ENDPOINT set, it POSTs JSON there and reports
 *    success only when the endpoint answers 2xx.
 *  • Without an endpoint (the default — no backend is connected yet), it opens
 *    the visitor's email app with the inquiry addressed to the sales team, and
 *    offers the text to copy if no email app is available.
 */

const roles = [
  "Building-material brand",
  "Manufacturer",
  "Distributor or exporter",
  "Contractor or developer",
  "Architect or consultant",
  "Other",
];

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent" }
  | { kind: "error"; detail: string }
  | { kind: "mailto"; body: string };

type Errors = Partial<Record<"name" | "company" | "email" | "phone" | "message", string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** The solution a visitor came from (/contact/?topic=<slug>); null on the server. */
const noop = () => () => {};
const readTopic = () => new URLSearchParams(window.location.search).get("topic");
const serverTopic = () => null;
const PHONE = /^[+()\d\s.-]{7,20}$/;

export function InquiryForm() {
  const id = useId();
  const statusRef = useRef<HTMLDivElement>(null);
  const urlTopic = useSyncExternalStore(noop, readTopic, serverTopic);
  // Explicit choices override the URL default.
  const [choices, setChoices] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [copied, setCopied] = useState(false);
  const endpoint = site.inquiryEndpoint;

  useEffect(() => {
    if (status.kind !== "idle" && status.kind !== "sending") statusRef.current?.focus();
  }, [status.kind]);

  const isChosen = (slug: string) => choices[slug] ?? slug === urlTopic;
  const toggleTopic = (slug: string) => setChoices((current) => ({ ...current, [slug]: !isChosen(slug) }));
  const topics = solutions.filter((s) => isChosen(s.slug)).map((s) => s.slug);

  const field = (data: FormData, key: string) => String(data.get(key) ?? "").trim();

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const next: Errors = {};
    if (!field(data, "name")) next.name = "Please enter your name.";
    if (!field(data, "company")) next.company = "Please enter your company or organisation.";
    const email = field(data, "email");
    if (!email) next.email = "Please enter your email address.";
    else if (!EMAIL.test(email)) next.email = "Please enter a valid email address, e.g. name@company.com.";
    const phone = field(data, "phone");
    if (phone && !PHONE.test(phone)) next.phone = "Please enter a valid phone number, including the country code.";
    if (field(data, "message").length < 10)
      next.message = "Please tell us a little about your requirement (at least 10 characters).";
    setErrors(next);

    const firstInvalid = Object.keys(next)[0];
    if (firstInvalid) {
      form.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }
    // Honeypot: real visitors never see or fill this field.
    if (field(data, "website")) return;

    const inquiry = {
      name: field(data, "name"),
      company: field(data, "company"),
      email,
      phone,
      country: field(data, "country"),
      role: field(data, "role"),
      interests: topics.map((slug) => solutions.find((s) => s.slug === slug)?.name ?? slug),
      message: field(data, "message"),
    };

    if (endpoint) {
      setStatus({ kind: "sending" });
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ ...inquiry, page: window.location.href }),
        });
        if (!res.ok) throw new Error(`the server responded with status ${res.status}`);
        setStatus({ kind: "sent" });
        form.reset();
        setChoices({});
      } catch (err) {
        setStatus({ kind: "error", detail: err instanceof Error ? err.message : "a network error occurred" });
      }
      return;
    }

    const subject = `Inquiry from ${inquiry.company} — ${inquiry.interests[0] ?? "DRYCHEM solutions"}`;
    const body = [
      `Name: ${inquiry.name}`,
      `Company: ${inquiry.company}`,
      `Email: ${inquiry.email}`,
      inquiry.phone && `Phone: ${inquiry.phone}`,
      inquiry.country && `Country: ${inquiry.country}`,
      inquiry.role && `I am a: ${inquiry.role}`,
      inquiry.interests.length > 0 && `Interested in: ${inquiry.interests.join(", ")}`,
      "",
      inquiry.message,
    ]
      .filter((line) => line !== false && line !== undefined)
      .join("\n");
    window.location.href = `mailto:${contact.salesEmail.display}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setCopied(false);
    setStatus({ kind: "mailto", body: `To: ${contact.salesEmail.display}\nSubject: ${subject}\n\n${body}` });
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const describedBy = (key: keyof Errors, hint?: string) =>
    [errors[key] ? `${id}-${key}-error` : null, hint].filter(Boolean).join(" ") || undefined;

  const textField = (
    key: "name" | "company" | "email" | "phone",
    label: string,
    type: string,
    autoComplete: string,
    required: boolean,
  ) => (
    <div className={styles.field} data-invalid={errors[key] ? "" : undefined}>
      <label htmlFor={`${id}-${key}`} className={styles.label}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : <span className={styles.optional}> (optional)</span>}
      </label>
      <input
        id={`${id}-${key}`}
        name={key}
        type={type}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={errors[key] ? true : undefined}
        aria-describedby={describedBy(key)}
        className={styles.input}
      />
      {errors[key] && (
        <p id={`${id}-${key}-error`} className={styles.error}>
          {errors[key]}
        </p>
      )}
    </div>
  );

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate aria-describedby={`${id}-required`}>
      <p id={`${id}-required`} className={styles.requiredNote}>
        Fields marked * are required.
      </p>

      <div className={styles.row}>
        {textField("name", "Your name", "text", "name", true)}
        {textField("company", "Company", "text", "organization", true)}
      </div>
      <div className={styles.row}>
        {textField("email", "Email", "email", "email", true)}
        {textField("phone", "Phone", "tel", "tel", false)}
      </div>
      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor={`${id}-country`} className={styles.label}>
            Country <span className={styles.optional}>(optional)</span>
          </label>
          <input id={`${id}-country`} name="country" type="text" autoComplete="country-name" className={styles.input} />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${id}-role`} className={styles.label}>
            I am a <span className={styles.optional}>(optional)</span>
          </label>
          <select id={`${id}-role`} name="role" className={`${styles.input} ${styles.select}`} defaultValue="">
            <option value="">Select…</option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset className={styles.topics}>
        <legend className={styles.label}>
          Interested in <span className={styles.optional}>(optional)</span>
        </legend>
        <div className={styles.chips}>
          {solutions.map((s) => (
            <label key={s.slug} className={styles.chip}>
              <input
                type="checkbox"
                name="interests"
                value={s.slug}
                checked={isChosen(s.slug)}
                onChange={() => toggleTopic(s.slug)}
              />
              <span>{s.name}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className={styles.field} data-invalid={errors.message ? "" : undefined}>
        <label htmlFor={`${id}-message`} className={styles.label}>
          Your requirement<span aria-hidden="true"> *</span>
        </label>
        <textarea
          id={`${id}-message`}
          name="message"
          rows={6}
          required
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={describedBy("message", `${id}-message-hint`)}
          className={`${styles.input} ${styles.textarea}`}
        />
        <p id={`${id}-message-hint`} className={styles.hint}>
          Products or application, approximate volumes, location and timeline help us respond faster.
        </p>
        {errors.message && (
          <p id={`${id}-message-error`} className={styles.error}>
            {errors.message}
          </p>
        )}
      </div>

      {/* Honeypot for bots — hidden from people and assistive technology. */}
      <div className={styles.trap} aria-hidden="true">
        <label htmlFor={`${id}-website`}>Website</label>
        <input id={`${id}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className={styles.submit}>
        <Button type="submit" disabled={status.kind === "sending"} magnetic icon={endpoint ? "arrow" : "mail"}>
          {status.kind === "sending" ? "Sending…" : endpoint ? "Send inquiry" : "Send via email"}
        </Button>
        {!endpoint && (
          <p className={styles.hint}>
            Opens your email app with the inquiry addressed to {contact.salesEmail.display}.
          </p>
        )}
      </div>

      <div
        ref={statusRef}
        className={styles.status}
        role="status"
        aria-live="polite"
        tabIndex={-1}
        data-kind={status.kind}
      >
        {status.kind === "sending" && <p>Sending your inquiry…</p>}
        {status.kind === "sent" && <p>Thank you — your inquiry has been sent to our sales &amp; partnerships team.</p>}
        {status.kind === "error" && (
          <p>
            Your inquiry could not be sent ({status.detail}). Please try again, or email{" "}
            <a className="link link--static" href={contact.salesEmail.href}>
              {contact.salesEmail.display}
            </a>
            .
          </p>
        )}
        {status.kind === "mailto" && (
          <>
            <p>
              Your email app should now open with this inquiry addressed to {contact.salesEmail.display} — press send
              there to deliver it. If nothing opened, copy the text below into an email.
            </p>
            <textarea
              className={`${styles.input} ${styles.copyBox}`}
              readOnly
              value={status.body}
              rows={8}
              aria-label="Inquiry text to copy"
            />
            <button type="button" className={styles.copy} onClick={() => copy(status.body)}>
              {copied ? "Copied to clipboard" : "Copy inquiry text"}
            </button>
          </>
        )}
      </div>
    </form>
  );
}
