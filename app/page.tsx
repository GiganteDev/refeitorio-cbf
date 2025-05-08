import { redirect } from "next/navigation"
import SatisfactionSurvey from "@/components/satisfaction-survey"
import { getActiveCafeterias } from "@/lib/db"

export default function Home({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  // Verificar se há um parâmetro de refeitório na URL
  const refeitorio = searchParams.refeitorio as string

  if (!refeitorio) {
    // Buscar o primeiro refeitório ativo
    const cafeterias = getActiveCafeterias()

    if (cafeterias.length > 0) {
      redirect(`/?refeitorio=${cafeterias[0].code}`)
    } else {
      // Se não houver refeitórios ativos, mostrar uma mensagem
      return (
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-700/80 via-red-600/70 to-red-500/80 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full text-center">
            <h2 className="text-2xl font-bold mb-4">Nenhum refeitório disponível</h2>
            <p>Não há refeitórios ativos no momento. Por favor, entre em contato com o administrador.</p>
          </div>
        </main>
      )
    }
  }

  return (
    <main className="min-h-screen">
      <SatisfactionSurvey refeitorio={refeitorio} />
    </main>
  )
}
