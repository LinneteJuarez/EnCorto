import { useState } from 'react'
import { GamesMenu } from './components/GamesMenu.jsx'
import { PaintGame } from './components/PaintGame.jsx'
import { RiddlesGame } from './components/RiddlesGame.jsx'
import { WordleGame } from './components/WordleGame.jsx'

export default function App() {
  const [pantalla, setPantalla] = useState('menu')

  return (
    <div className="ec-juegos">
      {pantalla === 'menu' && <GamesMenu onPick={setPantalla} />}
      {pantalla === 'wordle' && <WordleGame onBack={() => setPantalla('menu')} />}
      {pantalla === 'riddles' && <RiddlesGame onBack={() => setPantalla('menu')} />}
      {pantalla === 'paint' && <PaintGame onBack={() => setPantalla('menu')} />}
    </div>
  )
}
