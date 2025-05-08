"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import Image from "next/image"

export default function LoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loginSuccess, setLoginSuccess] = useState(false)
  const router = useRouter()

  // Efeito para redirecionar após login bem-sucedido
  useEffect(() => {
    if (loginSuccess) {
      // Pequeno atraso para garantir que o cookie seja processado
      const timer = setTimeout(() => {
        console.log("Redirecionando para dashboard após login bem-sucedido")
        window.location.href = "/dashboard"
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [loginSuccess])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Normalizar o nome de usuário (adicionar domínio se necessário)
      const normalizedUsername = username.includes("@") ? username : `${username}@ferroeste.com.br`

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: normalizedUsername,
          password,
        }),
        credentials: "include", // Importante para incluir cookies
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao fazer login")
      }

      console.log("Login bem-sucedido, preparando redirecionamento")
      setLoginSuccess(true)
    } catch (err) {
      console.error("Erro de login:", err)
      setError(err instanceof Error ? err.message : "Erro ao fazer login. Tente novamente.")
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-900/80 via-blue-800/70 to-blue-700/80 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-white rounded-full p-2 inline-block">
              <Image src="/logo-cbf.png" alt="Logo CBF" width={80} height={80} />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Dashboard CBF</CardTitle>
          <CardDescription>Entre com suas credenciais para acessar o dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {loginSuccess ? (
            <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
              <AlertDescription>Login bem-sucedido! Redirecionando...</AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Usuário</Label>
                  <Input
                    id="username"
                    placeholder="nome.sobrenome ou email completo"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading || loginSuccess}>
                  {loading ? "Autenticando..." : "Entrar"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">Departamento de Tecnologia da Informação</p>
        </CardFooter>
      </Card>
    </div>
  )
}
