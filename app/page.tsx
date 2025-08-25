"use client";
import { useMemo, useState } from "react";
import ResistorPreview from "@/components/ResistorPreview";
import {
  digits,
  multipliers,
  tolerances,
  type Digit,
  type Multiplier,
  type Tolerance,
  formatResistance,
} from "@/lib/resistor";

export default function Page() {
  const [first, setFirst] = useState<Digit>("black");
  const [second, setSecond] = useState<Digit>("black");
  const [third, setThird] = useState<Multiplier>("black");
  const [fourth, setFourth] = useState<Tolerance>("gold");

  const display = useMemo(
    () => formatResistance(first, second, third, fourth),
    [first, second, third, fourth]
  );

  return (
    <main className="mx-auto max-w-3xl px-6 py-8 text-white rounded-xl shadow-lg">
      <header className="flex flex-col items-center gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-fuchsia-600">
          Calculate Resistor
        </h1>
      </header>
      {/* <h1 className="text-4xl font-bold text-center text-yellow-400"></h1> */}

      {/* Resistor preview */}
      <section className="mt-6">
        <ResistorPreview
          first={first}
          second={second}
          third={third}
          fourth={fourth}
        />
      </section>

      {/* Selectors */}
      <section className="mx-auto mt-6 max-w-3xl">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select
            className="w-full rounded-lg border border-gray-700 bg-gray-800 text-white px-3 py-2 shadow-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
            value={first}
            onChange={(e) => setFirst(e.target.value as Digit)}
          >
            {digits.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            className="w-full rounded-lg border border-gray-700 bg-gray-800 text-white px-3 py-2 shadow-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
            value={second}
            onChange={(e) => setSecond(e.target.value as Digit)}
          >
            {digits.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            className="w-full rounded-lg border border-gray-700 bg-gray-800 text-white px-3 py-2 shadow-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
            value={third}
            onChange={(e) => setThird(e.target.value as Multiplier)}
          >
            {multipliers.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            className="w-full rounded-lg border border-gray-700 bg-gray-800 text-white px-3 py-2 shadow-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
            value={fourth}
            onChange={(e) => setFourth(e.target.value as Tolerance)}
          >
            {tolerances.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Output */}
      <section className="mt-6 flex justify-center">
        <h3 className="text-3xl font-bold bg-gray-800 px-4 py-2 rounded-lg shadow-md">
          {display}
        </h3>
      </section>
    </main>
  );
}
