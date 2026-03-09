"use client";
import { motion, AnimatePresence } from "framer-motion";
import FullWhitelogo from "../Assets/FullWhitelogo.png";
import { useEffect, useState } from "react";
import { LoginForm } from "@/components/login-form";


const IntroPage = () => {

    const [showTagline, setShowTagline] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    useEffect(()=>{
        const t1 = setTimeout(()=>setShowTagline(true), 2800);  // logo settles → tagline fades in
        const t2 = setTimeout(()=>setShowLogin(true), 4600);    // tagline visible 1.2s → login
        return()=>{ clearTimeout(t1); clearTimeout(t2); };
    },[]);


    return (
        <>
            <div className="min-h-screen w-full flex items-center justify-center flex-col gap-10 px-6 text-center">
                <motion.div
                    className="-mt-4 h-14 w-44 sm:h-20 sm:w-72 md:h-24 md:w-96 bg-contain bg-center bg-no-repeat"
                    style={{ backgroundImage: `url(${FullWhitelogo.src})` }}
                    initial={{ opacity: 0, y: 0 }}
                    animate={{ opacity: 1, y: showLogin ? -60 : -24 }}
                    transition={{
                        opacity: { duration: 0.6, ease: "easeOut" },
                        y: { duration: 0.6, ease: "easeInOut", delay: showLogin ? 0 : 2.2 },
                    }}
                />
                <AnimatePresence mode="wait">
                    {!showLogin ? (
                        <motion.h1
                            key="tagline"
                            className="text-2xl text-center text-amber-50 max-w-xl whitespace-pre-line"
                            style={{ fontFamily: "var(--font-lora)" }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: showTagline ? 1 : 0, y: showTagline ? 0 : 10 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                        >
                            Orchestrate everything like <br /> magic.
                        </motion.h1>
                    ) : (
                        <motion.div
                            key="login"
                            className="w-full max-w-2xl"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                        >
                            <LoginForm />
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </>
    );
};

export default IntroPage;