"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ExternalLink, Plus } from "lucide-react"
import { useState, useEffect } from "react"
import { useUserRole } from "@/hooks/use-user-role"

interface Cafeteria {
  id: number
  code: string
  name: string
  description: string | null
  active: number
}

export function RefeitorioLinks() {
  const [cafeterias, setCafeterias] = useState<Cafeteria[]>([])
  const [loading, setLoading] = useState(true)
  const { isAdmin } = useUserRole()

  useEffect(() => {
    async function fetchCafeterias() {
      try {
        const response = await fetch("/api/cafeterias")
        if (response.ok) {
          const data = await response.json()
          setCafeterias(data)
        } else {
          console.error("Erro ao buscar refeitórios")
        }
      } catch (error) {
        console.error("Erro ao buscar refeitórios:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCafeterias()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Links para Pesquisa</CardTitle>
          <CardDescription>Carregando refeitórios...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center">
            <p>Carregando...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (cafeterias.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Links para Pesquisa</CardTitle>
          <CardDescription>Nenhum refeitório ativo encontrado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex flex-col items-center justify-center gap-4">
            <p>Não há refeitórios ativos no momento.</p>
            {isAdmin && (
              <Link href="/cafeterias">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Gerenciar Refeitórios
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Cores para os refeitórios
  const colors = [
    "bg-blue-100 border-blue-300",
    "bg-green-100 border-green-300",
    "bg-amber-100 border-amber-300",
    "bg-purple-100 border-purple-300",
    "bg-pink-100 border-pink-300",
    "bg-cyan-100 border-cyan-300",
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Links para Pesquisa</CardTitle>
          <CardDescription>Links diretos para a pesquisa de satisfação em cada refeitório</CardDescription>
        </div>
        {isAdmin && (
          <Link href="/cafeterias">
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Gerenciar
            </Button>
          </Link>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cafeterias.map((cafeteria, index) => (
            <div key={cafeteria.id} className={`border rounded-lg p-4 ${colors[index % colors.length]} flex flex-col`}>
              <h3 className="font-medium mb-2">{cafeteria.name}</h3>
              <div className="flex-1 mb-2">
                <p className="text-sm text-gray-600">{cafeteria.description || "Link para pesquisa de satisfação"}</p>
              </div>
              <Link href={`/?refeitorio=${cafeteria.code}`} target="_blank">
                <Button variant="outline" size="sm" className="w-full">
                  Abrir Pesquisa <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
