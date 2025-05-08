import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const JWT_SECRET = process.env.JWT_SECRET || "cbf-survey-secret-key"

export async function middleware(request: NextRequest) {
  // Verificar se a rota precisa ser protegida
  if (
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/users") ||
    request.nextUrl.pathname.startsWith("/cafeterias")
  ) {
    // Verificar se o usuário está autenticado
    const token = request.cookies.get("auth-token")?.value

    console.log(`Middleware: Verificando acesso para ${request.nextUrl.pathname}`)
    console.log(
      `Middleware: Cookies disponíveis: ${request.cookies
        .getAll()
        .map((c) => c.name)
        .join(", ")}`,
    )

    if (!token) {
      // Redirecionar para a página de login
      console.log("Middleware: Token não encontrado, redirecionando para login")
      return NextResponse.redirect(new URL("/login", request.url))
    }

    try {
      // Verificar a validade do token
      await jwtVerify(new TextEncoder().encode(token), new TextEncoder().encode(JWT_SECRET))
      console.log("Middleware: Token válido, permitindo acesso")
      return NextResponse.next()
    } catch (error) {
      // Token inválido, redirecionar para login
      console.error("Middleware: Token inválido:", error)

      // Criar resposta de redirecionamento
      const response = NextResponse.redirect(new URL("/login", request.url))

      // Limpar o cookie inválido
      response.cookies.set({
        name: "auth-token",
        value: "",
        expires: new Date(0),
        path: "/",
      })

      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/users/:path*", "/cafeterias/:path*"],
}
