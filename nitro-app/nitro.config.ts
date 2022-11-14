import { defineNitroConfig } from "nitropack";
export default defineNitroConfig({
  preset: "aws-lambda",
  inlineDynamicImports: process.env.INLINE_DYNAMIC_IMPORTS === "true",
});
