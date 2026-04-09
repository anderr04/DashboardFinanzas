import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(req: NextRequest) {
  // Se obtiene la protección solo si las variables privadas existen
  const user = process.env.AUTH_USER;
  const pass = process.env.AUTH_PASS;

  if (user && pass) {
    const basicAuth = req.headers.get('authorization');
    
    if (basicAuth) {
      const authValue = basicAuth.split(' ')[1];
      const [providedUser, providedPassword] = atob(authValue).split(':');

      if (providedUser === user && providedPassword === pass) {
        return NextResponse.next();
      }
    }

    // Interceptar y exigir login nativo del navegador
    return new NextResponse('Acceso Restringido. Dashboard Privado.', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Dashboard"'
      }
    });
  }

  // Modo local sin contraseña
  return NextResponse.next();
}

export const config = {
  // Evitar interceptar archivos estáticos y la ruta de la API gráfica de Next
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
