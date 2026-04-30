// =============================================================================
// Middleware do TitaNet
// Protege todas as rotas privadas do painel
// =============================================================================
import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: {
    signIn: '/login',
  },
})

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/customers/:path*',
    '/plans/:path*',
    '/contracts/:path*',
    '/settings/:path*',
    '/administration/:path*',
    '/service-orders/:path*',
    '/finance/:path*',
    '/communication/:path*',
    '/network/:path*',
    '/inventory/:path*',
    '/gateways/:path*',
  ],
}
