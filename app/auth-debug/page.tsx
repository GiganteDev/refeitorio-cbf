"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function AuthDebugPage() {
  const [cookieInfo, setCookieInfo] = useState<string>("Carregando...")
  const [tokenInfo, setTokenInfo] = useState<string>("Carregando...")
  const [userInfo, setUserInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar cookies disponíveis
    const cookies = document.cookie
      .split(";")
      .map((cookie) => cookie.trim())
      .filter((cookie) => cookie)
      .join(", ")

    setCookieInfo(cookies || "Nenhum cookie encontrado")

    // Verificar token de autenticação
    const authCookie = document.cookie
      .split(";")
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith("auth-token="))

    if (authCookie) {
      setTokenInfo("Token encontrado (valor oculto por segurança)")
    } else {
      setTokenInfo("Token de autenticação não encontrado")
    }

    // Buscar informações do usuário
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) {
          return res.json()
        }
        throw new Error(`Status: ${res.status}`)
      })
      .then((data) => {
        setUserInfo(data)
      })
      .catch((err) => {
        setUserInfo({ error: `Erro ao buscar informações do usuário: ${err.message}` })
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const handleClearCookies = () => {
    // Limpar todos os cookies
    document.cookie.split(";").forEach((cookie) => {
      const name = cookie.split("=")[0].trim()
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`
    })

    // Recarregar a página
    window.location.reload()
  }

  const handleRedirectToDashboard = () => {
    window.location.href = "/dashboard"
  }

  const handleRedirectToLogin = () => {
    window.location.href = "/login"
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Diagnóstico de Autenticação</CardTitle>
          <CardDescription>Informações para depuração de problemas de autenticação</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Cookies</h3>
              <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">{cookieInfo}</pre>
            </div>

            <div>
              <h3 className="text-lg font-medium">Token de Autenticação</h3>
              <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">{tokenInfo}</pre>
            </div>

            <div>
              <h3 className="text-lg font-medium">Informações do Usuário</h3>
              <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                {loading ? "Carregando..." : JSON.stringify(userInfo, null, 2)}
              </pre>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleClearCookies} variant="destructive">
                Limpar Cookies
              </Button>
              <Button onClick={handleRedirectToDashboard}>Ir para Dashboard</Button>
              <Button onClick={handleRedirectToLogin} variant="outline">
                Ir para Login
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
