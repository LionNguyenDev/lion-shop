
import type { NextConfig } from "next";
 
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        // pathname: "/your_cloud_name/**", // tuỳ chọn: giới hạn theo cloud name
      },
      // Nguồn ảnh từ file import products-list.xlsx
      { protocol: "https", hostname: "d3hr4eej8cfgwy.cloudfront.net" },
      { protocol: "https", hostname: "cdn.sobanhang.com" },
      { protocol: "https", hostname: "assets.icheck.vn" },
      { protocol: "https", hostname: "cdn.statically.io" },
    ],
  },
};
 
export default nextConfig;
 