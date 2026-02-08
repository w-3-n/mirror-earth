# Mirror Earth - Agriculture Education Game Prototype

A high-fidelity prototype for a mobile agriculture education game set in a "Cultivation World" (Xianxia) theme. This project demonstrates core mechanics for terrain management, genetic selection, and educational questing.

## 🌿 Game Concept
Players act as members of the **Shennong Sect**, tasked with evolving wild grasses into spiritual crops through careful selection and environmental management. The game bridges fantasy cultivation with real-world botanical concepts.

## 🕹️ System Architecture & Game Loop

### Interface Schematic (Dual-Grid)
```text
_______________________________________________________________________________
| [ FP: 5000 ] [ KP: 1200 ] [ RP: 45 ]              [ WEATHER: SUN -> RAIN ]  |
|_____________________________________________________________________________|
|                                     |                                       |
|       FARM ZONE (LEFT)              |         FACILITY ZONE (RIGHT)         |
|      (Terrain-based 4x4)            |           (Lab Devices 2x2)           |
|                                     |                                       |
|   [ W ][ W ] | [ G ][ G ]           |       [ RESEARCH ] | [ ANALYSIS ]     |
|   [ W ][ M ] | [ G ][ M ]           |       [ MACHINE  ] | [ CHAMBER  ]     |
|   -----------+-----------           |       -----------+-----------         |
|   [ F ][ F ] | [ R ][ R ]           |       [ DECONST- ] | [ TECH TREE ]    |
|   [ F ][ M ] | [ R ][ M ]           |       [ RUCTOR   ] | [ DEVICE    ]    |
|                                     |                                       |
|_____________________________________|_______________________________________|
| [ NPC QUESTS ] |      [   THE HAND (CARD TRAY)   ]      | [ MARKET TERMINAL ]
|   (Missions)   |      (Seeds & Resources)           |   (FP Conversion) |
|________________|________________________________________|___________________|

LEGEND: [W]=Wetland, [G]=Grassland, [F]=Forest, [R]=Rocky, [M]=Mystery Slot
```

## 🕹️ Comprehensive Game Architecture

### The Macro Game Loop
Mirror Earth operates on three interconnected loops: the **Management Loop**, the **Discovery Loop**, and the **Progression Loop**.

```text
       [ INPUTS ]                     [ CORE LOOP ]                    [ OUTPUTS ]
    Seeds / Quests               Farm & Lab Management              Growth & Wealth
          |                                |                               |
          v                                v                               v
+------------------+             +------------------+             +------------------+
|   CARD PACKS     |             |   4x4 GRID       |             |   FANTASY POINTS |
|   NPC MISSIONS   | ----------> |   MANAGEMENT     | ----------> |   (Market Sell)  |
|   TECH UNLOCKS   |             | (Water/Nutrient) |             |   KNOWLEDGE PTS  |
+------------------+             +------------------+             |   (Analysis)     |
          ^                                |                      +------------------+
          |                                v                               |
          |                      +------------------+                      |
          |                      |   MYSTERY SLOT   |                      |
          |                      |   (Selection)    | <--------------------+
          |                      +------------------+                      |
          |                                |                               |
          |                                v                               v
+------------------+             +------------------+             +------------------+
|  SECT PROMOTION  | <---------- |  HYBRIDIZATION   | <---------- |  RESEARCH TREE   |
| (Inner Disciple) |             |   (Lab Device)   |             |  (Upgrades/Tech) |
+------------------+             +------------------+             +------------------+
```

### The Micro-Level: Detailed Growth Loop
How individual plants progress within the grid slots:

```text
       ( SEED CARD )
            |
            v
      [ PLANTING ] <--------- Checks Terrain Compatibility
            |                 (Wetland/Grassland/Forest/Rocky)
            v
      [   TICK   ] <--------- Weather Modifiers (Sunny: 0.8x-1.2x)
            |                 Nutrient Modifiers (N > 80%: 1.0x)
            v
       [ GROWING ] <--------- H2O Depletion Rate (-1.5%/sec)
            |                 Rain Restoration (+5%/sec)
            v
      [ HARVESTING ]
      /      |      \
     /       |       \
[ FP ]   [ KP ]   [ GRADE UP? ]
  |        |         |
  v        v         v
[SELL] [LAB/TREE] [NEW SEED] ----> Back to Planting
```

### Micro-Interactions Map (Granular Logic)
The low-level state transitions and internal system checks during gameplay:

