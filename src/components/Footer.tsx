import React from "react";
import Link from "next/link";
import { Facebook, Linkedin } from "lucide-react";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-black text-white px-6 pt-16 pb-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 border-b border-white/10 pb-10">
        {/* Branding */}
        <div>
          <h3 className="text-2xl font-bold tracking-tight mb-2">
            WelcomeNest
          </h3>
          <p className="text-sm text-white/70 max-w-sm">
            Where onboarding meets belonging. Empowering new hires with clarity,
            connection, and culture.
          </p>
        </div>

        {/* Navigation */}
        <div>
          <h4 className="text-sm font-semibold uppercase mb-3 tracking-wider text-white/80">
            Quick Links
          </h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li>
              <Link href="#features" className="hover:text-white transition">
                Features
              </Link>
            </li>
            <li>
              <Link href="#modules" className="hover:text-white transition">
                Modules
              </Link>
            </li>
            <li>
              <Link href="#pricing" className="hover:text-white transition">
                Pricing
              </Link>
            </li>
            <li>
              <Link href="#contact" className="hover:text-white transition">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-sm font-semibold uppercase mb-3 tracking-wider text-white/80">
            Contact
          </h4>
          <p className="text-sm text-white/70">hello@welcomenest.ai</p>
          <p className="text-sm text-white/70">+1 (555) 123-4567</p>
        </div>

        {/* Socials */}
        <div>
          <h4 className="text-sm font-semibold uppercase mb-3 tracking-wider text-white/80">
            Follow Us
          </h4>
          <div className="flex gap-4 items-center">
            <Link href="#" aria-label="Facebook">
              <Facebook size={20} className="text-white/70 hover:text-white" />
            </Link>
            <Link href="#" aria-label="LinkedIn">
              <Linkedin size={20} className="text-white/70 hover:text-white" />
            </Link>
            <Link href="#" aria-label="Twitter / X">
              <Image
                src="/icons/x-icon.svg"
                alt="X logo"
                width={20}
                height={20}
                className="opacity-70 hover:opacity-100"
              />
            </Link>
          </div>
        </div>
      </div>

      <div className="pt-6 text-center text-xs text-white/40">
        © {new Date().getFullYear()} WelcomeNest. All rights reserved.
      </div>
    </footer>
  );
}
