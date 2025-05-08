import { cookies } from "next/headers"
import { jwtVerify } from "jose"

const JWT_SECRET = process.env.JWT_SECRET || "cbf-survey-secret-key"

export async function checkAdminRole(request: Request): Promise<boolean> {
  try {
    // Para API routes, precisamos extrair o cookie da requisição
    const cookieHeader = request.headers.get("cookie")
    if (!cookieHeader) return false

    // Extrair o token do cookie
    const tokenMatch = cookieHeader.match(/auth-token=([^;]+)/)
    if (!tokenMatch) return false

    const token = tokenMatch[1]

    // Verificar e decodificar o token
    const { payload } = await jwtVerify(new TextEncoder().encode(token), new TextEncoder().encode(JWT_SECRET))

    // Verificar se o usuário é admin
    return payload.role === "admin"
  } catch (error) {
    console.error("Erro ao verificar permissão de administrador:", error)
    return false
  }
}

export async function getUserRoleFromToken(): Promise<string | null> {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) return null

    const { payload } = await jwtVerify(new TextEncoder().encode(token), new TextEncoder().encode(JWT_SECRET))

    return payload.role as string
  } catch (error) {
    console.error("Erro ao obter função do usuário:", error)
    return null
  }
}
