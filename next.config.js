/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";
import { withUploadThing } from "uploadthing/next";

/** @type {import("next").NextConfig} */
const config = {
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors or CLI/compiler flag mismatches.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
};

// Wrap the config with withUploadThing to handle image uploads safely
export default withUploadThing(config);