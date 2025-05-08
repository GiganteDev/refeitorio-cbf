"use client"

import { useState, useEffect } from "react"

export function useUserRole() {
  const [role, setRole] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUserRole() {
      try {
        const response = await fetch("/api/auth/me")

        if (!response.ok) {
          throw new Error("Falha ao obter informações do usuário")
        }

        const data = await response.json()
        setRole(data.role)
        setUsername(data.username)
      } catch (err) {
        console.error("Erro ao buscar papel do usuário:", err)
        setError("Erro ao verificar permissões")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserRole()
  }, [])

  const isAdmin = role === "admin" || username === "pedro.lima"

  return { role, username, isAdmin, isLoading, error }
}
