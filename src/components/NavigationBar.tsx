"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Menu, Moon, Sun, X } from "lucide-react";

type NavLink =
  | {
      name: string;
      href: string;
      dropdown?: false;
    }
  | {
      name: string;
      dropdown: true;
      children: { name: string; href: string }[];
    };

const navLinks: NavLink[] = [
  { name: "Home", href: "/" },
  {
    name: "Platform",
    dropdown: true,
    children: [
      { name: "Smart Onboarding", href: "#onboarding" },
      { name: "LifeSync", href: "#lifesync" },
      { name: "Collaborate", href: "#collaborate" },
      { name: "Compliance", href: "#compliance" },
      { name: "Primer", href: "#primer" },
    ],
  },
  { name: "Features", href: "#features" },
];

const NavigationBar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [modulesOpen, setModulesOpen] = useState(false);
  const [mobileModulesOpen, setMobileModulesOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (storedTheme === "dark" || (!storedTheme && prefersDark)) {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDarkMode(false);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setModulesOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setModulesOpen(false);
        setMobileModulesOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMobileMenu = () => {
    setMenuOpen(false);
    setMobileModulesOpen(false);
  };

  const toggleDarkMode = () => {
    const nextTheme = isDarkMode ? "light" : "dark";
    localStorage.setItem("theme", nextTheme);
    document.documentElement.classList.toggle("dark");
    setIsDarkMode((current) => !current);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#121212]/90">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center rounded-md"
          aria-label="WelcomeNestHR home"
          onClick={closeMobileMenu}
        >
          <Image
            src="/welcomenesthr.png"
            alt="WelcomeNestHR"
            width={132}
            height={58}
            className="h-auto w-[108px] sm:w-[120px]"
            sizes="(max-width: 640px) 108px, 120px"
          />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {navLinks.map((link) =>
            link.dropdown ? (
              <div key={link.name} className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setModulesOpen((open) => !open)}
                  className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-cyan-50 hover:text-[#00ACC1] dark:text-slate-200 dark:hover:bg-white/10"
                  aria-expanded={modulesOpen}
                  aria-haspopup="menu"
                >
                  {link.name}
                  <motion.span
                    animate={{ rotate: modulesOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={16} aria-hidden="true" />
                  </motion.span>
                </button>

                <AnimatePresence>
                  {modulesOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.18 }}
                      className="absolute left-0 top-full mt-3 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white py-2 shadow-xl dark:border-white/10 dark:bg-[#1E1E1E]"
                      role="menu"
                    >
                      {link.children?.map((child) => (
                        <Link
                          key={child.name}
                          href={child.href}
                          className="block px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-orange-50 hover:text-[#FB8C00] dark:text-slate-200 dark:hover:bg-white/10"
                          role="menuitem"
                          onClick={() => setModulesOpen(false)}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                key={link.name}
                href={link.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-cyan-50 hover:text-[#00ACC1] dark:text-slate-200 dark:hover:bg-white/10"
              >
                {link.name}
              </Link>
            )
          )}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <button
            type="button"
            onClick={toggleDarkMode}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? (
              <Sun size={18} aria-hidden="true" />
            ) : (
              <Moon size={18} aria-hidden="true" />
            )}
          </button>

          <Link
            href="/demo"
            className="rounded-md border border-[#FB8C00] px-4 py-2 text-sm font-semibold text-[#FB8C00] transition hover:bg-orange-50 dark:hover:bg-white/10"
          >
            Request Demo
          </Link>
          <Link
            href="/login"
            className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-cyan-50 hover:text-[#00ACC1] dark:text-slate-300 dark:hover:bg-white/10"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-gradient-to-r from-[#FFB300] to-[#FB8C00] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-95"
          >
            Get Started
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={toggleDarkMode}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? (
              <Sun size={18} aria-hidden="true" />
            ) : (
              <Moon size={18} aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-800 transition hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-white/10"
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
          >
            {menuOpen ? (
              <X size={24} aria-hidden="true" />
            ) : (
              <Menu size={24} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            id="mobile-navigation"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden border-t border-slate-200 bg-white px-4 py-4 shadow-lg dark:border-white/10 dark:bg-[#121212] lg:hidden"
            aria-label="Mobile primary"
          >
            <div className="space-y-1">
              {navLinks.map((link) =>
                link.dropdown ? (
                  <div key={link.name}>
                    <button
                      type="button"
                      onClick={() => setMobileModulesOpen((open) => !open)}
                      className="flex w-full items-center justify-between rounded-md px-3 py-3 text-left text-sm font-semibold text-slate-800 transition hover:bg-cyan-50 hover:text-[#00ACC1] dark:text-slate-100 dark:hover:bg-white/10"
                      aria-expanded={mobileModulesOpen}
                    >
                      {link.name}
                      <ChevronDown
                        size={16}
                        aria-hidden="true"
                        className={`transition ${
                          mobileModulesOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    <AnimatePresence>
                      {mobileModulesOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="ml-3 border-l border-cyan-100 pl-3 dark:border-white/10"
                        >
                          {link.children?.map((child) => (
                            <Link
                              key={child.name}
                              href={child.href}
                              className="block rounded-md px-3 py-2 text-sm text-slate-600 transition hover:bg-orange-50 hover:text-[#FB8C00] dark:text-slate-300 dark:hover:bg-white/10"
                              onClick={closeMobileMenu}
                            >
                              {child.name}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="block rounded-md px-3 py-3 text-sm font-semibold text-slate-800 transition hover:bg-cyan-50 hover:text-[#00ACC1] dark:text-slate-100 dark:hover:bg-white/10"
                    onClick={closeMobileMenu}
                  >
                    {link.name}
                  </Link>
                )
              )}
            </div>

            <div className="mt-4 grid gap-3 border-t border-slate-200 pt-4 dark:border-white/10 sm:grid-cols-3">
              <Link
                href="/demo"
                className="rounded-md border border-[#FB8C00] px-4 py-3 text-center text-sm font-semibold text-[#FB8C00]"
                onClick={closeMobileMenu}
              >
                Request Demo
              </Link>
              <Link
                href="/login"
                className="rounded-md border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700 dark:border-white/10 dark:text-slate-200"
                onClick={closeMobileMenu}
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-gradient-to-r from-[#FFB300] to-[#FB8C00] px-4 py-3 text-center text-sm font-semibold text-white shadow-sm"
                onClick={closeMobileMenu}
              >
                Get Started
              </Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
};

export default NavigationBar;
