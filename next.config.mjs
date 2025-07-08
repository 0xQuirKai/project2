/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        unoptimized: true,
    },
    output: 'export',
    basePath: '',
    assetPrefix: './',

    distDir: 'out', // 👈 output directory for static files
}


export default nextConfig