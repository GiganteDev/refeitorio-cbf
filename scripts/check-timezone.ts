import { getCurrentBrazilianDate, formatBrazilianDateTime, TIMEZONE } from "../lib/timezone-config"

console.log("Verificando configuração de timezone:")
console.log(`Timezone configurado: ${TIMEZONE}`)
console.log(`Timezone do sistema: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`)
console.log(`Data e hora atual (sistema): ${new Date().toLocaleString()}`)
console.log(`Data e hora atual (Brasil): ${formatBrazilianDateTime(getCurrentBrazilianDate())}`)
console.log(`Offset UTC: ${new Date().getTimezoneOffset() / -60}`)
