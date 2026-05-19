"use client";
import { motion, AnimatePresence } from "framer-motion";
import FullWhitelogo from "../Assets/FullWhitelogo.png";
import { useEffect, useState } from "react";
import { LoginForm } from "@/components/login-form";

const taglineWords = ["Orchestrate", "everything", "like", "magic."];

const IntroPage = () => {
  const [showTagline, setShowTagline] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowTagline(true), 2000);
    const t2 = setTimeout(() => setShowLogin(true),   4200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="min-h-screen w-full flex items-center justify-center flex-col gap-10 px-6 text-center">

      {/* Logo */}
      <motion.div
        className="-mt-4 h-14 w-44 sm:h-20 sm:w-72 md:h-24 md:w-96 bg-contain bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${FullWhitelogo.src})` }}
        initial={{ opacity: 0, y: 18, scale: 1.04 }}
        animate={{
          opacity: 1,
          y: showLogin ? -60 : -24,
          scale: 1,
        }}
        transition={{
          opacity: { duration: 1.6, ease: [0.22, 1, 0.36, 1] },
          scale:   { duration: 1.6, ease: [0.22, 1, 0.36, 1] },
          y:       {
            duration: 0.7,
            ease: [0.22, 1, 0.36, 1],
            delay: showLogin ? 0 : 1.8,
          },
        }}
      />

      {/* Tagline / Login */}
      <AnimatePresence mode="wait">
        {!showLogin ? (
          <motion.p
            key="tagline"
            className="flex flex-wrap justify-center gap-x-2 text-2xl text-amber-50/90 max-w-xl"
            style={{ fontFamily: "var(--font-lora)", fontStyle: "italic" }}
          >
            {taglineWords.map((word, i) => (
              <motion.span
                key={word}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: showTagline ? 1 : 0, y: showTagline ? 0 : 10 }}
                transition={{
                  duration: 0.8,
                  ease: [0.22, 1, 0.36, 1],
                  delay: showTagline ? i * 0.12 : 0,
                }}
              >
                {word}
              </motion.span>
            ))}
          </motion.p>
        ) : (
          <motion.div
            key="login"
            className="w-full max-w-2xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <LoginForm />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IntroPage;
