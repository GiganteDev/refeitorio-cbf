import { NextResponse } from "next/server"
import { isUserAuthorized } from "@/lib/auth"
import { SignJWT } from "jose"

const JWT_SECRET = process.env.JWT_SECRET || "cbf-survey-secret-key"

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    // Verificar se o usuário está autorizado
    const authResult = await isUserAuthorized(username, password)

    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error || "Credenciais inválidas" }, { status: 401 })
    }

    // Criar token JWT
    const token = await new SignJWT({
      username: authResult.username,
      email: authResult.email,
      role: authResult.role || "readonly", // Garantir que o papel seja incluído
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("8h")
      .sign(new TextEncoder().encode(JWT_SECRET))

    console.log("Login bem-sucedido para:", authResult.username, "- Token gerado")

    // Criar a resposta com o cookie
    const response = NextResponse.json({
      success: true,
      username: authResult.username,
      email: authResult.email,
      role: authResult.role,
    })

    // Definir o cookie na resposta
    response.cookies.set({
      name: "auth-token",
      value: token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 8 * 60 * 60, // 8 horas
      sameSite: "lax",
    })

    console.log("Cookie auth-token definido na resposta")

    return response
  } catch (error) {
    console.error("Erro no login:", error)
    return NextResponse.json({ error: "Erro no processamento do login" }, { status: 500 })
  }
}
