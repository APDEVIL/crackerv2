import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "./config";

export const authClient = createAuthClient({
  plugins: [
    // Pulls additionalFields (including `role`) from the server auth config
    // so session.user.role is typed and populated on the client
    inferAdditionalFields<typeof auth>(),
  ],
});