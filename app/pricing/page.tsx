import type { Metadata } from "next"
import Link from "next/link"
import { CheckCircle2, ArrowRight, Sparkles, Zap, Shield, TrendingUp, ChevronDown } from "lucide-react"

import { PublicShell } from "@/components/layout/public-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export const metadata: Metadata = {
  title: "Pricing | Ease My Salon",
  description: "Simple, transparent pricing with free trial. Choose Starter, Professional or Enterprise plans for your salon.",
}

const planCards = [
  {
    title: "Starter",
    price: "₹999",
    per: "per month",
    description: "Perfect for small salons just getting started.",
    includes: [
      "Up to 3 staff members",
      "POS & Billing",
      "Appointment Management",
      "Basic Reports",
      "WhatsApp Receipts",
      "100 SMS/month",
      "Email Support",
      "Mobile App Access",
    ],
  },
  {
    title: "Professional",
    price: "₹2,499",
    per: "per month",
    description: "For growing salons with multiple staff.",
    includes: [
      "Up to 10 staff members",
      "Everything in Starter",
      "Inventory Management",
      "Customer CRM with History",
      "Advanced Analytics & Reports",
      "Staff Commission Tracking",
      "500 SMS/month",
      "Priority Email & Phone Support",
      "Custom Receipt Templates",
      "Data Export (Excel/PDF)",
    ],
    popular: true,
  },
  {
    title: "Enterprise",
    price: "Custom",
    per: "contact us",
    description: "For salon chains and large businesses.",
    includes: [
      "Unlimited staff members",
      "Everything in Professional",
      "Multi-location Support",
      "Centralized Reporting",
      "Custom Integrations & API",
      "Unlimited SMS",
      "Dedicated Account Manager",
      "On-site Training & Onboarding",
      "24/7 Priority Phone Support",
      "Custom Feature Development",
    ],
  },
]

const pricingFaq = [
  { q: "Is there a free trial?", a: "Yes, every plan comes with a 14-day full-featured trial. No credit card required." },
  { q: "Can I upgrade or downgrade anytime?", a: "Absolutely. Plans can be changed instantly and invoices are prorated." },
  { q: "Do you offer annual billing?", a: "Annual commitments receive up to 20% savings plus onboarding credits." },
  { q: "What about data migration?", a: "Our concierge team imports clients, services, price lists and packages for free." },
  { q: "Is support included?", a: "Starter includes email support. Professional adds WhatsApp + phone. Enterprise gets 24/7 concierge." },
]

export default function PricingPage() {
  return (
    <PublicShell>
      <section className="relative overflow-hidden bg-gradient-to-br from-[#7C3AED] via-[#8B5CF6] to-[#A855F7] text-white py-20 lg:py-28">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white rounded-full blur-3xl" />
        </div>
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-4xl space-y-8">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
            Simple Pricing That Grows With Your Business
          </h1>
          <p className="text-xl sm:text-2xl text-purple-100 leading-relaxed">
            Start with a <span className="font-semibold text-white">14-day free trial</span>. No credit card required. Switch plans anytime—we'll prorate your invoice.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 text-sm text-left text-white/80">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
              <p className="text-base font-semibold text-white">Transparent by design</p>
              <p>No setup fees. No hidden charges. Honest invoices every month.</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
              <p className="text-base font-semibold text-white">Switch plans anytime</p>
              <p>Pause, upgrade or downgrade in a click. Billing prorates instantly across all branches.</p>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-4 pt-4 text-sm text-purple-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-300" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-300" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-300" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {planCards.map((plan) => (
              <Card 
                key={plan.title} 
                className={`relative border-2 transition-all hover:shadow-2xl ${
                  plan.popular 
                    ? "border-[#7C3AED] shadow-2xl scale-[1.02] lg:-mt-4 lg:mb-4" 
                    : "border-slate-200 hover:border-[#7C3AED]/50 shadow-lg"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white px-4 py-1.5 text-sm font-semibold shadow-lg">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="space-y-4 pt-8">
                  <div>
                    <CardTitle className="text-3xl font-bold text-slate-900">{plan.title}</CardTitle>
                    <CardDescription className="text-base text-slate-600 mt-2">{plan.description}</CardDescription>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-slate-900">{plan.price}</span>
                      {plan.per && <span className="text-lg text-slate-500 font-normal">/{plan.per}</span>}
                    </div>
                    {plan.price !== "Custom" && (
                      <p className="text-sm text-slate-500">Billed monthly • Cancel anytime</p>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.includes.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-700 font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    asChild 
                    size="lg" 
                    className={`w-full py-6 text-base font-semibold ${
                      plan.popular 
                        ? "bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-lg shadow-purple-200" 
                        : "bg-slate-900 hover:bg-slate-800 text-white"
                    }`}
                  >
                    <Link href="/contact">
                      {plan.price === "Custom" ? "Contact Sales" : "Start Free Trial"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  {plan.price !== "Custom" && (
                    <p className="text-xs text-center text-slate-500">14-day free trial • No credit card required</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Value Proposition */}
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100">
              <Zap className="h-8 w-8 text-[#7C3AED] mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900 mb-2">Setup in 24 Hours</h3>
              <p className="text-sm text-slate-600">We migrate your data, train your team, and launch you in under a day.</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
              <Shield className="h-8 w-8 text-emerald-600 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900 mb-2">Enterprise-Grade Security</h3>
              <p className="text-sm text-slate-600">Bank-level encryption, GDPR compliant, and daily backups included.</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100">
              <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900 mb-2">ROI Guaranteed</h3>
              <p className="text-sm text-slate-600">Most salons see 3x ROI within 90 days through reduced wastage and better retention.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <Badge className="bg-purple-100 text-[#7C3AED]">Common Questions</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Everything You Need to Know</h2>
            <p className="text-lg text-slate-600">Transparent answers to help you make the right decision for your salon.</p>
          </div>
          <div className="max-w-5xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {pricingFaq.map((item, idx) => (
                <AccordionItem
                  key={idx}
                  value={`faq-${idx}`}
                  className="border-2 border-slate-100 rounded-2xl px-4 shadow-sm hover:shadow-lg transition-all"
                >
                  <AccordionTrigger className="py-4 text-left font-semibold text-slate-900 hover:no-underline group">
                    <div className="flex items-center gap-3 text-base">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-[#7C3AED] text-sm font-bold">
                        {idx + 1}
                      </span>
                      <span className="flex-1">{item.q}</span>
                      <ChevronDown className="h-4 w-4 text-slate-500 transition-transform group-data-[state=open]:rotate-180" />
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 pl-11 text-sm text-slate-700 leading-relaxed">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          
          {/* Final CTA */}
          <div className="rounded-3xl bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#A855F7] text-white p-10 lg:p-16 text-center shadow-2xl max-w-4xl mx-auto">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-white/80" />
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Still Have Questions?</h2>
            <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
              Our team is here to help. Book a personalized demo or chat with us on WhatsApp.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="bg-white text-[#7C3AED] hover:bg-gray-100 px-8 py-6 h-auto text-lg font-semibold shadow-2xl">
                <Link href="/contact">
                  Book a Free Demo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                asChild
                className="bg-white text-[#25D366] hover:bg-emerald-50 px-8 py-6 h-auto text-lg font-semibold shadow-2xl"
              >
                <a href="https://wa.me/917091140602" target="_blank" rel="noreferrer">
                  Chat on WhatsApp
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  )
}

