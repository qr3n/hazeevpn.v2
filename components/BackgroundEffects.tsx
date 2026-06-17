'use client';

import { motion } from 'framer-motion';
import Aurora from "@/components/Aurora";

const forceGPU = (_: any, generatedTransform: string) =>
    `${generatedTransform} translateZ(0)`;

export function BackgroundEffects() {
    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                transformTemplate={forceGPU}
                className="absolute -top-[40%] left-1/2 -translate-x-1/2 w-[140%] h-[140%] pointer-events-none z-0 gpu"
            >
                <Aurora
                    colorStops={["#ffdc67","#B497CF","#00eb00"]}
                    blend={0.5}
                    amplitude={1.0}
                    speed={0.5}
                />
            </motion.div>
            <div className="absolute w-[200%] h-[100dvh] bg-gradient-to-br from-black opacity-90 to-transparent z-0 pointer-events-none" />
        </>
    );
}
