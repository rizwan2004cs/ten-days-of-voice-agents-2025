import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // Ensure the dev server binds to localhost for secure context
  // This is required for getUserMedia to work
};

export default nextConfig;
