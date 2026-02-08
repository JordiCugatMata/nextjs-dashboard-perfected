// auth.config.js
export const authConfig = {
  pages: {
    signIn: '/login',
    // signOut: '/logout',     // optional – you can add later
    // error: '/error',        // optional
  },

  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/ui');

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // → will redirect to /login (because of pages.signIn)
      } 
      
      else if (isLoggedIn) {
        return Response.redirect(new URL('/ui/dashboard', nextUrl));
      }

      return true;
    },
  },

  providers: [], // leave empty for now
};

