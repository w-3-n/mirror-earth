import React, { useState, useEffect, useRef } from 'react';
import { CROPS, INITIAL_GRID } from './data';
import { Crop, GameState, Quest, Particle, Relic, WeatherType } from './types';

const INITIAL_QUESTS: Quest[] = [
  { id: 'q1', npc: '门派长老', description: '提供 1 份灵须草样本。', targetCropId: '1', targetGrade: 0, rewardFp: 100, rewardKp: 50, isCompleted: false }
];

const PACKS = [
  { id: 'outer', name: '外门弟子布袋', cost: 30, limit: 5 },
  { id: 'inner', name: '内门弟子木箱', cost: 100, limit: 3 },
  { id: 'booster', name: '地形补充包', cost: 150, limit: 2 },
  { id: 'elder', name: '核心长老私藏', cost: 400, limit: 1 }
];

const INITIAL_RELICS: Relic[] = [
  { id: 'r1', name: '灵泉水', type: 'WATER', maxCharges: 5, currentCharges: 3, particleType: 'WATER', color: '#60a5fa' },
  { id: 'r2', name: '龟甲粉', type: 'FERTILIZER', maxCharges: 5, currentCharges: 2, particleType: 'EARTH', color: '#4ade80' },
  { id: 'r3', name: '除虫散', type: 'PEST', maxCharges: 3, currentCharges: 1, particleType: 'LIGHT', color: '#fef08a' },
  { id: 'r4', name: '雨灵', type: 'RAIN', maxCharges: 2, currentCharges: 0, particleType: 'THUNDER', color: '#a855f7' }
];

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    fp: 500, kp: 1200, rp: 45, inventory: [...CROPS], relics: INITIAL_RELICS,
    grid: INITIAL_GRID(), weather: 'SUNNY', quests: INITIAL_QUESTS,
    restorationProgress: 45, verifiedCrops: [], dailyQuotas: { outer: 5, inner: 3, booster: 2, elder: 1 }
  });

  const [selectedItem, setSelectedItem] = useState<Crop | Relic | null>(null);
  const [activeTab, setActiveTab] = useState<'FARM' | 'LAB' | 'QUOTA'>('FARM');
  const [showArchives, setShowArchives] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const lastSpawnTime = useRef(0);
  const requestRef = useRef<number>();
  const comboRef = useRef({ count: 0, lastTime: 0, lastType: '' });

  // 粒子动画循环 (仅在农场)
  const animate = (time: number) => {
    if (activeTab === 'FARM') {
      setParticles(prev => {
        const next = prev.map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          life: p.life - 1
        })).filter(p => p.life > 0);
        return next;
      });

      if (time - lastSpawnTime.current > 800) {
        spawnParticles();
        lastSpawnTime.current = time;
      }
    } else if (particles.length > 0) {
      setParticles([]); 
    }
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [activeTab, gameState.weather]);

  const spawnParticles = () => {
    const newParticles: Particle[] = [];
    let count = 2;
    if (gameState.weather === 'RAINY' || gameState.weather === 'STORMY') count = 4;

    for (let i = 0; i < count; i++) {
      let type: Particle['type'] = 'EARTH';
      let color = '#4ade80';

      if (gameState.weather === 'SUNNY') { type = 'EARTH'; color = '#4ade80'; }
      else if (gameState.weather === 'RAINY') { type = 'WATER'; color = '#60a5fa'; }
      else if (gameState.weather === 'STORMY') { type = 'THUNDER'; color = '#a855f7'; }
      else if (gameState.weather === 'WINDY') { type = 'LIGHT'; color = '#fef08a'; }

      newParticles.push({
        id: Math.random().toString(),
        type,
        x: Math.random() * window.innerWidth,
        y: Math.random() * (window.innerHeight - 200),
        vx: (Math.random() - 0.5) * 2,
        vy: (gameState.weather === 'RAINY' || gameState.weather === 'STORMY') ? 2 : (Math.random() - 0.5) * 1.5,
        color,
        life: 200
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  };

  const handleParticleInteraction = (p: Particle) => {
    const now = Date.now();
    let reward = 1;
    if (now - comboRef.current.lastTime < 500 && comboRef.current.lastType === p.type) {
      comboRef.current.count += 1;
      if (comboRef.current.count >= 3) reward = 2; 
    } else {
      comboRef.current.count = 1;
      comboRef.current.lastType = p.type;
    }
    comboRef.current.lastTime = now;

    setGameState(prev => ({
      ...prev,
      relics: prev.relics.map(r => {
        if (r.particleType === p.type && r.currentCharges < r.maxCharges) {
          return { ...r, currentCharges: Math.min(r.maxCharges, r.currentCharges + reward) };
        }
        return r;
      })
    }));
    setParticles(prev => prev.filter(item => item.id !== p.id));
  };

  // 游戏心跳
  useEffect(() => {
    const timer = setInterval(() => {
      setGameState(prev => ({
        ...prev,
        grid: prev.grid.map(slot => {
          if (slot.crop && slot.growthProgress < 100) {
            let mod = 1;
            if (prev.weather === 'RAINY') mod = 1.4;
            if (prev.weather === 'STORMY') mod = 1.8;
            const increment = (100 / slot.crop.growthTime) * mod;
            return {
              ...slot,
              growthProgress: Math.min(100, slot.growthProgress + increment),
              isReady: slot.growthProgress + increment >= 100,
              h2o: Math.max(0, slot.h2o - (prev.weather === 'SUNNY' ? 2 : 1)),
              n: Math.max(0, slot.n - 1),
              highNutrientTimer: slot.n > 90 ? slot.highNutrientTimer + 1 : slot.highNutrientTimer,
              perfectH2OTimer: Math.abs(slot.h2o - 50) < 5 ? slot.perfectH2OTimer + 1 : slot.perfectH2OTimer
            };
          }
          return slot;
        })
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState.weather]);

  const handleInteraction = (slotId: string) => {
    if (!selectedItem) return;
    if ('isSeed' in selectedItem) {
      const crop = selectedItem as Crop;
      if (!crop.isSeed || crop.isUnknown) return;
      setGameState(prev => ({
        ...prev,
        grid: prev.grid.map(slot => {
          if (slot.id === slotId && !slot.crop && slot.terrain === crop.terrain) {
            return { ...slot, crop: { ...crop }, growthProgress: 0, isReady: false };
          }
          return slot;
        }),
        inventory: prev.inventory.filter(item => item !== crop)
      }));
      setSelectedItem(null);
    } else {
      const relic = selectedItem as Relic;
      if (relic.currentCharges <= 0) return;
      setGameState(prev => ({
        ...prev,
        grid: prev.grid.map(slot => {
          if (slot.id === slotId) {
            if (relic.type === 'WATER') return { ...slot, h2o: Math.min(100, slot.h2o + 30) };
            if (relic.type === 'FERTILIZER') return { ...slot, n: Math.min(100, slot.n + 40) };
            return slot;
          }
          return slot;
        }),
        relics: prev.relics.map(r => r.id === relic.id ? { ...r, currentCharges: r.currentCharges - 1 } : r)
      }));
    }
  };

  const handleHarvest = (slotId: string) => {
    setGameState(prev => {
      const slot = prev.grid.find(s => s.id === slotId);
      if (!slot || !slot.crop || !slot.isReady) return prev;
      let evolves = false;
      const totalTicks = slot.crop.growthTime;
      if (slot.highNutrientTimer / totalTicks > 0.85) evolves = true;
      if (slot.perfectH2OTimer / totalTicks > 0.9) evolves = true;
      if (slot.type === 'MYSTERY' && Math.random() < 0.25) evolves = true;
      let finalGrade = slot.crop.grade;
      if (evolves && finalGrade < 3) finalGrade += 1;
      const harvestedCrop: Crop = { ...slot.crop, grade: finalGrade, isSeed: false, name: finalGrade > 0 ? `${slot.crop.name} (+${finalGrade})` : slot.crop.name };
      const newInventory = [...prev.inventory, harvestedCrop];
      if (Math.random() < 0.3) newInventory.push({ ...slot.crop, isSeed: true, isUnknown: true, name: '未知种子' });
      const verifiedCrops = finalGrade === 3 && !prev.verifiedCrops.includes(slot.crop.id) ? [...prev.verifiedCrops, slot.crop.id] : prev.verifiedCrops;
      return {
        ...prev, inventory: newInventory, verifiedCrops,
        restorationProgress: Math.min(100, (verifiedCrops.length / CROPS.length) * 100),
        grid: prev.grid.map(s => s.id === slotId ? { ...s, crop: null, growthProgress: 0, isReady: false, highNutrientTimer: 0, perfectH2OTimer: 0 } : s)
      };
    });
  };

  const handleExchange = () => {
    if (!selectedItem || !('isSeed' in selectedItem) || selectedItem.isSeed) return;
    const item = selectedItem as Crop;
    let multiplier = 1.0;
    if (item.grade === 1) multiplier = 1.5;
    if (item.grade === 2) multiplier = 2.5;
    if (item.grade === 3) multiplier = 4.0;
    setGameState(prev => ({
      ...prev,
      fp: prev.fp + Math.floor(item.sellPrice * multiplier),
      inventory: prev.inventory.filter(i => i !== item)
    }));
    setSelectedItem(null);
  };

  const handleApplyQuota = (packId: string) => {
    const pack = PACKS.find(p => p.id === packId);
    if (!pack || gameState.dailyQuotas[packId] <= 0 || gameState.fp < pack.cost) return;
    const newSeeds: Crop[] = [{ ...CROPS[Math.floor(Math.random()*CROPS.length)], isSeed: true, isUnknown: true, name: '未知种子' }];
    setGameState(prev => ({
      ...prev, fp: prev.fp - pack.cost, inventory: [...prev.inventory, ...newSeeds],
      dailyQuotas: { ...prev.dailyQuotas, [packId]: prev.dailyQuotas[packId] - 1 }
    }));
  };

  const cycleWeather = () => {
    const weatherTypes: WeatherType[] = ['SUNNY', 'RAINY', 'STORMY', 'WINDY'];
    setGameState(prev => {
      const idx = weatherTypes.indexOf(prev.weather);
      return { ...prev, weather: weatherTypes[(idx + 1) % weatherTypes.length] };
    });
  };

  const handleDecrypt = () => {
    if (!selectedItem || !('isSeed' in selectedItem) || !selectedItem.isUnknown) return;
    const item = selectedItem as Crop;
    setGameState(prev => ({
      ...prev, inventory: prev.inventory.map(i => i === item ? { ...i, isUnknown: false, name: i.realName || i.name } : i)
    }));
    setSelectedItem(null);
  };

  const handleDeconstruct = () => {
    if (!selectedItem || !('isSeed' in selectedItem) || selectedItem.isSeed) return;
    if (gameState.fp < 20) return;
    const item = selectedItem as Crop;
    const newSeeds: Crop[] = [];
    if (item.grade === 3) {
      newSeeds.push({ ...item, grade: 3, isSeed: true, isUnknown: true, name: '未知种子' });
      newSeeds.push({ ...item, grade: 3, isSeed: true, isUnknown: true, name: '未知种子' });
    } else {
      newSeeds.push({ ...item, isSeed: true, isUnknown: true, name: '未知种子' });
    }
    setGameState(prev => ({
      ...prev, fp: prev.fp - 20, inventory: [...prev.inventory.filter(i => i !== item), ...newSeeds]
    }));
    setSelectedItem(null);
  };

  const currentQuestTarget = CROPS.find(c => c.id === gameState.quests[0].targetCropId);

  return (
    <div className="flex flex-col h-screen overflow-hidden text-sm bg-slate-950 font-sans select-none">
      {/* 粒子层 (仅农场) */}
      {activeTab === 'FARM' && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden" 
             onMouseMove={(e) => {
               const touchRadius = 40;
               particles.forEach(p => {
                 const dx = p.x - e.clientX; const dy = p.y - e.clientY;
                 if (Math.sqrt(dx*dx + dy*dy) < touchRadius) handleParticleInteraction(p);
               });
             }}>
          {particles.map(p => (
            <div key={p.id} className="absolute w-4 h-4 rounded-full blur-[1px] shadow-lg animate-pulse"
              style={{ left: p.x, top: p.y, backgroundColor: p.color, boxShadow: `0 0 15px ${p.color}`, opacity: 0.8 }}
            />
          ))}
        </div>
      )}

      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 z-10">
        <div className="flex space-x-8">
          <div className="flex flex-col"><span className="text-[10px] text-slate-500 uppercase font-black">宗门贡献</span><span className="text-xl font-black text-yellow-500">{gameState.fp}</span></div>
          <div className="flex flex-col"><span className="text-[10px] text-slate-500 uppercase font-black">知识点</span><span className="text-xl font-black text-blue-400">{gameState.kp}</span></div>
        </div>
        <div className="flex items-center space-x-4">
          <nav className="flex bg-slate-800 rounded-full p-1 border border-slate-700 shadow-inner">
            {['FARM', 'LAB', 'QUOTA'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>{tab === 'FARM' ? '农场' : tab === 'LAB' ? '实验室' : '物资申领'}</button>
            ))}
          </nav>
          <button onClick={cycleWeather} className={`px-6 py-2 rounded-full border border-slate-700 text-xs font-black uppercase transition-all bg-slate-800/50 ${gameState.weather === 'SUNNY' ? 'text-orange-400' : 'text-blue-400'}`}>天气: {gameState.weather}</button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden relative">
        {activeTab === 'FARM' && (
          <section className="flex-1 p-8 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 gap-10">
              {['WETLAND', 'GRASSLAND', 'FOREST', 'ROCKY'].map(terrain => (
                <div key={terrain} className="p-6 rounded-[2.5rem] border-2 border-slate-800 bg-slate-900/40 shadow-2xl">
                  <h3 className="text-[10px] font-black tracking-widest text-slate-500 mb-4 uppercase">{terrain}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {gameState.grid.filter(s => s.terrain === terrain).map(slot => (
                      <div key={slot.id} onClick={() => slot.crop ? (slot.isReady ? handleHarvest(slot.id) : handleInteraction(slot.id)) : handleInteraction(slot.id)}
                        className={`h-28 rounded-3xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden
                          ${slot.crop ? 'bg-slate-800 border-white/10' : 'border-dashed border-slate-800 hover:border-slate-700'}
                        `}
                      >
                        {slot.crop ? (
                          <div className="text-center w-full px-3">
                            <div className="text-[11px] font-black text-white truncate">{slot.crop.name}</div>
                            <div className="text-[9px] font-bold text-slate-500 mt-1 uppercase">{slot.isReady ? '可以收获' : `${Math.floor(slot.growthProgress)}%`}</div>
                            <div className="flex space-x-2 mt-2 justify-center opacity-50">
                              <div className="h-1 flex-1 bg-blue-500 rounded-full" style={{ opacity: slot.h2o / 100 }}></div>
                              <div className="h-1 flex-1 bg-green-500 rounded-full" style={{ opacity: slot.n / 100 }}></div>
                            </div>
                            {slot.isReady && <div className="absolute inset-0 bg-yellow-500/10 animate-pulse flex items-center justify-center"><span className="text-[10px] font-black text-slate-900 bg-yellow-500 px-3 py-1 rounded-full">收获</span></div>}
                          </div>
                        ) : <span className="text-[9px] font-black text-slate-800 uppercase tracking-tighter">空置</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'LAB' && (
          <section className="flex-1 p-8 flex flex-col items-center justify-center space-y-12 relative overflow-hidden">
            <div className="flex w-full max-w-5xl justify-between items-center z-10">
               <div className="space-y-6">
                 <div onClick={handleDecrypt} className="w-40 h-40 bg-slate-800/60 border border-blue-500/20 rounded-[2rem] p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-500/5 transition-all shadow-xl">
                   <span className="text-3xl mb-2">🧬</span>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">破译机</span>
                 </div>
                 <div onClick={handleDeconstruct} className="w-40 h-40 bg-slate-800/60 border border-purple-500/20 rounded-[2rem] p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-purple-500/5 transition-all shadow-xl">
                   <span className="text-3xl mb-2">🌀</span>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">分解器</span>
                 </div>
               </div>

               <div className="relative group flex flex-col items-center">
                  <div onClick={() => setShowArchives(true)} 
                       className={`relative w-80 h-[28rem] border rounded-t-[5rem] flex items-center justify-center cursor-pointer transition-all duration-1000
                         ${(currentQuestTarget?.grade === 3) 
                           ? 'bg-white/5 border-white/20 shadow-[0_0_80px_rgba(255,255,255,0.1)]' 
                           : 'bg-blue-500/5 border-blue-500/20 shadow-[0_0_100px_rgba(59,130,246,0.1)]'}
                       `}>
                     <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent"></div>
                     <div className="text-center z-10">
                        <span className={`text-8xl block transition-all duration-1000 ${(currentQuestTarget?.grade === 3) ? 'grayscale-0 scale-110 drop-shadow-2xl' : 'grayscale opacity-50'}`}>
                           {currentQuestTarget ? '🌱' : '❓'}
                        </span>
                        <div className="mt-12 flex flex-col items-center">
                           <div className="text-[14px] font-black text-white uppercase tracking-[0.3em] mb-2">全息栽培槽</div>
                           <div className="text-[10px] font-bold text-blue-400/60 uppercase">点击打开作物资料库</div>
                        </div>
                     </div>
                  </div>
                  <div className="w-96 h-6 bg-slate-800 rounded-full -mt-3 shadow-2xl border-t border-white/5"></div>
               </div>

               <div className="space-y-6">
                 <div className="w-40 h-40 bg-slate-800/60 border border-emerald-500/20 rounded-[2rem] p-6 flex flex-col items-center justify-center opacity-40 cursor-not-allowed grayscale">
                   <span className="text-3xl mb-2">🔬</span>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">验证舱</span>
                 </div>
                 <div className="w-40 h-40 bg-slate-800/60 border border-yellow-500/20 rounded-[2rem] p-6 flex flex-col items-center justify-center opacity-40 cursor-not-allowed grayscale">
                   <span className="text-3xl mb-2">📜</span>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">科技树</span>
                 </div>
               </div>
            </div>

            {showArchives && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-2xl p-20">
                <div className="w-full max-w-5xl h-full bg-slate-900 border border-slate-800 rounded-[3.5rem] p-12 flex flex-col shadow-2xl">
                  <button onClick={() => setShowArchives(false)} className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-xl hover:bg-white/10 transition-all">✕</button>
                  <h3 className="text-3xl font-black text-white uppercase tracking-widest mb-10 pb-6 border-b border-white/5 text-center">作物资料库 <span className="text-blue-500 opacity-50">CROP ARCHIVES</span></h3>
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-6 grid grid-cols-2 gap-8">
                    {CROPS.map(c => (
                      <div key={c.id} className="p-8 bg-slate-800/40 rounded-[2.5rem] border border-white/5 flex flex-col space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-xl font-black text-white">{c.name}</div>
                            <div className="text-[10px] text-slate-500 font-serif italic mt-1">{c.scientificName}</div>
                          </div>
                          <span className="text-[10px] font-black bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full uppercase">{c.terrain}</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed italic opacity-80">“{c.educationalDescription}”</p>
                        <div className="pt-4 border-t border-white/5 flex flex-col">
                          <span className="text-[9px] font-black text-slate-500 uppercase mb-1">进化线索：</span>
                          <span className="text-[11px] text-blue-300">“{c.researchHint}”</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === 'QUOTA' && (
          <section className="flex-1 p-12 overflow-y-auto custom-scrollbar">
            <h2 className="text-2xl font-black text-white uppercase tracking-[0.2em] mb-12 text-center">物资申领系统 <span className="text-blue-500">QUOTA SYSTEM</span></h2>
            <div className="grid grid-cols-4 gap-8 max-w-6xl mx-auto">
              {PACKS.map(pack => (
                <div key={pack.id} className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 flex flex-col items-center text-center group hover:border-blue-500/50 transition-all shadow-lg">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-2xl mb-6 shadow-inner group-hover:scale-110 transition-transform">📦</div>
                  <h3 className="text-sm font-black text-white mb-2 uppercase">{pack.name}</h3>
                  <div className="text-xl font-black text-yellow-500 mb-6">{pack.cost} <span className="text-[10px] opacity-60">FP</span></div>
                  <button onClick={() => handleApplyQuota(pack.id)} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg transition-all active:scale-95">提交申请</button>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* 动作栏 */}
      <footer className="h-44 bg-slate-900/95 backdrop-blur-xl border-t border-white/5 flex p-6 space-x-8 z-10 relative">
        <div className="flex-1 flex space-x-5 overflow-x-auto custom-scrollbar pb-2 items-center pr-10">
          {gameState.relics.map(r => (
            <div key={r.id} onClick={() => setSelectedItem(selectedItem === r ? null : r)}
              className={`min-w-[130px] h-32 rounded-[2rem] border-2 p-5 cursor-pointer transition-all flex flex-col justify-between relative group
                ${selectedItem === r ? 'border-blue-400 -translate-y-4 bg-slate-800 shadow-2xl' : 'border-white/5 bg-slate-800/40 shadow-inner'}
                ${r.currentCharges === 0 ? 'opacity-40 grayscale' : ''}
              `}
            >
              <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">法宝 RELIC</div>
              <div className="text-xs font-black text-white leading-tight">{r.name}</div>
              <div className="flex space-x-1.5 mt-4">
                {[...Array(r.maxCharges)].map((_, i) => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < r.currentCharges ? '' : 'bg-slate-700'}`} style={{ backgroundColor: i < r.currentCharges ? r.color : undefined, boxShadow: i < r.currentCharges ? `0 0 10px ${r.color}` : 'none' }}></div>
                ))}
              </div>
            </div>
          ))}
          <div className="w-[2px] h-20 bg-white/5 rounded-full mx-2 shrink-0"></div>
          {gameState.inventory.map((item, idx) => (
            <div key={idx} onClick={() => setSelectedItem(selectedItem === item ? null : item)}
              className={`min-w-[130px] h-32 rounded-[2rem] border-2 p-5 cursor-pointer transition-all flex flex-col justify-between
                ${selectedItem === item ? 'border-blue-400 -translate-y-4 bg-slate-800 shadow-2xl' : 'border-white/5 bg-slate-800/40 shadow-inner'}
              `}
            >
              <div className="text-[9px] font-black text-slate-500 uppercase mb-1">{item.isSeed ? (item.isUnknown ? '未知种子' : '种子卡') : `样品 Gr.${item.grade}`}</div>
              <div className="text-xs font-black text-white leading-tight truncate">{item.isUnknown ? '???' : item.name}</div>
              <div className="mt-auto flex justify-between items-end">
                {item.isSeed && !item.isUnknown && <span className="text-[9px] font-black text-blue-400 uppercase">{item.terrain}</span>}
                {!item.isSeed && <span className="text-[10px] font-black text-yellow-500">${item.sellPrice}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* 锚点右下角：兑换终端 (Exchange Terminal / Market) */}
        <div 
          onClick={handleExchange}
          className="w-64 bg-yellow-500/5 rounded-[2.5rem] border border-yellow-500/20 p-6 flex flex-col items-center justify-center shadow-inner cursor-pointer hover:bg-yellow-500/10 transition-all group"
        >
           <div className="text-[10px] font-black text-yellow-600 uppercase tracking-[0.2em] mb-2 group-hover:scale-110 transition-transform">兑换终端 <span className="opacity-50">MARKET</span></div>
           <div className="text-3xl font-black text-yellow-500 tracking-tighter animate-pulse">$ {gameState.fp}</div>
           <div className="mt-2 text-[8px] font-bold text-yellow-600/60 uppercase">选中样品后点击兑换</div>
        </div>
      </footer>

      {/* 屏幕最下方的边缘：现实还原进度条 (V2.6) */}
      <div className="px-8 py-2 bg-blue-600/10 border-t border-blue-500/20 flex items-center space-x-6 z-20">
         <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em] shrink-0">现实还原进度 REALITY RESTORATION</span>
         <div className="flex-1 h-2.5 bg-slate-800 rounded-full overflow-hidden border border-white/5">
            <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-400 to-emerald-400 transition-all duration-1000 shadow-[0_0_15px_rgba(59,130,246,0.5)]" style={{ width: `${gameState.restorationProgress}%` }}></div>
         </div>
         <span className="text-xs font-black text-blue-400 w-12 text-right">{Math.floor(gameState.restorationProgress)}%</span>
      </div>
    </div>
  );
};

export default App;
