'use client'

import React, { useState, useEffect } from 'react';
import { Play, Zap, Target, RotateCcw, Flame, Droplets, Wind, Mountain, Sparkles, Trash2, Plus, Swords } from 'lucide-react';

interface Spell {
  id: number;
  name: string;
  element: string;
  attack: number;
  modifierValue: number; // The value this card adds when used as a modifier
  modifiers?: Modifier[];
  tapped?: boolean;
  ability?: string;
}

interface Area {
  id: number;
  name: string;
  defense: number;
  immunity?: string;
  defeated?: boolean;
  currentDamage?: number;
}

interface Modifier {
  name: string;
  attack: number;
  element?: string;
  source?: string;
  id: number;
}

interface GameState {
  player1Spells: Spell[];
  spellRow: Spell[];
  areaZone: Area[];
  discardPile: Spell[];
  removedFromGame: Spell[];
  spellsCastThisTurn: number;
  maxSpells: number;
  turnCount: number;
}

interface FuseState {
  source: number | null;
  target: number | null;
  step: 'select_source' | 'select_target';
}

const DoomCasterDemo = () => {
  const [gameMode, setGameMode] = useState<'normal' | 'fusing' | 'targeting'>('normal');
  const [selectedSpell, setSelectedSpell] = useState<number | null>(null);
  const [selectedSpellbook, setSelectedSpellbook] = useState<number | null>(null);
  const [fuseState, setFuseState] = useState<FuseState>({ source: null, target: null, step: 'select_source' });
  const [animatingCards, setAnimatingCards] = useState<number[]>([]);
  const [gameLog, setGameLog] = useState<string[]>([]);
  const [elementsPlayedThisTurn, setElementsPlayedThisTurn] = useState<string[]>([]);
  
  const [gameState, setGameState] = useState<GameState>({
    player1Spells: [
      { id: 1, name: 'Shape Water', element: 'water', attack: 0, modifierValue: 3, modifiers: [], tapped: false, ability: 'Fuse' },
      { id: 2, name: 'Gather Wind', element: 'wind', attack: 3, modifierValue: 2, modifiers: [], tapped: false, ability: 'Combo [Fire] or [Water] or [Earth] = +1 ATK' },
      { id: 3, name: 'Conjure Fire', element: 'fire', attack: 5, modifierValue: 3, modifiers: [], tapped: false, ability: undefined },
      { id: 4, name: 'Raise Earth', element: 'earth', attack: 4, modifierValue: 2, modifiers: [], tapped: false, ability: undefined },
      { id: 5, name: 'Unleash Void', element: 'void', attack: 0, modifierValue: 3, modifiers: [], tapped: false, ability: 'Banish' }
    ],
    spellRow: [
      { id: 11, name: 'Fireball', element: 'fire', attack: 4, modifierValue: 3, modifiers: [], tapped: false, ability: 'Combo [Fire] = +3 ATK' },
      { id: 12, name: 'Tidal Barrage', element: 'water', attack: 3, modifierValue: 4, modifiers: [], tapped: false, ability: 'Combo [Water] = +4 ATK' },
      { id: 13, name: 'Sonic Boom', element: 'wind', attack: 5, modifierValue: 4, modifiers: [], tapped: false, ability: undefined },
      { id: 14, name: 'Earthquake', element: 'earth', attack: 4, modifierValue: 4, modifiers: [], tapped: false, ability: undefined },
      { id: 15, name: 'Essence Lance', element: 'void', attack: 10, modifierValue: 3, modifiers: [], tapped: false, ability: 'Banish' }
    ],
    areaZone: [
      { id: 21, name: 'Barren Fields', defense: 25, immunity: undefined, defeated: false, currentDamage: 0 },
      { id: 22, name: 'Molten Crater', defense: 15, immunity: 'fire', defeated: false, currentDamage: 0 },
      { id: 23, name: 'Sky Temple', defense: 20, immunity: 'wind', defeated: false, currentDamage: 0 }
    ],
    discardPile: [],
    removedFromGame: [],
    spellsCastThisTurn: 0,
    maxSpells: 3,
    turnCount: 1
  });

  const elements: Record<string, { icon: any; color: string; bg: string; border: string }> = {
    fire: { icon: Flame, color: 'text-red-500', bg: 'bg-red-900/30', border: 'border-red-500' },
    water: { icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-900/30', border: 'border-blue-500' },
    wind: { icon: Wind, color: 'text-green-500', bg: 'bg-green-900/30', border: 'border-green-500' },
    earth: { icon: Mountain, color: 'text-yellow-600', bg: 'bg-yellow-900/30', border: 'border-yellow-600' },
    void: { icon: Sparkles, color: 'text-purple-500', bg: 'bg-purple-900/30', border: 'border-purple-500' }
  };

  const addToLog = (message: string) => {
    setGameLog(prev => [...prev.slice(-4), message]);
  };

  // Calculate total attack including modifiers
  const calculateAttack = (spell: Spell) => {
    let totalAttack = spell.attack;
    
    // Apply modifiers
    if (spell.modifiers) {
      spell.modifiers.forEach(mod => {
        totalAttack += mod.attack || 0;
      });
    }
    
    return { attack: totalAttack, element: spell.element };
  };

  // Check combo requirements
  const checkCombo = (spell: Spell) => {
    if (!spell.ability?.includes('Combo')) return { satisfied: false, bonus: 0 };
    
    const comboMatch = spell.ability.match(/Combo \[([^\]]+)\](?: or \[([^\]]+)\])?(?: and \[([^\]]+)\])? = \+(\d+) ATK/);
    if (!comboMatch) return { satisfied: false, bonus: 0 };
    
    const requiredElements = [comboMatch[1], comboMatch[2], comboMatch[3]].filter(Boolean);
    const bonus = parseInt(comboMatch[4]);
    
    // Check if elements are satisfied
    const isOr = spell.ability.includes(' or ');
    const isAnd = spell.ability.includes(' and ');
    
    let satisfied = false;
    if (isOr) {
      satisfied = requiredElements.some(element => elementsPlayedThisTurn.includes(element.toLowerCase()));
    } else if (isAnd) {
      satisfied = requiredElements.every(element => elementsPlayedThisTurn.includes(element.toLowerCase()));
    } else {
      satisfied = elementsPlayedThisTurn.includes(requiredElements[0].toLowerCase());
    }
    
    return { satisfied, bonus: satisfied ? bonus : 0 };
  };

  // Use spell ability (simplified for Fuse only)
  const useSpellAbility = (spellIndex: number) => {
    const spell = gameState.player1Spells[spellIndex];
    
    if (!spell.ability) {
      addToLog("❌ This spell has no ability!");
      return;
    }

    if (spell.tapped) {
      addToLog("❌ Spell already used this turn!");
      return;
    }

    // Handle Fuse ability only
    if (spell.ability.includes('Fuse')) {
      startFusingFromAbility(spellIndex);
    } else {
      addToLog(`❌ ${spell.name} ability not implemented in this demo!`);
    }
    
    setSelectedSpellbook(null);
  };

  // Start fusing from ability button
  const startFusingFromAbility = (spellIndex: number) => {
    setGameMode('fusing');
    setFuseState({ source: spellIndex, target: null, step: 'select_target' });
    addToLog(`🔄 Select target spell to fuse ${gameState.player1Spells[spellIndex].name} to`);
  };

  // Execute fuse
  const executeFuse = (sourceIndex: number, targetIndex: number) => {
    const sourceSpell = gameState.player1Spells[sourceIndex];
    const targetSpell = gameState.player1Spells[targetIndex];
    
    setAnimatingCards([sourceSpell.id, targetSpell.id]);
    
    setTimeout(() => {
      setGameState(prev => {
        const newState = { ...prev };
        
        // Create modifier from source spell using modifierValue
        const modifier = {
          name: `${sourceSpell.name} Modifier`,
          attack: sourceSpell.modifierValue,
          element: sourceSpell.element,
          source: 'fuse',
          id: Date.now()
        };
        
        // Add modifier to target spell
        newState.player1Spells = [...prev.player1Spells];
        newState.player1Spells[targetIndex] = {
          ...targetSpell,
          modifiers: [...(targetSpell.modifiers || []), modifier]
        };
        
        // Remove source spell from spellbook
        newState.player1Spells = newState.player1Spells.filter((_, i) => i !== sourceIndex);
        
        return newState;
      });
      
      addToLog(`🔄 ${sourceSpell.name} (+${sourceSpell.modifierValue}) fused to ${targetSpell.name}!`);
      setAnimatingCards([]);
      setFuseState({ source: null, target: null, step: 'select_source' });
      setGameMode('normal');
    }, 800);
  };

  // Execute attack (simplified)
  const executeAttack = (areaIndex: number) => {
    if (selectedSpell === null) return;
    
    const spell = gameState.player1Spells[selectedSpell];
    const area = gameState.areaZone[areaIndex];
    
    setAnimatingCards([spell.id, area.id]);
    
    setTimeout(() => {
      let modifiedSpell = { ...spell };
      let shouldBanish = false;
      
      // Handle Banish ability
      if (spell.ability?.includes('Banish')) {
        shouldBanish = true;
        addToLog(`🚫 ${spell.name} will be banished after attack`);
      }
      
      // Check combo
      const combo = checkCombo(modifiedSpell);
      
      if (combo.satisfied) {
        addToLog(`💥 Combo activated! +${combo.bonus} damage`);
      }
      
      // Calculate final attack
      const attackInfo = calculateAttack(modifiedSpell);
      let finalAttack = attackInfo.attack + combo.bonus;
      
      // Check immunity
      const isImmune = area.immunity === attackInfo.element;
      const damage = isImmune ? 0 : finalAttack;
      
      setGameState(prev => {
        const newState = { ...prev };
        
        // Add element to played this turn
        setElementsPlayedThisTurn(prev => [...prev, modifiedSpell.element]);
        
        // Tap the spell
        newState.player1Spells = [...prev.player1Spells];
        newState.player1Spells[selectedSpell] = { ...modifiedSpell, tapped: true };
        newState.spellsCastThisTurn = prev.spellsCastThisTurn + 1;
        
        // Apply damage
        newState.areaZone = [...prev.areaZone];
        const newDamage = (area.currentDamage || 0) + damage;
        
        if (newDamage >= area.defense) {
          // Area defeated
          newState.areaZone[areaIndex] = { ...area, defeated: true, currentDamage: area.defense };
          
          // Add modifier to the attacking spell (if not banished)
          if (!shouldBanish) {
            const modifier = { 
              name: `${area.name} Power`, 
              attack: 3, 
              source: 'area',
              id: Date.now()
            };
            newState.player1Spells[selectedSpell].modifiers = [...(modifiedSpell.modifiers || []), modifier];
            addToLog(`💥 ${area.name} defeated! +3 modifier added to ${modifiedSpell.name}`);
          } else {
            addToLog(`💥 ${area.name} defeated!`);
          }
        } else {
          newState.areaZone[areaIndex] = { ...area, currentDamage: newDamage };
          addToLog(isImmune ? 
            `🛡️ ${modifiedSpell.name} blocked by immunity!` : 
            `⚔️ ${modifiedSpell.name} deals ${damage} damage to ${area.name}`
          );
        }
        
        // Handle Banish
        if (shouldBanish) {
          newState.removedFromGame = [...prev.removedFromGame, modifiedSpell];
          newState.player1Spells = newState.player1Spells.filter((_, i) => i !== selectedSpell);
          addToLog(`🚫 ${modifiedSpell.name} banished from game`);
        }
        
        return newState;
      });
      
      setAnimatingCards([]);
      setSelectedSpell(null);
      setGameMode('normal');
    }, 800);
  };

  // End turn
  const endTurn = () => {
    setGameState(prev => ({
      ...prev,
      player1Spells: prev.player1Spells.map(spell => ({ ...spell, tapped: false })),
      areaZone: prev.areaZone.map(area => ({ ...area, currentDamage: 0 })),
      spellsCastThisTurn: 0,
      turnCount: prev.turnCount + 1
    }));
    
    setElementsPlayedThisTurn([]);
    addToLog(`🔄 Turn ${gameState.turnCount + 1} begins!`);
  };

  const resetGame = () => {
    setGameState({
      player1Spells: [
        { id: 1, name: 'Shape Water', element: 'water', attack: 0, modifierValue: 3, modifiers: [], tapped: false, ability: 'Fuse' },
        { id: 2, name: 'Gather Wind', element: 'wind', attack: 3, modifierValue: 2, modifiers: [], tapped: false, ability: 'Combo [Fire] or [Water] or [Earth] = +1 ATK' },
        { id: 3, name: 'Conjure Fire', element: 'fire', attack: 5, modifierValue: 3, modifiers: [], tapped: false, ability: undefined },
        { id: 4, name: 'Raise Earth', element: 'earth', attack: 4, modifierValue: 2, modifiers: [], tapped: false, ability: undefined },
        { id: 5, name: 'Unleash Void', element: 'void', attack: 0, modifierValue: 3, modifiers: [], tapped: false, ability: 'Banish' }
      ],
      spellRow: [
        { id: 11, name: 'Fireball', element: 'fire', attack: 4, modifierValue: 3, modifiers: [], tapped: false, ability: 'Combo [Fire] = +3 ATK' },
        { id: 12, name: 'Tidal Barrage', element: 'water', attack: 3, modifierValue: 4, modifiers: [], tapped: false, ability: 'Combo [Water] = +4 ATK' },
        { id: 13, name: 'Sonic Boom', element: 'wind', attack: 5, modifierValue: 4, modifiers: [], tapped: false, ability: undefined },
        { id: 14, name: 'Earthquake', element: 'earth', attack: 4, modifierValue: 4, modifiers: [], tapped: false, ability: undefined },
        { id: 15, name: 'Essence Lance', element: 'void', attack: 10, modifierValue: 3, modifiers: [], tapped: false, ability: 'Banish' }
      ],
      areaZone: [
        { id: 21, name: 'Barren Fields', defense: 25, immunity: undefined, defeated: false, currentDamage: 0 },
        { id: 22, name: 'Molten Crater', defense: 15, immunity: 'fire', defeated: false, currentDamage: 0 },
        { id: 23, name: 'Sky Temple', defense: 20, immunity: 'wind', defeated: false, currentDamage: 0 }
      ],
      discardPile: [],
      removedFromGame: [],
      spellsCastThisTurn: 0,
      maxSpells: 3,
      turnCount: 1
    });
    setGameMode('normal');
    setSelectedSpell(null);
    setSelectedSpellbook(null);
    setFuseState({ source: null, target: null, step: 'select_source' });
    setElementsPlayedThisTurn([]);
    setGameLog([]);
    addToLog("🎮 Game Reset - Good luck, DoomCaster!");
  };

  // Check if spellbook has open slots
  const hasOpenSlot = () => gameState.player1Spells.length < 5;

  // Acquire spell from spell row
  const acquireSpell = (spellRowIndex: number) => {
    if (!hasOpenSlot()) {
      addToLog("❌ Spellbook full! Discard a spell first.");
      return;
    }
    
    const spell = gameState.spellRow[spellRowIndex];
    setAnimatingCards([spell.id]);
    
    setTimeout(() => {
      setGameState(prev => {
        const newSpell = { ...spell, modifiers: [], tapped: false };
        const newSpellRow = prev.spellRow.filter((_, i) => i !== spellRowIndex);
        
        return {
          ...prev,
          player1Spells: [...prev.player1Spells, newSpell],
          spellRow: newSpellRow
        };
      });
      
      addToLog(`✅ Acquired ${spell.name}`);
      setAnimatingCards([]);
    }, 500);
  };

  // Discard spell from spellbook
  const discardSpell = (spellIndex: number) => {
    const spell = gameState.player1Spells[spellIndex];
    
    setGameState(prev => ({
      ...prev,
      player1Spells: prev.player1Spells.filter((_, i) => i !== spellIndex),
      discardPile: [...prev.discardPile, spell]
    }));
    
    addToLog(`🗑️ Discarded ${spell.name}`);
    setSelectedSpellbook(null);
  };

  // Start casting process
  const startCasting = (spellIndex: number) => {
    if (gameState.spellsCastThisTurn >= gameState.maxSpells) {
      addToLog("❌ Already cast 3 spells this turn!");
      return;
    }
    
    const spell = gameState.player1Spells[spellIndex];
    if (spell.tapped) {
      addToLog("❌ Spell already used this turn!");
      return;
    }
    
    setSelectedSpell(spellIndex);
    setGameMode('targeting');
    setSelectedSpellbook(null);
    addToLog(`🎯 Select target for ${spell.name}`);
  };

  // Handle fuse selection
  const handleFuseSelection = (spellIndex: number) => {
    const spell = gameState.player1Spells[spellIndex];
    
    if (fuseState.step === 'select_source') {
      if (!spell.ability?.includes('Fuse')) {
        addToLog("❌ This spell cannot fuse!");
        return;
      }
      
      setFuseState({ ...fuseState, source: spellIndex, step: 'select_target' });
      addToLog(`🔄 Selected ${spell.name}. Now select target spell to attach to.`);
    } else if (fuseState.step === 'select_target') {
      if (spellIndex === fuseState.source) {
        addToLog("❌ Cannot fuse spell to itself!");
        return;
      }
      
      executeFuse(fuseState.source!, spellIndex);
    }
  };

  // Game Card Component (simplified)
  const GameCard = ({ 
    card, 
    type, 
    onClick, 
    className = '', 
    isSelected = false, 
    isValidTarget = false, 
    isDisabled = false 
  }: {
    card: Spell | Area;
    type: 'spell' | 'area';
    onClick?: () => void;
    className?: string;
    isSelected?: boolean;
    isValidTarget?: boolean;
    isDisabled?: boolean;
  }) => {
    const element = elements[(card as Spell).element || 'void'] || elements.void;
    const IconComponent = element.icon;
    
    const attackInfo = type === 'spell' ? calculateAttack(card as Spell) : null;
    const areaCard = card as Area;
    const remainingHealth = type === 'area' ? (areaCard.defense - (areaCard.currentDamage || 0)) : null;
    
    return (
      <div 
        className={`
          relative bg-gradient-to-br from-gray-800 to-gray-900 border-2 
          rounded-lg p-3 text-center transition-all duration-300 cursor-pointer
          min-h-[120px] min-w-[90px] flex flex-col justify-between
          ${element.bg}
          ${isSelected ? `${element.border} border-4 shadow-lg shadow-current` : 'border-gray-600'}
          ${isValidTarget ? 'border-yellow-400 animate-pulse' : ''}
          ${(card as Spell).tapped ? 'opacity-60 rotate-12' : ''}
          ${(card as Area).defeated ? 'opacity-40' : ''}
          ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'hover:border-yellow-400 hover:shadow-lg'}
          ${animatingCards.includes(card.id) ? 'animate-bounce z-50 scale-110' : ''}
          ${className}
        `}
        onClick={!isDisabled ? onClick : undefined}
      >
        {/* Card Header */}
        <div className="text-xs font-bold text-gray-300 truncate">
          {card.name}
        </div>
        
        {/* Element Icon */}
        <div className="flex-1 flex items-center justify-center">
          <IconComponent className={`${element.color}`} size={28} />
        </div>
        
        {/* Stats */}
        <div className="text-xs space-y-1">
          {type === 'spell' && attackInfo && (
            <div className={`font-bold`}>
              <span className={elements[attackInfo.element].color}>
                {attackInfo.attack} {attackInfo.element.toUpperCase()} ATK
              </span>
              {attackInfo.attack !== (card as Spell).attack && (
                <span className="text-yellow-400 block text-[10px]">
                  (Base: {(card as Spell).attack})
                </span>
              )}
            </div>
          )}
          {type === 'spell' && (
            <div className="text-purple-400 text-[10px] font-bold">
              Modifier: +{(card as Spell).modifierValue}
            </div>
          )}
          {type === 'area' && !(card as Area).defeated && (
            <div>
              <div className="text-blue-400 font-bold">
                {remainingHealth}/{(card as Area).defense} HP
              </div>
              {typeof areaCard.currentDamage === 'number' && areaCard.currentDamage > 0 && (
                <div className="text-red-400 text-[10px]">
                  -{areaCard.currentDamage} DMG
                </div>
              )}
            </div>
          )}
          {(card as Spell).ability && (
            <div className="text-gray-400 text-[10px] truncate">
              {(card as Spell).ability}
            </div>
          )}
          {type === 'area' && (card as Area).immunity && !(card as Area).defeated && (
            <div className="text-red-400 text-[10px]">
              Immune: {(card as Area).immunity}
            </div>
          )}
        </div>
        
        {/* Modifiers indicator */}
        {type === 'spell' && (card as Spell).modifiers && (card as Spell).modifiers!.length > 0 && (
          <div className="absolute -top-1 -right-1 bg-yellow-500 text-black rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold">
            {(card as Spell).modifiers!.length}
          </div>
        )}
        
        {/* Tapped indicator */}
        {type === 'spell' && (card as Spell).tapped && (
          <div className="absolute top-1 left-1 text-red-400 text-xs font-bold">
            USED
          </div>
        )}
        
        {/* Defeated overlay */}
        {type === 'area' && (card as Area).defeated && (
          <div className="absolute inset-0 bg-green-900/80 rounded-lg flex items-center justify-center">
            <span className="text-green-300 font-bold text-xs">DEFEATED</span>
          </div>
        )}

        {/* Valid target highlight */}
        {isValidTarget && (
          <div className="absolute inset-0 border-2 border-yellow-400 rounded-lg animate-pulse"></div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white rounded-xl shadow-2xl">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
          DoomCaster Puzzle
        </h1>
        <div className="flex justify-center items-center gap-6 text-sm">
          <span>Turn: {gameState.turnCount}</span>
          <span>Spells Cast: {gameState.spellsCastThisTurn}/{gameState.maxSpells}</span>
          <span>Spellbook: {gameState.player1Spells.length}/5</span>
          <span>Elements Played: {elementsPlayedThisTurn.join(', ') || 'None'}</span>
        </div>
      </div>

      {/* Game Mode Indicator */}
      <div className="text-center mb-4">
        {gameMode === 'normal' && (
          <div className="text-green-400">
            🎯 Click spells to see Cast/Discard • Click spell row to acquire
          </div>
        )}
        {gameMode === 'targeting' && (
          <div className="text-yellow-400">
            ⚔️ Select target area to attack with {gameState.player1Spells[selectedSpell!]?.name}
          </div>
        )}
        {gameMode === 'fusing' && (
          <div className="text-blue-400">
            🔄 Fuse Step: {fuseState.step === 'select_source' ? 'Select source spell' : 'Select target spell'}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Main Game Area */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Area Zone */}
          <div>
            <h3 className="text-xl font-bold text-center mb-4 text-purple-400">
              🏰 Area Zone - Defeat to Win!
            </h3>
            <div className="flex justify-center gap-4">
              {gameState.areaZone.map((area, i) => (
                <GameCard
                  key={area.id}
                  card={area}
                  type="area"
                  onClick={() => gameMode === 'targeting' && executeAttack(i)}
                  isValidTarget={gameMode === 'targeting'}
                  isDisabled={area.defeated}
                />
              ))}
            </div>
          </div>

          {/* Spell Row */}
          <div>
            <h3 className="text-lg font-bold text-center mb-4 text-blue-400">
              📚 Spell Row - Click to Acquire ({hasOpenSlot() ? 'Has Space' : 'Full'})
            </h3>
            <div className="flex justify-center gap-3 flex-wrap">
              {gameState.spellRow.map((spell, i) => (
                <GameCard
                  key={spell.id}
                  card={spell}
                  type="spell"
                  onClick={() => gameMode === 'normal' && acquireSpell(i)}
                  isDisabled={!hasOpenSlot() || gameMode !== 'normal'}
                />
              ))}
            </div>
          </div>

          {/* Player Spellbook */}
          <div>
            <h3 className="text-lg font-bold text-center mb-4 text-green-400">
              ⚡ Your Spellbook - Click for Actions
            </h3>
            <div className="flex justify-center gap-3 flex-wrap">
              {gameState.player1Spells.map((spell, i) => (
                <div key={spell.id} className="flex flex-col items-center gap-2">
                  <GameCard
                    card={spell}
                    type="spell"
                    onClick={() => {
                      if (gameMode === 'fusing') {
                        handleFuseSelection(i);
                      } else if (gameMode === 'normal') {
                        setSelectedSpellbook(selectedSpellbook === i ? null : i);
                      }
                    }}
                    isSelected={selectedSpell === i || fuseState.source === i || selectedSpellbook === i}
                    isValidTarget={gameMode === 'fusing' && fuseState.step === 'select_target' && i !== fuseState.source}
                    isDisabled={gameMode === 'targeting'}
                  />
                  
                  {/* Ability/Cast/Discard Buttons */}
                  {selectedSpellbook === i && gameMode === 'normal' && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => useSpellAbility(i)}
                        disabled={spell.tapped || !spell.ability || spell.ability === 'None'}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                      >
                        <Zap size={10} />
                        Ability
                      </button>
                      <button
                        onClick={() => startCasting(i)}
                        disabled={spell.tapped || gameState.spellsCastThisTurn >= gameState.maxSpells}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                      >
                        <Swords size={10} />
                        Cast
                      </button>
                      <button
                        onClick={() => discardSpell(i)}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                      >
                        <Trash2 size={10} />
                        Discard
                      </button>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Add empty slots */}
              {[...Array(5 - gameState.player1Spells.length)].map((_, i) => (
                <div 
                  key={`empty-${i}`}
                  className="min-h-[120px] min-w-[90px] border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center text-gray-500"
                >
                  <Plus size={24} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          
          {/* Controls */}
          <div className="bg-black/30 rounded-lg p-4">
            <h3 className="font-bold text-purple-400 mb-3">🎮 Controls</h3>
            <div className="space-y-2">
              <button
                onClick={endTurn}
                disabled={gameMode !== 'normal'}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-2 px-3 rounded text-sm transition-colors"
              >
                ⏭️ End Turn
              </button>
              <button
                onClick={resetGame}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded text-sm transition-colors"
              >
                🔄 Reset Game
              </button>
            </div>
          </div>

          {/* Game Log */}
          <div className="bg-black/30 rounded-lg p-4">
            <h3 className="font-bold text-purple-400 mb-3">📜 Game Log</h3>
            <div className="space-y-1 text-xs max-h-32 overflow-y-auto">
              {gameLog.length === 0 ? (
                <div className="text-gray-500">No actions yet...</div>
              ) : (
                gameLog.map((log, i) => (
                  <div key={i} className="text-gray-300">{log}</div>
                ))
              )}
            </div>
          </div>

          {/* Keyword Reference */}
          <div className="bg-black/30 rounded-lg p-4">
            <h3 className="font-bold text-purple-400 mb-3">📖 Keywords</h3>
            <div className="text-xs text-gray-300 space-y-1">
              <div><span className="text-red-400">Banish:</span> Remove from game after casting</div>
              <div><span className="text-green-400">Combo [Element]:</span> Bonus if elements played this turn</div>
              <div><span className="text-cyan-400">Fuse:</span> Attach spell as modifier to another spell</div>
            </div>
          </div>

          {/* Discard & Banished */}
          <div className="bg-black/30 rounded-lg p-4">
            <h3 className="font-bold text-purple-400 mb-3">️ Removed Cards</h3>
            <div className="text-xs text-gray-400 space-y-2">
              <div>
                <span className="text-gray-300">Discard:</span>
                {gameState.discardPile.length === 0 ? (
                  " Empty"
                ) : (
                  <div className="mt-1">
                    {gameState.discardPile.map(spell => spell.name).join(', ')}
                  </div>
                )}
              </div>
              <div>
                <span className="text-red-300">Banished:</span>
                {gameState.removedFromGame.length === 0 ? (
                  " None"
                ) : (
                  <div className="mt-1">
                    {gameState.removedFromGame.map(spell => spell.name).join(', ')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Strategy Tips */}
          <div className="bg-black/30 rounded-lg p-4">
            <h3 className="font-bold text-purple-400 mb-3">💡 Strategy</h3>
            <div className="text-xs text-gray-300 space-y-1">
              <div>• Click cards to see Ability/Cast/Discard buttons</div>
              <div>• Use Fuse ability to attach spells as modifiers</div>
              <div>• Play different elements for combo bonuses</div>
              <div>• Banish spells are removed forever after casting</div>
              <div>• Check modifier values before fusing</div>
              <div>• Watch area immunities carefully</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoomCasterDemo; 