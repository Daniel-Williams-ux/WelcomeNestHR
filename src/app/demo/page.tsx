"use client";

import { FormEvent, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Globe2,
  HeartPulse,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const companySizes = [
  "1-25 employees",
  "26-100 employees",
  "101-250 employees",
  "251-1,000 employees",
  "1,000+ employees",
];

const interests = [
  "Employee onboarding",
  "LifeSync emotional intelligence",
  "Compliance and HR visibility",
  "Payroll and payslips",
  "Full platform walkthrough",
];

const initialForm = {
  fullName: "",
  workEmail: "",
  companyName: "",
  role: "",
  companySize: "",
  country: "",
  interest: "",
  message: "",
  website: "",
};

export default function DemoRequestPage() {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const updateField = (field: keyof typeof initialForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/demo/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to submit request.");
      }

      setSubmitted(true);
      setForm(initialForm);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit request. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main
      id="main-content"
      className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#080f1a] dark:text-white"
    >
      <section className="relative overflow-hidden px-6 py-16 sm:py-20">
        <div className="absolute inset-x-0 top-0 -z-10 h-96 bg-gradient-to-br from-cyan-50 via-white to-orange-50 dark:from-[#071923] dark:via-[#080f1a] dark:to-[#0f172a]" />
        <div className="absolute left-8 top-24 -z-10 h-64 w-64 rounded-full bg-[#00ACC1]/15 blur-3xl" />
        <div className="absolute right-8 top-24 -z-10 h-56 w-56 rounded-full bg-[#FFB300]/25 blur-3xl" />

        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="rounded-3xl bg-gradient-to-br from-[#004d59] via-[#006e7f] to-[#008FA1] p-6 text-white shadow-2xl shadow-[#004d59]/20 ring-1 ring-white/20 sm:p-8 dark:from-slate-900 dark:via-[#062934] dark:to-[#004d59]">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold text-cyan-50">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Request a demo
            </p>
            <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
              See how WelcomeNestHR supports every new hire from day one.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-cyan-50">
              Tell us a little about your company and we will follow up with a
              guided walkthrough focused on onboarding, LifeSync, compliance,
              payroll, messaging, and HR visibility.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <ValueCard
                icon={Clock3}
                title="Fast follow-up"
                description="We will respond by email and help you choose the right next step."
              />
              <ValueCard
                icon={HeartPulse}
                title="Emotionally intelligent HR"
                description="See how LifeSync gives HR useful wellbeing signals without exposing private notes."
              />
              <ValueCard
                icon={ShieldCheck}
                title="Production-focused"
                description="Review security, roles, employee journeys, and company-level controls."
              />
              <ValueCard
                icon={Globe2}
                title="Built for global teams"
                description="Start in the US and prepare for multi-region billing and HR workflows."
              />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-950 sm:p-8">
            {submitted ? (
              <div className="flex min-h-[520px] flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300">
                  <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
                </div>
                <h2 className="mt-5 text-2xl font-bold">Demo request received</h2>
                <p className="mt-3 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Thank you. We saved your request and will follow up by email.
                  For now, you can also reach us at{" "}
                  <a
                    href="mailto:hello@welcomenesthr.example"
                    className="font-semibold text-[#008FA1] hover:underline"
                  >
                    hello@welcomenesthr.example
                  </a>
                  .
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Button onClick={() => setSubmitted(false)}>
                    Submit another request
                  </Button>
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                  >
                    Back to homepage
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#008FA1]">
                    Demo details
                  </p>
                  <h2 className="mt-2 text-2xl font-bold">
                    Help us tailor the walkthrough
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    We only need enough information to understand your company,
                    region, and the HR problems you want WelcomeNestHR to solve.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                  <input
                    type="text"
                    name="website"
                    value={form.website}
                    onChange={(event) => updateField("website", event.target.value)}
                    className="hidden"
                    tabIndex={-1}
                    autoComplete="off"
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Full name" required>
                      <Input
                        value={form.fullName}
                        onChange={(event) => updateField("fullName", event.target.value)}
                        placeholder="Jane Smith"
                        autoComplete="name"
                        required
                        className="dark:border-slate-700 dark:bg-slate-900"
                      />
                    </Field>

                    <Field label="Work email" required>
                      <Input
                        type="email"
                        value={form.workEmail}
                        onChange={(event) => updateField("workEmail", event.target.value)}
                        placeholder="jane@company.com"
                        autoComplete="email"
                        required
                        className="dark:border-slate-700 dark:bg-slate-900"
                      />
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Company name" required>
                      <Input
                        value={form.companyName}
                        onChange={(event) => updateField("companyName", event.target.value)}
                        placeholder="Atlas Enterprise"
                        autoComplete="organization"
                        required
                        className="dark:border-slate-700 dark:bg-slate-900"
                      />
                    </Field>

                    <Field label="Role / title">
                      <Input
                        value={form.role}
                        onChange={(event) => updateField("role", event.target.value)}
                        placeholder="Founder, HR Lead, People Ops"
                        autoComplete="organization-title"
                        className="dark:border-slate-700 dark:bg-slate-900"
                      />
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Company size" required>
                      <select
                        value={form.companySize}
                        onChange={(event) => updateField("companySize", event.target.value)}
                        required
                        className="h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00ACC1] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      >
                        <option value="">Select size</option>
                        {companySizes.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Country" required>
                      <Input
                        value={form.country}
                        onChange={(event) => updateField("country", event.target.value)}
                        placeholder="United States"
                        autoComplete="country-name"
                        required
                        className="dark:border-slate-700 dark:bg-slate-900"
                      />
                    </Field>
                  </div>

                  <Field label="Main interest">
                    <select
                      value={form.interest}
                      onChange={(event) => updateField("interest", event.target.value)}
                      className="h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00ACC1] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    >
                      <option value="">Select what matters most</option>
                      {interests.map((interest) => (
                        <option key={interest} value={interest}>
                          {interest}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="What would you like us to cover?">
                    <textarea
                      value={form.message}
                      onChange={(event) => updateField("message", event.target.value)}
                      rows={5}
                      placeholder="Tell us about your onboarding goals, employee count, launch timeline, or any HR challenges."
                      className="w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm text-slate-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00ACC1] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </Field>

                  {error && (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FFB300] to-[#FB8C00] text-white hover:opacity-90"
                  >
                    {submitting ? "Submitting request..." : "Request demo"}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>

                  <p className="text-center text-xs leading-5 text-slate-500 dark:text-slate-400">
                    Prefer email? Contact us at{" "}
                    <a
                      href="mailto:hello@welcomenesthr.example"
                      className="font-semibold text-[#008FA1] hover:underline"
                    >
                      hello@welcomenesthr.example
                    </a>
                    .
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-800 dark:text-slate-200">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}

function ValueCard({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-sm shadow-black/5">
      <Icon className="h-5 w-5 text-[#FFB300]" aria-hidden="true" />
      <h2 className="mt-3 text-sm font-semibold">{title}</h2>
      <p className="mt-1 text-xs leading-5 text-cyan-50">{description}</p>
    </div>
  );
}
