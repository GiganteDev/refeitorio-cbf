import { NextResponse } from "next/server"
import { insertTestData } from "@/lib/db"
import { checkAdminRole } from "@/lib/auth-utils"

export async function POST(request: Request) {
  try {
    // Verify admin role
    const isAdmin = await checkAdminRole(request)
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Access denied. Only administrators can use debug functions." },
        { status: 403 },
      )
    }

    const { count = 10 } = await request.json()

    // Insert test data
    const result = insertTestData(count)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error inserting test data:", error)
    return NextResponse.json({ error: "Error processing request" }, { status: 500 })
  }
}
