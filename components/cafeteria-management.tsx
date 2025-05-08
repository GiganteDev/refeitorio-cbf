"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Trash2, Edit, Plus, ArrowLeft, Shield } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useUserRole } from "@/hooks/use-user-role"
import { useRouter } from "next/navigation"

interface Cafeteria {
  id: number
  code: string
  name: string
  description: string | null
  active: number
  authorized_ip: string | null
  created_at: string
}

export default function CafeteriaManagement() {
  const [cafeterias, setCafeterias] = useState<Cafeteria[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [currentCafeteria, setCurrentCafeteria] = useState<Cafeteria | null>(null)
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    authorizedIp: "",
    active: true,
  })
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

  const fetchCafeterias = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/cafeterias?all=true")
      if (!response.ok) throw new Error("Erro ao buscar refeitórios")
      const data = await response.json()
      setCafeterias(data)
    } catch (error) {
      console.error("Erro ao buscar refeitórios:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de refeitórios.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (role === "admin") {
      fetchCafeterias()
    }
  }, [role])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, active: checked }))
  }

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      description: "",
      authorizedIp: "",
      active: true,
    })
  }

  const validateIpAddress = (ip: string): boolean => {
    if (!ip) return true // IP vazio é permitido (sem restrição)

    // Regex para validar IPv4
    const ipv4Regex =
      /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    return ipv4Regex.test(ip)
  }

  const handleAddCafeteria = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.code.trim() || !formData.name.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Código e nome são obrigatórios.",
        variant: "destructive",
      })
      return
    }

    // Validar IP se fornecido
    if (formData.authorizedIp && !validateIpAddress(formData.authorizedIp)) {
      toast({
        title: "IP inválido",
        description: "Por favor, insira um endereço IPv4 válido.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/cafeterias", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: formData.code.trim(),
          name: formData.name.trim(),
          description: formData.description.trim(),
          authorizedIp: formData.authorizedIp.trim() || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao adicionar refeitório")
      }

      toast({
        title: "Sucesso",
        description: "Refeitório adicionado com sucesso.",
      })

      resetForm()
      setShowAddDialog(false)
      fetchCafeterias()
    } catch (error) {
      console.error("Erro ao adicionar refeitório:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao adicionar refeitório.",
        variant: "destructive",
      })
    }
  }

  const handleEditCafeteria = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentCafeteria) return

    if (!formData.name.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Nome é obrigatório.",
        variant: "destructive",
      })
      return
    }

    // Validar IP se fornecido
    if (formData.authorizedIp && !validateIpAddress(formData.authorizedIp)) {
      toast({
        title: "IP inválido",
        description: "Por favor, insira um endereço IPv4 válido.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/cafeterias/${currentCafeteria.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          active: formData.active,
          authorizedIp: formData.authorizedIp.trim() || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao atualizar refeitório")
      }

      toast({
        title: "Sucesso",
        description: "Refeitório atualizado com sucesso.",
      })

      setShowEditDialog(false)
      fetchCafeterias()
    } catch (error) {
      console.error("Erro ao atualizar refeitório:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar refeitório.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCafeteria = async (id: number) => {
    if (
      !confirm(
        "Tem certeza que deseja remover este refeitório? Se houver votos associados, ele será apenas desativado.",
      )
    )
      return

    try {
      const response = await fetch(`/api/cafeterias/${id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao remover refeitório")
      }

      toast({
        title: "Sucesso",
        description: data.message || "Refeitório removido com sucesso.",
      })

      fetchCafeterias()
    } catch (error) {
      console.error("Erro ao remover refeitório:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao remover refeitório.",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (cafeteria: Cafeteria) => {
    setCurrentCafeteria(cafeteria)
    setFormData({
      code: cafeteria.code,
      name: cafeteria.name,
      description: cafeteria.description || "",
      authorizedIp: cafeteria.authorized_ip || "",
      active: cafeteria.active === 1,
    })
    setShowEditDialog(true)
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
          <h2 className="text-3xl font-bold tracking-tight">Gerenciamento de Refeitórios</h2>
          <div className="flex items-center space-x-2">
            <Link href="/dashboard">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Dashboard
              </Button>
            </Link>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Refeitório
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Refeitórios Cadastrados</CardTitle>
            <CardDescription>Lista de todos os refeitórios disponíveis no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-4">Carregando refeitórios...</p>
            ) : cafeterias.length === 0 ? (
              <p className="text-center py-4">Nenhum refeitório cadastrado.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>IP Autorizado</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data de Criação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cafeterias.map((cafeteria) => (
                    <TableRow key={cafeteria.id}>
                      <TableCell className="font-medium">{cafeteria.id}</TableCell>
                      <TableCell>{cafeteria.code}</TableCell>
                      <TableCell>{cafeteria.name}</TableCell>
                      <TableCell>{cafeteria.description || "-"}</TableCell>
                      <TableCell>
                        {cafeteria.authorized_ip ? (
                          <div className="flex items-center">
                            <Shield className="h-4 w-4 text-green-500 mr-1" />
                            {cafeteria.authorized_ip}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Sem restrição</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {cafeteria.active === 1 ? (
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                            Inativo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{new Date(cafeteria.created_at).toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(cafeteria)}
                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-100"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCafeteria(cafeteria.id)}
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

      {/* Diálogo para adicionar refeitório */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Refeitório</DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para adicionar um novo refeitório ao sistema.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddCafeteria} className="space-y-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right">
                Código*
              </Label>
              <Input
                id="code"
                name="code"
                placeholder="ex: refeitorio4"
                value={formData.code}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome*
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="Nome do refeitório"
                value={formData.name}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Descrição
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Descrição do refeitório"
                value={formData.description}
                onChange={handleInputChange}
                className="col-span-3"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="authorizedIp" className="text-right">
                IP Autorizado
              </Label>
              <div className="col-span-3 space-y-1">
                <Input
                  id="authorizedIp"
                  name="authorizedIp"
                  placeholder="ex: 192.168.1.100"
                  value={formData.authorizedIp}
                  onChange={handleInputChange}
                />
                <p className="text-xs text-muted-foreground">
                  Deixe em branco para permitir votações de qualquer IP. Insira um endereço IPv4 para restringir
                  votações apenas deste IP.
                </p>
              </div>
            </div>
            <DialogFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit">Adicionar Refeitório</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo para editar refeitório */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Refeitório</DialogTitle>
            <DialogDescription>Atualize as informações do refeitório.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditCafeteria} className="space-y-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-code" className="text-right">
                Código
              </Label>
              <Input id="edit-code" name="code" value={formData.code} className="col-span-3" disabled />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Nome*
              </Label>
              <Input
                id="edit-name"
                name="name"
                placeholder="Nome do refeitório"
                value={formData.name}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">
                Descrição
              </Label>
              <Textarea
                id="edit-description"
                name="description"
                placeholder="Descrição do refeitório"
                value={formData.description}
                onChange={handleInputChange}
                className="col-span-3"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-authorizedIp" className="text-right">
                IP Autorizado
              </Label>
              <div className="col-span-3 space-y-1">
                <Input
                  id="edit-authorizedIp"
                  name="authorizedIp"
                  placeholder="ex: 192.168.1.100"
                  value={formData.authorizedIp}
                  onChange={handleInputChange}
                />
                <p className="text-xs text-muted-foreground">
                  Deixe em branco para permitir votações de qualquer IP. Insira um endereço IPv4 para restringir
                  votações apenas deste IP.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-active" className="text-right">
                Ativo
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Switch id="edit-active" checked={formData.active} onCheckedChange={handleSwitchChange} />
                <Label htmlFor="edit-active">{formData.active ? "Sim" : "Não"}</Label>
              </div>
            </div>
            <DialogFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar Alterações</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
