import LoginForm from "@/components/login-form"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { jwtVerify } from "jose" // Usando jose em vez de jsonwebtoken

const JWT_SECRET = process.env.JWT_SECRET || "cbf-survey-secret-key"

export default async function LoginPage() {
  // Verificar se o usuário já está autenticado
  const cookieStore = await cookies()
  const authToken = cookieStore.get("auth-token")?.value

  console.log("Login Page: Verificando token de autenticação")

  // Apenas redirecionar se o token existir
  if (authToken) {
    try {
      // Verificar o token usando jose (compatível com Edge Runtime)
      await jwtVerify(new TextEncoder().encode(authToken), new TextEncoder().encode(JWT_SECRET))
      console.log("Login Page: Token válido, redirecionando para dashboard")
      redirect("/dashboard")
    } catch (error) {
      // Token inválido, não redirecionar
      console.error("Login Page: Token inválido, não redirecionando", error)
      // Limpar o cookie inválido
      cookieStore.set({
        name: "auth-token",
        value: "",
        expires: new Date(0),
        path: "/",
      })
    }
  } else {
    console.log("Login Page: Nenhum token encontrado, exibindo formulário de login")
  }

  return <LoginForm />
}
