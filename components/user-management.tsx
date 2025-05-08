"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Trash2, Edit } from "lucide-react"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useUserRole } from "@/hooks/use-user-role"
import { useRouter } from "next/navigation"

interface User {
  id: number
  email: string
  role: string
  created_at: string
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserRole, setNewUserRole] = useState("readonly")
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [editRole, setEditRole] = useState("readonly")
  const { toast } = useToast()
  const { role, loading: roleLoading } = useUserRole()
  const router = useRouter()

  // Verificar se o usuário é administrador
  useEffect(() => {
    if (roleLoading || role === null) return
    
    if (role !== "admin") {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta página.",
        variant: "destructive",
      })
      router.push("/dashboard")
    }
  }, [role, roleLoading, router, toast])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (!response.ok) throw new Error("Erro ao buscar usuários")
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error("Erro ao buscar usuários:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de usuários.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (role === "admin") {
      fetchUsers()
    }
  }, [role])

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUserEmail.trim()) return

    setAdding(true)
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: newUserEmail,
          role: newUserRole,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao adicionar usuário")
      }

      toast({
        title: "Sucesso",
        description: "Usuário adicionado com sucesso.",
      })

      setNewUserEmail("")
      setNewUserRole("readonly")
      fetchUsers()
    } catch (error) {
      console.error("Erro ao adicionar usuário:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao adicionar usuário.",
        variant: "destructive",
      })
    } finally {
      setAdding(false)
    }
  }

  const handleDeleteUser = async (id: number) => {
    if (!confirm("Tem certeza que deseja remover este usuário?")) return

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao remover usuário")
      }

      toast({
        title: "Sucesso",
        description: "Usuário removido com sucesso.",
      })

      fetchUsers()
    } catch (error) {
      console.error("Erro ao remover usuário:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao remover usuário.",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (user: User) => {
    setCurrentUser(user)
    setEditRole(user.role || "readonly")
    setShowEditDialog(true)
  }

  const handleUpdateRole = async () => {
    if (!currentUser) return

    try {
      const response = await fetch(`/api/users/${currentUser.id}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: editRole }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao atualizar função do usuário")
      }

      toast({
        title: "Sucesso",
        description: "Função do usuário atualizada com sucesso.",
      })

      setShowEditDialog(false)
      fetchUsers()
    } catch (error) {
      console.error("Erro ao atualizar função do usuário:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar função do usuário.",
        variant: "destructive",
      })
    }
  }

  if (roleLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <p className="text-center">Carregando...</p>
        </div>
      </div>
    )
  }

  if (role !== "admin") {
    return null // Não renderizar nada se não for admin (será redirecionado)
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Gerenciamento de Usuários</h2>
          <div className="flex items-center space-x-2">
            <Link href="/dashboard">
              <Button variant="outline">Voltar ao Dashboard</Button>
            </Link>
            <Link href="/cafeterias">
              <Button variant="outline">Gerenciar Refeitórios</Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Adicionar Novo Usuário</CardTitle>
            <CardDescription>
              Adicione usuários que terão acesso ao dashboard. Use o formato nome.sobrenome@ferroeste.com.br
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddUser} className="flex items-center gap-2">
              <Input
                placeholder="Email do usuário"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="flex-1"
                disabled={adding}
              />
              <Select value={newUserRole} onValueChange={setNewUserRole} disabled={adding}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Selecione a função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="readonly">Somente Leitura</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" disabled={adding || !newUserEmail.trim()}>
                {adding ? "Adicionando..." : "Adicionar"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usuários Autorizados</CardTitle>
            <CardDescription>Lista de usuários com acesso ao dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-4">Carregando usuários...</p>
            ) : users.length === 0 ? (
              <p className="text-center py-4">Nenhum usuário autorizado encontrado.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Data de Adição</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.id}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role === "admin" ? "Administrador" : "Somente Leitura"}</TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(user)}
                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-100"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Diálogo para editar função do usuário */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Função do Usuário</DialogTitle>
            <DialogDescription>Altere a função do usuário {currentUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Função
              </Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione a função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="readonly">Somente Leitura</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleUpdateRole}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
