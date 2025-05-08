"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { FrownIcon, MehIcon, SmileIcon, Send } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import ThankYouScreen from "./thank-you-screen"
import type { VoteData } from "@/lib/db"
import { getBrazilianTimestamp } from "@/lib/timezone-config"

type FeedbackStep = "initial" | "bad-options" | "bad-feedback" | "thank-you"
type BadReason = "food" | "service" | "other" | null

interface Cafeteria {
  id: number
  code: string
  name: string
  description: string | null
}

interface SatisfactionSurveyProps {
  refeitorio: string
}

export default function SatisfactionSurvey({ refeitorio }: SatisfactionSurveyProps) {
  const [currentStep, setCurrentStep] = useState<FeedbackStep>("initial")
  const [badReason, setBadReason] = useState<BadReason>(null)
  const [feedbackText, setFeedbackText] = useState("")
  const [showThankYou, setShowThankYou] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cafeteria, setCafeteria] = useState<Cafeteria | null>(null)
  const [loading, setLoading] = useState(true)

  // Buscar informações do refeitório
  useEffect(() => {
    async function fetchCafeteriaInfo() {
      try {
        setLoading(true)
        const response = await fetch(`/api/cafeterias/by-code/${refeitorio}`)

        if (response.ok) {
          const data = await response.json()
          setCafeteria(data)
        } else {
          setError("Refeitório não encontrado ou inativo")
        }
      } catch (error) {
        console.error("Erro ao buscar informações do refeitório:", error)
        setError("Erro ao carregar informações do refeitório")
      } finally {
        setLoading(false)
      }
    }

    fetchCafeteriaInfo()
  }, [refeitorio])

  const submitVote = async (data: VoteData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/votes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          location: refeitorio, // Incluir o refeitório na submissão
          timestamp: getBrazilianTimestamp(), // Adicionar timestamp no fuso horário brasileiro
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao enviar avaliação")
      }

      return true
    } catch (err) {
      console.error("Erro ao enviar voto:", err)
      setError(err instanceof Error ? err.message : "Erro ao enviar avaliação")
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRatingSelect = async (rating: string) => {
    if (rating === "ruim") {
      setCurrentStep("bad-options")
    } else {
      // Para "regular" e "ótimo", enviar diretamente
      const success = await submitVote({
        rating: rating as "otimo" | "regular",
      })

      if (success) {
        setShowThankYou(true)

        // Reset após 1.5 segundos
        setTimeout(() => {
          setShowThankYou(false)
          setCurrentStep("initial")
        }, 1500)
      }
    }
  }

  const handleBadReasonSelect = async (reason: BadReason) => {
    setBadReason(reason)

    if (reason === "other") {
      setCurrentStep("bad-feedback")
    } else {
      // Para razões predefinidas, enviar diretamente
      const success = await submitVote({
        rating: "ruim",
        reason,
      })

      if (success) {
        setShowThankYou(true)

        // Reset após 1.5 segundos
        setTimeout(() => {
          setShowThankYou(false)
          setBadReason(null)
          setCurrentStep("initial")
        }, 1500)
      }
    }
  }

  const handleFeedbackSubmit = async () => {
    if (!feedbackText.trim()) {
      setError("Por favor, digite seu feedback")
      return
    }

    const success = await submitVote({
      rating: "ruim",
      reason: "other",
      comment: feedbackText,
    })

    if (success) {
      setShowThankYou(true)

      // Reset após 1.5 segundos
      setTimeout(() => {
        setShowThankYou(false)
        setFeedbackText("")
        setBadReason(null)
        setCurrentStep("initial")
      }, 1500)
    }
  }

  if (showThankYou) {
    return <ThankYouScreen />
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-900/80 via-blue-800/70 to-blue-700/80 p-4">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    )
  }

  if (error || !cafeteria) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-red-700/80 via-red-600/70 to-red-500/80 p-4">
        <div className="bg-white rounded-xl p-6 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Erro</h2>
          <p className="mb-4">{error || "Refeitório não encontrado ou inativo"}</p>
          <a href="/" className="inline-block bg-blue-500 text-white px-4 py-2 rounded-md">
            Voltar para a página inicial
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-900/80 via-blue-800/70 to-blue-700/80 p-4">
      <div className="w-full max-w-4xl flex flex-col items-center text-center mb-8">
        <div className="bg-white rounded-full p-2 inline-block mb-6">
          <img src="/logo-cbf.png" alt="Logo CBF" className="h-20 md:h-24 w-auto object-contain" />
        </div>

        <h1 className="text-4xl md:text-6xl font-bold text-white mb-2">PESQUISA DE SATISFAÇÃO</h1>
        <h2 className="text-xl md:text-2xl text-white/90 max-w-2xl mb-2">
          A sua opinião é muito importante para nós! Queremos saber como foi a sua experiência no refeitório hoje.
        </h2>

        {/* Mostrar o nome do refeitório */}
        <div className="bg-white/20 px-4 py-2 rounded-full text-white font-semibold mb-6">{cafeteria.name}</div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 max-w-4xl w-full">
          <p>{error}</p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {currentStep === "initial" && (
          <motion.div
            key="initial"
            className="bg-white rounded-xl p-6 w-full max-w-4xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-2xl font-bold text-center mb-6 text-gray-800">QUAL SEU GRAU DE SATISFAÇÃO?</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <RatingButton
                color="bg-red-500 hover:bg-red-600"
                icon={<FrownIcon className="h-16 w-16 mb-2" />}
                label="RUIM"
                onClick={() => handleRatingSelect("ruim")}
                disabled={isSubmitting}
              />

              <RatingButton
                color="bg-yellow-400 hover:bg-yellow-500"
                icon={<MehIcon className="h-16 w-16 mb-2" />}
                label="REGULAR"
                onClick={() => handleRatingSelect("regular")}
                disabled={isSubmitting}
              />

              <RatingButton
                color="bg-green-400 hover:bg-green-500"
                icon={<SmileIcon className="h-16 w-16 mb-2" />}
                label="ÓTIMO"
                onClick={() => handleRatingSelect("otimo")}
                disabled={isSubmitting}
              />
            </div>
          </motion.div>
        )}

        {currentStep === "bad-options" && (
          <motion.div
            key="bad-options"
            className="bg-red-500 rounded-xl p-6 w-full max-w-4xl relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <button
              onClick={() => setCurrentStep("initial")}
              className="absolute top-4 right-4 text-white hover:text-gray-200 focus:outline-none"
              aria-label="Fechar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <h3 className="text-2xl font-bold text-center mb-6 text-white">O QUE ESTÁ RUIM?</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <BadReasonButton
                emoji="🍝"
                label="AS OPÇÕES DE COMIDA NÃO ME AGRADARAM"
                onClick={() => handleBadReasonSelect("food")}
                disabled={isSubmitting}
              />

              <BadReasonButton
                emoji="👩‍🍳"
                label="ATENDIMENTO RUIM"
                onClick={() => handleBadReasonSelect("service")}
                disabled={isSubmitting}
              />

              <BadReasonButton
                emoji="📝"
                label="ESCREVA O QUE TE DESAGRADOU"
                onClick={() => handleBadReasonSelect("other")}
                disabled={isSubmitting}
              />
            </div>
          </motion.div>
        )}

        {currentStep === "bad-feedback" && (
          <motion.div
            key="bad-feedback"
            className="bg-red-500 rounded-xl p-6 w-full max-w-4xl relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <button
              onClick={() => setCurrentStep("bad-options")}
              className="absolute top-4 right-4 text-white hover:text-gray-200 focus:outline-none"
              aria-label="Fechar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <h3 className="text-2xl font-bold text-center mb-6 text-white">O QUE ESTÁ RUIM?</h3>

            <div className="relative bg-white rounded-xl p-4 w-full">
              <textarea
                className="w-full min-h-[100px] p-2 text-gray-800 outline-none resize-none"
                placeholder="Digite aqui o que não te agradou..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value.slice(0, 100))}
                maxLength={100}
                disabled={isSubmitting}
              />
              <div className="text-right text-sm text-gray-500 mt-1">{feedbackText.length}/100 caracteres</div>

              <button
                className={cn(
                  "absolute bottom-4 right-4 bg-green-500 text-white rounded-full p-3 transition-colors",
                  isSubmitting ? "opacity-50 cursor-not-allowed" : "hover:bg-green-600",
                )}
                onClick={handleFeedbackSubmit}
                disabled={isSubmitting}
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6 text-white/80 text-sm">©2024 Departamento de Tecnologia da Informação</div>
    </div>
  )
}

interface RatingButtonProps {
  color: string
  icon: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
}

function RatingButton({ color, icon, label, onClick, disabled }: RatingButtonProps) {
  return (
    <motion.button
      className={cn(
        color,
        "rounded-xl p-8 flex flex-col items-center justify-center text-white transition-all duration-300 transform",
        "shadow-lg hover:shadow-xl min-h-[150px]",
        disabled && "opacity-50 cursor-not-allowed",
      )}
      onClick={onClick}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      disabled={disabled}
    >
      {icon}
      <span className="text-2xl font-medium">{label}</span>
    </motion.button>
  )
}

interface BadReasonButtonProps {
  emoji: string
  label: string
  onClick: () => void
  disabled?: boolean
}

function BadReasonButton({ emoji, label, onClick, disabled }: BadReasonButtonProps) {
  return (
    <motion.button
      className={cn(
        "bg-white rounded-xl p-6 flex flex-col items-center justify-center gap-4 text-red-500 transition-all duration-300 transform shadow-lg hover:shadow-xl",
        disabled && "opacity-50 cursor-not-allowed",
      )}
      onClick={onClick}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      disabled={disabled}
    >
      <span className="text-5xl">{emoji}</span>
      <span className="text-sm font-medium text-center">{label}</span>
    </motion.button>
  )
}
