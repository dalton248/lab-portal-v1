'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';

export default function ProfitRecoveryCalculator() {
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(100000);
  const [labBillPercentage, setLabBillPercentage] = useState<number>(9);

  const currentCost = monthlyRevenue * (labBillPercentage / 100);
  const labopsCostHigh = monthlyRevenue * 0.04;
  const labopsCostLow = monthlyRevenue * 0.03;
  const monthlyProfitRecoveryLow = currentCost - labopsCostHigh;
  const monthlyProfitRecoveryHigh = currentCost - labopsCostLow;
  const annualProfitIncreaseLow = monthlyProfitRecoveryLow * 12;
  const annualProfitIncreaseHigh = monthlyProfitRecoveryHigh * 12;

  const currentMaxScale = 20; // Assume max 20% for scale purposes
  const currentCostWidth = Math.min((labBillPercentage / currentMaxScale) * 100, 100);
  const labopsCostWidth = (4 / currentMaxScale) * 100;

  return (
    <section className="py-24 bg-[#12141d] text-white overflow-hidden relative border-t border-slate-800">
      {/* Subtle blueprint grid background */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Side: Hook & Sliders */}
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
              Stop Overpaying <br />
              <span className="text-emerald-400">for Your Lab.</span>
            </h2>
            <p className="text-lg text-slate-400 mb-10 leading-relaxed font-light">
              The national average for lab spend is 9%. At LabOps, our efficiency brings you down to <strong className="text-white">3-4%</strong>. Stop &quot;underperforming&quot; and start recovering your critical margins today.
            </p>
            
            <div className="space-y-8 bg-slate-800/40 p-8 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Monthly Revenue</label>
                  <span className="text-xl font-bold text-white">${monthlyRevenue.toLocaleString()}</span>
                </div>
                <input 
                  type="range" 
                  min="50000" 
                  max="1000000" 
                  step="10000" 
                  value={monthlyRevenue} 
                  onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
                  className="w-full accent-blue-500 bg-slate-700 rounded-lg appearance-none h-2 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-2 font-medium">
                  <span>$50k</span>
                  <span>$1M+</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Current Lab Bill %</label>
                  <span className="text-xl font-bold text-rose-400">{labBillPercentage}%</span>
                </div>
                <input 
                  type="range" 
                  min="4" 
                  max="20" 
                  step="1" 
                  value={labBillPercentage} 
                  onChange={(e) => setLabBillPercentage(Number(e.target.value))}
                  className="w-full accent-rose-500 bg-slate-700 rounded-lg appearance-none h-2 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-2 font-medium">
                  <span>4%</span>
                  <span>20%</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Side: Results Visualization */}
          <div className="relative">
            <div className="absolute -inset-4 bg-blue-500/10 blur-3xl rounded-full z-0"></div>
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 shadow-2xl relative z-10 flex flex-col h-full">
              
              <div className="mb-10 text-center">
                <span className="text-slate-400 text-sm font-bold uppercase tracking-widest block mb-2">Monthly Profit Recovered</span>
                {monthlyProfitRecoveryHigh > 0 ? (
                  <div className="text-4xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-300 to-blue-600 drop-shadow-[0_0_20px_rgba(59,130,246,0.8)] tabular-nums tracking-tighter">
                    ${Math.max(0, monthlyProfitRecoveryLow).toLocaleString()} - ${monthlyProfitRecoveryHigh.toLocaleString()}
                  </div>
                ) : (
                  <div className="text-5xl font-black text-slate-500 tabular-nums">
                    $0
                  </div>
                )}
                
                <div className="mt-4 text-emerald-400 font-semibold tracking-wide flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                  ${Math.max(0, annualProfitIncreaseLow).toLocaleString()} - ${annualProfitIncreaseHigh.toLocaleString()} Annual Profit Increase
                </div>
              </div>

              {/* Progress Bars */}
              <div className="space-y-6 flex-grow flex flex-col justify-center">
                <div>
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span className="text-slate-400">Current Average Provider Cost ({labBillPercentage}%)</span>
                    <span className="text-slate-300">${currentCost.toLocaleString()}</span>
                  </div>
                  <div className="h-4 bg-slate-800 rounded-full overflow-hidden flex">
                    <div className="bg-rose-500/80 h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${currentCostWidth}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span className="text-blue-400 font-bold">LabOps Cost (3-4%)</span>
                    <span className="text-blue-300 font-bold">${labopsCostLow.toLocaleString()} - ${labopsCostHigh.toLocaleString()}</span>
                  </div>
                  <div className="h-4 bg-slate-800 rounded-full overflow-hidden flex shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                    <div className="bg-blue-500 h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(59,130,246,0.8)]" style={{ width: `${labopsCostWidth}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="mt-10">
                <Button 
                  size="lg" 
                  className="w-full py-7 text-lg bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-[0_0_30px_rgba(59,130,246,0.4)] transition-all hover:scale-[1.02]"
                  onClick={() => {
                    const event = new CustomEvent('openConnectScannerModal');
                    window.dispatchEvent(event);
                  }}
                >
                  Lock in my 3-4% Rate
                </Button>
              </div>

            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
