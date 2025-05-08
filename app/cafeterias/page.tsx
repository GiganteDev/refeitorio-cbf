"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import CafeteriaManagement from "@/components/cafeteria-management"
import { useUserRole } from "@/hooks/use-user-role"

export default function CafeteriasPage() {
  const router = useRouter()
  const { isAdmin, username, isLoading } = useUserRole()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    // Verificar se o usuário é admin ou pedro.lima
    if (!isLoading) {
      if (isAdmin || username === "pedro.lima") {
        setAuthorized(true)
      } else {
        router.push("/dashboard")
      }
    }
  }, [isAdmin, username, isLoading, router])

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Carregando...</div>
  }

  if (!authorized) {
    return null // Não mostrar nada enquanto redireciona
  }

  return <CafeteriaManagement />
}
