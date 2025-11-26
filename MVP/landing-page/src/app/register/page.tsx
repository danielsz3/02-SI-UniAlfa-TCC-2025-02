"use client"

import { useState } from "react"
import PersonalForm from "./PersonalForm"
import AddressForm from "./AddressForm"
import PreferencesForm from "./PreferencesForm"
import ConfirmForm from "./ConfirmForm"
import { Navbar } from "@/components/navbar"

export default function RegisterPage() {
    const [step, setStep] = useState(1)
    const [formData, setFormData] = useState({})

    function nextStep(data: any) {
        setFormData(prev => ({ ...prev, ...data }))
        setStep(step + 1)
    }
    function prevStep() {
        setStep(step - 1)
    }

    return (
        <>
            <Navbar />
            <main className="flex min-h-screen flex-col items-center justify-center">
                {step === 1 && <PersonalForm onNext={nextStep} defaultValues={formData} />}
                {step === 2 && <AddressForm onNext={nextStep} onBack={prevStep} defaultValues={formData} />}
                {step === 3 && <PreferencesForm onNext={nextStep} onBack={prevStep} defaultValues={formData} />}
                {step === 4 && <ConfirmForm data={formData} onBack={prevStep} />}
            </main>
        </>
    )
}
