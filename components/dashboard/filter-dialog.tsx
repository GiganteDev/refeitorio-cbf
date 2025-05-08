"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useState, useEffect } from "react"

interface Cafeteria {
  id: number
  code: string
  name: string
}

interface FilterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentFilters: {
    period?: string
    location?: string
    ratings?: {
      otimo: boolean
      regular: boolean
      ruim: boolean
    }
    minVotes?: number
  }
  onApplyFilters: (filters: any) => void
}

export function FilterDialog({ open, onOpenChange, currentFilters, onApplyFilters }: FilterDialogProps) {
  // Initialize with default values to prevent undefined errors
  const [filters, setFilters] = useState({
    period: currentFilters.period || "month",
    location: currentFilters.location || "all",
    ratings: {
      otimo: true,
      regular: true,
      ruim: true,
      ...(currentFilters.ratings || {}),
    },
    minVotes: currentFilters.minVotes || 0,
  })
  const [cafeterias, setCafeterias] = useState<Cafeteria[]>([])
  const [loading, setLoading] = useState(false)

  // Buscar refeitórios quando o diálogo for aberto
  useEffect(() => {
    if (open) {
      fetchCafeterias()
    }
  }, [open])

  // Atualizar o estado local quando os filtros atuais mudarem
  useEffect(() => {
    if (open) {
      setFilters({
        period: currentFilters.period || "month",
        location: currentFilters.location || "all",
        ratings: {
          otimo: true,
          regular: true,
          ruim: true,
          ...(currentFilters.ratings || {}),
        },
        minVotes: currentFilters.minVotes || 0,
      })
    }
  }, [currentFilters, open])

  const fetchCafeterias = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/cafeterias")
      if (!response.ok) throw new Error("Erro ao buscar refeitórios")
      const data = await response.json()
      setCafeterias(data)
    } catch (error) {
      console.error("Erro ao buscar refeitórios:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleRatingChange = (rating: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      ratings: {
        ...prev.ratings,
        [rating]: checked,
      },
    }))
  }

  const handleApply = () => {
    onApplyFilters(filters)
    onOpenChange(false)
  }

  const handleReset = () => {
    const defaultFilters = {
      period: "month",
      location: "all",
      ratings: {
        otimo: true,
        regular: true,
        ruim: true,
      },
      minVotes: 0,
    }
    setFilters(defaultFilters)
    onApplyFilters(defaultFilters)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Filtros Avançados</DialogTitle>
          <DialogDescription>Configure os filtros para refinar os dados exibidos no dashboard.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="period" className="text-right">
              Período
            </Label>
            <Select value={filters.period} onValueChange={(value) => handleChange("period", value)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Diário</SelectItem>
                <SelectItem value="week">Semanal</SelectItem>
                <SelectItem value="month">Mensal</SelectItem>
                <SelectItem value="quarter">Trimestral</SelectItem>
                <SelectItem value="year">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="location" className="text-right">
              Local
            </Label>
            <Select value={filters.location} onValueChange={(value) => handleChange("location", value)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione o local" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {cafeterias.map((cafeteria) => (
                  <SelectItem key={cafeteria.id} value={cafeteria.code}>
                    {cafeteria.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Avaliações</Label>
            <div className="col-span-3 space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="otimo"
                  checked={filters.ratings.otimo}
                  onCheckedChange={(checked) => handleRatingChange("otimo", checked === true)}
                />
                <Label htmlFor="otimo">Ótimo</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="regular"
                  checked={filters.ratings.regular}
                  onCheckedChange={(checked) => handleRatingChange("regular", checked === true)}
                />
                <Label htmlFor="regular">Regular</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ruim"
                  checked={filters.ratings.ruim}
                  onCheckedChange={(checked) => handleRatingChange("ruim", checked === true)}
                />
                <Label htmlFor="ruim">Ruim</Label>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="min-votes" className="text-right">
              Mín. Votos
            </Label>
            <Input
              id="min-votes"
              type="number"
              value={filters.minVotes}
              onChange={(e) => handleChange("minVotes", Number.parseInt(e.target.value) || 0)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleReset}>
            Resetar
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" onClick={handleApply}>
              Aplicar Filtros
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
