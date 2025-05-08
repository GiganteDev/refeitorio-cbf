"use client"

import { motion } from "framer-motion"
import { CheckCircle2 } from "lucide-react"

export default function ThankYouScreen() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-900/80 via-blue-800/70 to-blue-700/80 p-4">
      <div className="w-full max-w-4xl flex flex-col items-center text-center mb-8">
        <div className="bg-white rounded-full p-2 inline-block mb-6">
          <img src="/logo-cbf.png" alt="Logo CBF" className="h-20 md:h-24 w-auto object-contain" />
        </div>

        <h1 className="text-4xl md:text-6xl font-bold text-white mb-2">PESQUISA DE SATISFAÇÃO</h1>
        <h2 className="text-xl md:text-2xl text-white/90 max-w-2xl mb-6">
          A sua opinião é muito importante para nós! Queremos saber como foi a sua experiência no refeitório hoje.
        </h2>
      </div>

      <motion.div
        className="bg-white rounded-xl p-10 max-w-md w-full flex flex-col items-center text-center"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <CheckCircle2 className="h-20 w-20 text-green-600 mb-4" />
        </motion.div>

        <motion.h2
          className="text-3xl font-bold mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          Obrigado!
        </motion.h2>

        <motion.p
          className="text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Sua avaliação foi registrada com sucesso. Agradecemos sua participação!
        </motion.p>
      </motion.div>
    </div>
  )
}
