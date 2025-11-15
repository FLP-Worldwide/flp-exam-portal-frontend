/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    allowedDevOrigins: [
      'http://localhost:3000',
      'http://13.48.84.179:3001',
      'https://dev.testyourgerman.com',
      'https://testyourgerman-flpexam-api-env.eba-erbuwieg.eu-north-1.elasticbeanstalk.com'
    ],
  },
};

export default nextConfig;
