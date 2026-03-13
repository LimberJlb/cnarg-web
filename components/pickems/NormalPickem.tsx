'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface NormalPickemProps {
  match: any;
  userId: string;
  rowIndex: number;
}

export default function NormalPickem({ match, userId, rowIndex }: NormalPickemProps) {
  const [prediction, setPrediction] = useState<any>({
    predicted_winner_id: null,
    score_team_1: 0,
    score_team_2: 0
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLocked, setIsLocked] = useState(false); // Estado para bloquear la edición
  const [showConfirm, setShowConfirm] = useState(false); // Paso de confirmación

  // 1. Cargar predicción existente
  useEffect(() => {
    const loadPrediction = async () => {
      const { data } = await supabase
        .from('predictions_normal')
        .select('*')
        .eq('match_id', match.id)
        .eq('user_id', userId)
        .eq('row_index', rowIndex)
        .single();

      if (data) {
        setPrediction({
          predicted_winner_id: data.predicted_winner_id,
          score_team_1: data.score_team_1 || 0,
          score_team_2: data.score_team_2 || 0
        });
        setIsLocked(true); // Si hay data, bloqueamos inmediatamente
      }
    };
    loadPrediction();
  }, [match.id, userId, rowIndex]);

  // 2. Guardar permanentemente
  const handleConfirm = async () => {
    if (!prediction.predicted_winner_id) return alert("Selecciona un ganador primero.");
    
    setIsSaving(true);
    // Usamos INSERT en lugar de UPSERT para que sea irreversible
    const { error } = await supabase
      .from('predictions_normal')
      .insert({
        user_id: userId,
        match_id: match.id,
        row_index: rowIndex,
        predicted_winner_id: prediction.predicted_winner_id,
        score_team_1: prediction.score_team_1,
        score_team_2: prediction.score_team_2
      });

    if (!error) {
      setIsLocked(true);
      setShowConfirm(false);
      alert("¡Predicción confirmada permanentemente!");
    } else {
      console.error(error);
      alert("Hubo un error al guardar o ya habías predicho este partido.");
    }
    setIsSaving(false);
  };

  return (
    <div className={`p-8 flex flex-col items-center gap-6 bg-[#111] rounded-sm border transition-all ${isLocked ? 'border-zinc-800' : 'border-white/5 hover:border-white/20'}`}>
      
      {/* Indicador de bloqueo */}
      {isLocked && (
        <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest bg-zinc-900 px-3 py-1 border border-white/5">
          🔒 Bloqueado (Permanente)
        </div>
      )}

      <div className="w-full flex justify-between items-center gap-4">
        
        {/* TEAM 1 */}
        <button 
          disabled={isLocked}
          onClick={() => setPrediction({ ...prediction, predicted_winner_id: match.team_1_id })}
          className={`flex flex-col items-center gap-3 group flex-1 p-4 border-2 transition-all cursor-pointer
            ${isLocked ? 'cursor-not-allowed' : ''}
            ${prediction.predicted_winner_id === match.team_1_id ? 'border-[#fdc15a] bg-[#fdc15a]/5' : 'border-transparent opacity-60 hover:opacity-100'}`}
        >
          <img src={match.team_1?.logo_url || '/no-logo.png'} className="w-16 h-16 object-contain" alt="" />
          <p className="font-['ITCMachine'] text-[10px] uppercase text-zinc-500">{match.team_1?.name}</p>
          <input 
            type="number" 
            disabled={isLocked}
            value={prediction.score_team_1}
            onChange={(e) => setPrediction({ ...prediction, score_team_1: parseInt(e.target.value) || 0 })}
            className="w-16 bg-black border border-white/10 p-2 text-center font-black text-xl text-[#fdc15a] focus:border-[#fdc15a] outline-none disabled:bg-zinc-900" 
          />
        </button>

        <div className="font-['ITCMachine'] text-2xl italic opacity-10">VS</div>

        {/* TEAM 2 */}
        <button 
          disabled={isLocked}
          onClick={() => setPrediction({ ...prediction, predicted_winner_id: match.team_2_id })}
          className={`flex flex-col items-center gap-3 group flex-1 p-4 border-2 transition-all cursor-pointer
            ${isLocked ? 'cursor-not-allowed' : ''}
            ${prediction.predicted_winner_id === match.team_2_id ? 'border-[#fdc15a] bg-[#fdc15a]/5' : 'border-transparent opacity-60 hover:opacity-100'}`}
        >
          <img src={match.team_2?.logo_url || '/no-logo.png'} className="w-16 h-16 object-contain" alt="" />
          <p className="font-['ITCMachine'] text-[10px] uppercase text-zinc-500">{match.team_2?.name}</p>
          <input 
            type="number" 
            disabled={isLocked}
            value={prediction.score_team_2}
            onChange={(e) => setPrediction({ ...prediction, score_team_2: parseInt(e.target.value) || 0 })}
            className="w-16 bg-black border border-white/10 p-2 text-center font-black text-xl text-[#fdc15a] focus:border-[#fdc15a] outline-none disabled:bg-zinc-900" 
          />
        </button>
      </div>

      {/* Flujo de Confirmación */}
      {!isLocked ? (
        !showConfirm ? (
          <button 
            onClick={() => setShowConfirm(true)}
            className="w-full py-4 font-black uppercase tracking-[0.2em] text-[11px] transition-all bg-[#fdc15a] text-black hover:bg-white"
          >
            Confirmar Predicción
          </button>
        ) : (
          <div className="w-full flex flex-col gap-2 animate-in fade-in duration-300">
            <p className="text-[9px] text-red-500 font-bold text-center uppercase tracking-widest mb-1">
              ¿Seguro? No podrás editarla después.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 bg-zinc-800 text-white font-black text-[10px] uppercase">Cancelar</button>
              <button onClick={handleConfirm} disabled={isSaving} className="flex-1 py-3 bg-red-600 text-white font-black text-[10px] uppercase">Confirmar</button>
            </div>
          </div>
        )
      ) : null}
    </div>
  );
}