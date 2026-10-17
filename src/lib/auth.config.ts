import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

// Edge-safe Auth.js config — NO Node-only imports here
// (no Prisma, no bcrypt, no PrismaAdapter). Used by middleware.
// Full server config lives in src/lib/auth.ts which spreads this.
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Role is attached at login in auth.ts (DB lookup).
      // In middleware/Edge we only propagate what is already on the token.
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        (session.user as unknown as Record<string, unknown>).role =
          (token as unknown as Record<string, unknown>).role ?? "CUSTOMER";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
};

export default authConfig;
