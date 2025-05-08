import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  // Limpar o cookie de autenticação
  cookies().set({
    name: "auth-token", // Usando hífen para consistência
    value: "",
    expires: new Date(0),
    path: "/",
  })

  return NextResponse.json({ success: true })
}
