import { Metadata } from "next"
import { GrievanceForm } from "@/components/gdpr/grievance-form"

export const metadata: Metadata = {
  title: "Grievance Redressal | Salon CRM",
  description: "Submit a grievance regarding your personal data processing",
}

export default function GrievancePage() {
  return <GrievanceForm />
}

