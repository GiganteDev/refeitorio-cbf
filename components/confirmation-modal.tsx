"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { FrownIcon, MehIcon, SmileIcon } from "lucide-react"

interface ConfirmationModalProps {
  rating: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmationModal({ rating, onConfirm, onCancel }: ConfirmationModalProps) {
  const getRatingIcon = () => {
    switch (rating) {
      case "ruim":
        return <FrownIcon className="h-12 w-12 text-red-500" />
      case "regular":
        return <MehIcon className="h-12 w-12 text-yellow-500" />
      case "otimo":
        return <SmileIcon className="h-12 w-12 text-green-500" />
      default:
        return null
    }
  }

  const getRatingText = () => {
    switch (rating) {
      case "ruim":
        return "Ruim"
      case "regular":
        return "Regular"
      case "otimo":
        return "Ótimo"
      default:
        return ""
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-4">{getRatingIcon()}</div>
            <h2 className="text-2xl font-bold mb-2">Confirmar avaliação</h2>
            <p className="text-gray-600 mb-6">
              Você selecionou <span className="font-semibold">{getRatingText()}</span>. Deseja confirmar esta avaliação?
            </p>

            <div className="flex gap-4 w-full">
              <Button variant="outline" className="flex-1" onClick={onCancel}>
                Cancelar
              </Button>
              <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={onConfirm}>
                Confirmar
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
