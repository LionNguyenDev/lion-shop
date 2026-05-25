
import type { NextConfig } from "next";
 
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        // pathname: "/your_cloud_name/**", // tuỳ chọn: giới hạn theo cloud name
      },
    ],
  },
};
 
export default nextConfig;
 