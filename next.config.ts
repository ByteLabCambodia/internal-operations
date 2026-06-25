import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow dev access via 127.0.0.1 as well as localhost (HMR cross-origin).
  allowedDevOrigins: ["127.0.0.1", "localhost", "4b68556195a7.ngrok.app"],
};

export default nextConfig;
