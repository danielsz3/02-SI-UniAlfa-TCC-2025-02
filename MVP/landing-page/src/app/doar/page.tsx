"use client";

import { Navbar } from "@/components/navbar";

export default function DoarPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background flex flex-col items-center px-4 py-10">
        <div className="max-w-4xl w-full text-center">
          <h1 className="text-3xl font-bold mb-8">Ajude na causa</h1>

          <img
            src="https://www.vereadorafernandamoreno.com.br/wp-content/uploads/2020/12/Protetor-de-animais.jpg"
            alt="Ajude na causa - imagem de animais"
            className="mx-auto mb-6 max-w-full h-auto rounded-md shadow-md"
          />

          <p className="mb-10 text-gray-700 dark:text-gray-300 text-lg">
            Contribua com uma doação para ajudar os animais em situação de abandono.
          </p>

          <div className="flex flex-col md:flex-row justify-center items-center gap-8">
            {/* Container QR Code */}
            <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-6 w-72 shadow-lg">
              <img
                src="/qrcode-pix.png"
                alt="QR Code Pix"
                className="mx-auto w-64 h-64 object-contain"
              />
              <div className="text-center text-sm font-semibold mt-4">
                <p>Chave Pix</p>
                <p>CNPJ:</p>
                <p>61.706.437/0001-30</p>
              </div>
            </div>

            {/* Container Dados Bancários */}
            <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-6 w-72 shadow-lg text-left text-sm font-semibold">
              <p className="mb-4 font-bold text-lg">Dados Bancários</p>
              <p><strong>Banco:</strong> </p>
              <p><strong>Número da Conta:</strong> 0000000</p>
              <p><strong>Agência:</strong> 0000000</p>
              <p><strong>Conta:</strong> Conta Corrente</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}