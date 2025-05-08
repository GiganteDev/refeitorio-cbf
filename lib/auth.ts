import ldap from "ldapjs"
import { isUserInDatabase, getUserRole } from "@/lib/db"

const LDAP_SERVER = "ldap://192.168.17.17"
const BASE_DN = "dc=ferroeste,dc=com,dc=br"

export async function isUserAuthorized(username: string, password: string) {
  // Normalizar o nome de usuário
  const normalizedUsername = username.includes("@") ? username.split("@")[0] : username
  const email = username.includes("@") ? username : `${normalizedUsername}@ferroeste.com.br`

  try {
    // Verificar se o usuário está na lista de autorizados
    const isAuthorized = isUserInDatabase(email)

    if (!isAuthorized) {
      return {
        success: false,
        error: "Usuário não autorizado a acessar o dashboard",
      }
    }

    // Autenticar via LDAP
    try {
      console.log(`Tentando autenticar ${normalizedUsername} via LDAP...`)
      const authenticated = await authenticateWithLDAP(normalizedUsername, password)

      if (!authenticated) {
        console.log(`Autenticação LDAP falhou para ${normalizedUsername}`)
        return {
          success: false,
          error: "Credenciais inválidas",
        }
      }

      console.log(`Autenticação LDAP bem-sucedida para ${normalizedUsername}`)
      const role = getUserRole(email)

      return {
        success: true,
        username: normalizedUsername,
        email,
        role: role,
      }
    } catch (ldapError) {
      console.error("Erro LDAP:", ldapError)
      return {
        success: false,
        error: "Erro ao conectar ao servidor LDAP. Tente novamente mais tarde.",
      }
    }
  } catch (error) {
    console.error("Erro na autenticação:", error)
    return {
      success: false,
      error: "Erro ao autenticar. Tente novamente.",
    }
  }
}

async function authenticateWithLDAP(username: string, password: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const client = ldap.createClient({
      url: LDAP_SERVER,
      timeout: 5000,
      connectTimeout: 10000,
    })

    client.on("error", (err) => {
      console.error("LDAP connection error:", err)
      client.destroy()
      reject(err)
    })

    // Construir o DN do usuário
    const userDN = username.includes("@") ? username : `${username}@ferroeste.com.br`

    console.log(`Tentando bind LDAP com DN: ${userDN}`)

    // Tentar autenticar
    client.bind(userDN, password, (err) => {
      if (err) {
        console.error("LDAP authentication error:", err)
        client.destroy()
        resolve(false)
        return
      }

      console.log(`Bind LDAP bem-sucedido para ${userDN}`)
      client.unbind()
      resolve(true)
    })
  })
}

export const authOptions = {}
