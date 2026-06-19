import type { NextConfig } from "next";
import withBundleAnalyzer from '@next/bundle-analyzer';

const nextConfig: NextConfig = {
    output: "standalone", // <-- Критически важно для легковесного Docker-образа
    poweredByHeader: false,
    compress: true,
    compiler: {
        removeConsole: process.env.NODE_ENV === "production",
    },
    experimental: {
        optimizePackageImports: ["framer-motion", "radix-ui", "vaul"],
    },
};

const withAnalyzer = withBundleAnalyzer({
    enabled: process.env.ANALYZE === 'true',
});

export default withAnalyzer(nextConfig);