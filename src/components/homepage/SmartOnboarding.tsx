import React from "react";
import Link from "next/link";


const features = [
  {
    title: "AI-Personalized Roadmap",
    desc: "Tailored journeys for every role and person.",
    icon: "🤖",
  },
  {
    title: "Cultural Immersion Hub",
    desc: "Integrate into values, rituals, and team dynamics.",
    icon: "🌍",
  },
  {
    title: "Emotional Wellness",
    desc: "Built-in support for mental well-being and check-ins.",
    icon: "💖",
  },
  {
    title: "Community Engagement",
    desc: "Foster peer connection from day one.",
    icon: "🤝",
  },
];

export default function SmartOnboarding() {
  return (
    <section id="onboarding" className="py-24 bg-[#FFFDE7] dark:bg-[#1A1A1A]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl sm:text-5xl font-bold text-[#00ACC1]">
          Onboarding That Feels Like Belonging
        </h2>
        <p className="mt-4 text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Go beyond paperwork. WelcomeNestHR creates a human-first onboarding
          experience — blending smart automation with emotional intelligence to
          build real belonging from day one.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-6">
          <Link href="/get-started">
            <button className="cursor-pointer px-6 py-3 bg-gradient-to-r from-[#FFB300] to-[#FB8C00] text-white text-sm font-semibold rounded-lg shadow hover:brightness-90 transition">
              Begin the Journey
            </button>
          </Link>
          <Link href="#features">
            <button className="cursor-pointer px-6 py-3 border border-[#00ACC1] text-[#00ACC1] font-medium rounded-lg hover:bg-[#E0F7FA] dark:hover:bg-gray-800 transition">
              See How It Works
            </button>
          </Link>
        </div>

        {/* Vertical Features List */}
        <div className="mt-20 space-y-10 text-left max-w-3xl mx-auto">
          {features.map(({ title, desc, icon }) => (
            <div key={title} className="flex items-start gap-4">
              <div className="text-3xl">{icon}</div>
              <div>
                <h4 className="text-lg font-semibold text-[#00ACC1]">
                  {title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