```text
USER ACTION             SYSTEM CHECK / LOGIC                      STATE UPDATE
---------------------------------------------------------------------------------------
Drag Seed Card   -->    Is Mouse over Slot?               -->     Highlight Target (Green/Red)
  |                     Is Terrain Compatible?
  v
Drop on Slot     -->    Is Slot Empty?                    -->     Subtract Seed from Inventory
                        Is Slot Level Allowed?                    Init Slot {Progress: 0, H2O: 50}
  |
[SYSTEM TICK]    -->    Update H2O based on Weather       -->     H2O State Variable Updated
 (Every 1s)             Calculate GrowthMod =             -->     GrowthProgress += (Base/GrowthTime)
                        (WeatherMod * NutrientMod)                * GrowthMod
  |
Growth == 100%   -->    Trigger Animation                 -->     Set Slot.isReady = True
                                                                  Show "Harvest" Glow
  |
Tap Ready Slot   -->    Roll for GradeUp (5% vs 25%)      -->     Add FP to Balance
                        Check Active Quests (ID + Grade)  -->     Set Quest.isCompleted = True
                        Check for Item Drops (Graft Tape) -->     Reset Slot {Crop: Null}
  |
Drag to Lab      -->    Is Device Unlocked (KP check)?    -->     Set Device.isActive = True
                        Consume KP                        -->     Start Decrypt/Analysis Timer
```

### Detailed Mechanism Breakdown

#### 1. Discovery & Decryption
*   **Unknown Seeds**: Higher-tier seeds (Level 5+) arrive as "Unknown" cards.
*   **Lab: Research Machine**: Consumes KP to decode cards into playable seeds.

#### 2. The Selection Mechanism (Evolution)
*   **Mystery Slots**: 1 dedicated slot per terrain (4 total).
*   **Grade-Up Logic**: 
    - Standard Slot: 5% evolution chance.
    - Mystery Slot: 25% evolution chance.
*   **Inheritance**: Harvesting a Grade 1 crop drops a Grade 1 seed (or provides a Grade 1 sample for cloning).

#### 3. Hybridization & Grafting (Level 9+)
*   **Recipe-Based**: Mixing two different species (e.g., Spirit Rice + Wild Grass) to create a new hybrid.
*   **Grafting**: Using "Grafting Tape" to combine tree-based crops (Rootstock + Scion) for better yield and disease resistance.

#### 4. Scientific Verification (The Bridge)
*   **Fantasy Samples**: Harvested crops can be sent to the **Analysis Chamber**.
*   **Verification**: Once enough data is gathered, the crop is "Verified" in the **Content Dictionary**.
*   **Reward**: Unlocks **Real-World Points (RP)** and scientific facts about the crop's real-world counterpart.

## 🚀 Core Features
- **Dual-Grid Management**: 4x4 Farm grid divided into four terrains: Wetland, Grassland, Forest, and Rocky Ground.
- **Genetic Selection**: Mystery slots that provide a higher probability (25%) for crops to upgrade their "Genetic Grade."
- **Weather System**: Toggle between Sunny and Rainy weather, affecting growth rates differently across terrains.
- **NPC Quests**: Mission system involving characters like the "Sect Elder" and "The Professor" to drive progression.
- **Resource Economy**: Triple-point system:
  - **FP (Fantasy Points)**: Earned from harvests.
  - **KP (Knowledge Points)**: Earned from analysis and quests.
  - **RP (Real-world Points)**: Earned from scientific missions.

## 🛠 Tech Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS 4
- **State Management**: React Hooks (useState, useEffect)

## 📦 Getting Started

### Prerequisites
- Node.js (v20+)
- npm

### Installation
1. Enter the prototype directory:
   ```bash
   cd mirror-earth-prototype
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the App
Start the development server:
```bash
npm run dev
```

### Building for Production
```bash
npm run build
```

## 📂 Project Structure
- `/src/types.ts`: Core data structures for Crops, Slots, and Quests.
- `/src/data.ts`: Initial crop definitions and grid configurations based on the Content Dictionary.
- `/src/App.tsx`: Main game loop, UI layout, and mechanical logic.
- `/src/index.css`: Tailwind configuration and custom UI shaders.

## 📖 Based on Design Documents
This prototype implements specifications from:
- `ContentDictionary_V2.1.md` (Crop stats and grades)
- `EnvironmentMechanics_V2.2.md` (Grid layout and terrain variables)
- `UIUX_Layout_V2.1.md` (Dual-grid interface design)
- `NumericalBalance_V1.0.md` (Growth formulas and upgrade rates)