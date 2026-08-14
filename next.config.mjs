/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Tambahkan baris ini agar Next.js tidak menampilkan error Turbopack
  turbopack: {},

  // @react-pdf/renderer perlu dibundel di client; ini mencegah error canvas di server.
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    return config;
  },
};

export default nextConfig;