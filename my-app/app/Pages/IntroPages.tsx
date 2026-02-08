"use client";
import { motion } from "framer-motion";
import FullWhitelogo from "../Assets/FullWhitelogo.png";



const IntroPage = () => {
    return (
        <>
            <div className="min-h-screen w-full flex items-center justify-center flex-col gap-10 px-6 text-center">
                <motion.div
                    className="-mt-4 h-14 w-44 sm:h-20 sm:w-72 md:h-24 md:w-96 bg-contain bg-center bg-no-repeat"
                    style={{ backgroundImage: `url(${FullWhitelogo.src})` }}
                    initial={{ opacity: 0, y: 0 }}
                    animate={{ opacity: 1, y: -24 }}
                    transition={{
                        opacity: { duration: 0.6, ease: "easeOut" },
                        y: { duration: 0.5, ease: "easeInOut", delay: 2.2 },
                    }}
                />
                <motion.h1
                    className="text-2xl text-center text-amber-50 max-w-xl whitespace-pre-line"
                    style={{ fontFamily: "var(--font-lora)" }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: 2.8 }}
                >
                    Orchestrate everything like <br/>  magic.
                </motion.h1>

            </div>
        </>
    );
};

export default IntroPage;