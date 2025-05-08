"use client"

import { useState, forwardRef } from "react"
import DatePicker from "react-datepicker"
import { registerLocale } from "react-datepicker"
import { ptBR } from "date-fns/locale"
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { Button } from "@/components/ui/button"
import { Calendar, ChevronDown } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

// Registrar locale pt-BR
registerLocale("pt-BR", ptBR)

// Incluir os estilos necessários
import "react-datepicker/dist/react-datepicker.css"

interface DateRangePickerProps {
  startDate: Date | null
  endDate: Date | null
  onChange: (startDate: Date | null, endDate: Date | null) => void
  className?: string
}

export function ModernDateRangePicker({ startDate, endDate, onChange, className }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Função para aplicar períodos predefinidos
  const applyPreset = (preset: string) => {
    const today = new Date()
    let start: Date | null = null
    let end: Date | null = today

    switch (preset) {
      case "today":
        start = today
        end = today
        break
      case "yesterday":
        start = subDays(today, 1)
        end = subDays(today, 1)
        break
      case "last7days":
        start = subDays(today, 6)
        break
      case "last30days":
        start = subDays(today, 29)
        break
      case "thisMonth":
        start = startOfMonth(today)
        end = endOfMonth(today)
        break
      case "lastMonth":
        const lastMonth = subMonths(today, 1)
        start = startOfMonth(lastMonth)
        end = endOfMonth(lastMonth)
        break
      default:
        start = subDays(today, 29)
    }

    onChange(start, end)
    setIsOpen(false)
  }

  // Vamos também ajustar o componente de seleção de data para garantir que as datas sejam tratadas corretamente

  // Formatar o texto do botão de período
  const formatDateRange = () => {
    if (!startDate && !endDate) return "Selecione um período"

    if (startDate && endDate) {
      if (format(startDate, "yyyy-MM-dd") === format(endDate, "yyyy-MM-dd")) {
        return format(startDate, "dd/MM/yyyy", { locale: ptBR })
      }
      return `${format(startDate, "dd/MM/yyyy", { locale: ptBR })} - ${format(endDate, "dd/MM/yyyy", { locale: ptBR })}`
    }

    if (startDate) {
      return `A partir de ${format(startDate, "dd/MM/yyyy", { locale: ptBR })}`
    }

    if (endDate) {
      return `Até ${format(endDate, "dd/MM/yyyy", { locale: ptBR })}`
    }

    return "Selecione um período"
  }

  // Componente personalizado para o input do DatePicker
  const CustomInput = forwardRef<HTMLButtonElement, { value?: string; onClick?: () => void }>(
    ({ value, onClick }, ref) => (
      <Button
        ref={ref}
        variant="outline"
        onClick={onClick}
        className={cn(
          "w-full justify-between text-left font-normal",
          !startDate && !endDate && "text-muted-foreground",
        )}
      >
        <div className="flex items-center">
          <Calendar className="mr-2 h-4 w-4" />
          <span>{value || "Selecione um período"}</span>
        </div>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </Button>
    ),
  )
  CustomInput.displayName = "CustomDatePickerInput"

  return (
    <div className={cn("relative", className)}>
      <div className="flex gap-2">
        <div className="flex-1">
          <DatePicker
            selected={startDate}
            onChange={(dates) => {
              if (Array.isArray(dates) && dates.length === 2) {
                onChange(dates[0], dates[1])
              }
            }}
            startDate={startDate}
            endDate={endDate}
            selectsRange
            monthsShown={2}
            locale="pt-BR"
            dateFormat="dd/MM/yyyy"
            customInput={<CustomInput />}
            calendarClassName="bg-white shadow-lg rounded-lg border border-gray-200"
            wrapperClassName="w-full"
            popperPlacement="bottom-start"
            popperModifiers={[
              {
                name: "offset",
                options: {
                  offset: [0, 10],
                },
              },
            ]}
          />
        </div>

        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon">
              <Calendar className="h-4 w-4" />
              <span className="sr-only">Períodos pré-definidos</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56" align="end">
            <div className="grid gap-1">
              <Button variant="ghost" size="sm" className="justify-start" onClick={() => applyPreset("today")}>
                Hoje
              </Button>
              <Button variant="ghost" size="sm" className="justify-start" onClick={() => applyPreset("yesterday")}>
                Ontem
              </Button>
              <Button variant="ghost" size="sm" className="justify-start" onClick={() => applyPreset("last7days")}>
                Últimos 7 dias
              </Button>
              <Button variant="ghost" size="sm" className="justify-start" onClick={() => applyPreset("last30days")}>
                Últimos 30 dias
              </Button>
              <Button variant="ghost" size="sm" className="justify-start" onClick={() => applyPreset("thisMonth")}>
                Este mês
              </Button>
              <Button variant="ghost" size="sm" className="justify-start" onClick={() => applyPreset("lastMonth")}>
                Mês passado
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
