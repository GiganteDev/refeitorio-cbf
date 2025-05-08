import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"

const JWT_SECRET = process.env.JWT_SECRET || "cbf-survey-secret-key"

export async function GET(req: NextRequest) {
  try {
    // Obter o token JWT dos cookies - usando await para resolver o erro
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value // Corrigido para "auth-token" com hífen

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    // Verificar o token
    const { payload } = await jwtVerify(new TextEncoder().encode(token), new TextEncoder().encode(JWT_SECRET))

    // Verificar se é o pedro.lima
    const email = payload.email as string
    const username = email.split("@")[0]
    const isPedroLima = username === "pedro.lima"

    return NextResponse.json({
      email: payload.email,
      username: payload.username,
      role: payload.role || "readonly", // Padrão para usuários antigos
    })
  } catch (error) {
    console.error("Erro ao verificar autenticação:", error)
    return NextResponse.json({ error: "Erro ao verificar autenticação" }, { status: 401 })
  }
}
