"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ChevronDown, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const NavigationBar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [modulesOpen, setModulesOpen] = useState(false);
  const [mobileModulesOpen, setMobileModulesOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Why WelcomeNest?", href: "#why" },
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
    { name: "Pricing", href: "#pricing" },
    { name: "Resources", href: "#resources" },
  ];

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    if (storedTheme === "dark" || (!storedTheme && prefersDark)) {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDarkMode(false);
    }
  }, []);

  const toggleDarkMode = () => {
    const newTheme = isDarkMode ? "light" : "dark";
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark");
    setIsDarkMode(!isDarkMode);
  };

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
  }, [menuOpen]);

  return (
    <header className="fixed top-0 left-0 w-full bg-white/90 backdrop-blur z-50 border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 h-28 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src={isDarkMode ? "/hr-logo.png" : "/logo-light.png"}
            alt="WelcomeNest Logo"
            width={110}
            height={48}
            priority
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) =>
            link.dropdown ? (
              <div key={link.name} className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setModulesOpen(!modulesOpen)}
                  className="flex items-center gap-1 text-gray-700 dark:text-gray-200 hover:text-[#00ACC1] transition group"
                >
                  {link.name}
                  <motion.span
                    animate={{ rotate: modulesOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown size={16} />
                  </motion.span>
                </button>

                <AnimatePresence>
                  {modulesOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 shadow-lg rounded-md border z-30 w-52 overflow-hidden"
                    >
                      {link.children?.map((child) => (
                        <Link
                          key={child.name}
                          href={child.href}
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-[#FFF3E0] dark:hover:bg-gray-700 hover:text-[#FB8C00]"
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
                className="text-gray-700 dark:text-gray-200 hover:text-[#00ACC1] relative group transition"
              >
                <span className="absolute -bottom-1 left-0 h-[2px] w-0 bg-[#00ACC1] group-hover:w-full transition-all duration-300"></span>
                {link.name}
              </Link>
            )
          )}

          <button
            onClick={toggleDarkMode}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            aria-label="Toggle Dark Mode"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <Link
            href="/demo"
            className="px-4 py-2 border border-[#FB8C00] text-[#FB8C00] hover:bg-[#FFF3E0] dark:hover:bg-gray-800 transition rounded-md text-sm font-semibold shadow-sm"
          >
            Request Demo
          </Link>

          <Link
            href="/login"
            className="text-sm text-gray-600 dark:text-gray-300 hover:text-[#00ACC1]"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="ml-4 px-4 py-2 text-white bg-gradient-to-r from-[#FFB300] to-[#FB8C00] hover:brightness-90 transition rounded-md text-sm font-semibold shadow whitespace-nowrap"
          >
            Get Started
          </Link>
        </nav>

        {/* Mobile dark mode button */}
        <div className="md:hidden mr-2">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            aria-label="Toggle Dark Mode"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden"
          aria-label="Toggle mobile menu"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden bg-white dark:bg-gray-900 border-t overflow-hidden px-4 py-4 space-y-3 shadow"
          >
            {navLinks.map((link) =>
              link.dropdown ? (
                <div key={link.name}>
                  <button
                    type="button"
                    onClick={() => setMobileModulesOpen((prev) => !prev)}
                    className="flex items-center gap-1 text-gray-700 dark:text-gray-200 font-medium w-full"
                  >
                    {link.name}
                    <ChevronDown
                      size={16}
                      className={`transform transition ${
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
                        className="ml-4 mt-2 space-y-1"
                      >
                        {link.children?.map((child) => (
                          <Link
                            key={child.name}
                            href={child.href}
                            className="block text-sm text-gray-600 dark:text-gray-300 py-1 hover:text-[#00ACC1]"
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
                  className="block text-gray-700 dark:text-gray-300 hover:text-[#00ACC1]"
                >
                  {link.name}
                </Link>
              )
            )}

            <Link
              href="/demo"
              className="block text-gray-600 dark:text-gray-300 hover:text-[#00ACC1]"
            >
              Request Demo
            </Link>

            <Link
              href="/login"
              className="block text-gray-600 dark:text-gray-300 hover:text-[#00ACC1]"
            >
              Login
            </Link>

            <Link
              href="/signup"
              className="ml-4 px-4 py-2 text-white bg-gradient-to-r from-[#FFB300] to-[#FB8C00] hover:brightness-90 transition rounded-md text-sm font-semibold shadow whitespace-nowrap"
            >
              Sign Up
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default NavigationBar;
