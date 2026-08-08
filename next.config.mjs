/** @type {import('next').NextConfig} */

// Allow next/image to load from the configured R2 public host (if any).
const remotePatterns = [];
if (process.env.R2_PUBLIC_URL) {
  try {
    const u = new URL(process.env.R2_PUBLIC_URL);
    remotePatterns.push({ protocol: u.protocol.replace(":", ""), hostname: u.hostname });
  } catch {}
}

const nextConfig = {
  images: {
    remotePatterns,
    // Local /uploads and data URLs work without config.
  },
  experimental: {
    // Allow large slip/image uploads through server actions.
    serverActions: { bodySizeLimit: "10mb" },
  },
};

export default nextConfig;
