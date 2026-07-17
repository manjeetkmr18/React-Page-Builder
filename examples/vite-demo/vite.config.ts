import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // The library is linked via file: — dedupe so there is exactly one React.
  resolve: { dedupe: ["react", "react-dom"] },
});
