import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
              }),
            },
          );

          if (!res.ok) return null;

          const data = await res.json();
          // data = { access_token, idUsuario, nombreCompleto, roles }
          return {
            id: data.idUsuario,
            accessToken: data.access_token,
            idUsuario: data.idUsuario,
            nombreCompleto: data.nombreCompleto,
            roles: data.roles,
            email: credentials.email as string,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as any).accessToken;
        token.idUsuario = (user as any).idUsuario;
        token.roles = (user as any).roles;
        token.nombreCompleto = (user as any).nombreCompleto;
      }
      return token;
    },
    session({ session, token }) {
      session.user.accessToken = token.accessToken as string;
      session.user.idUsuario = token.idUsuario as string;
      session.user.roles = token.roles as number[];
      session.user.nombreCompleto = token.nombreCompleto as string;
      return session;
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
});
