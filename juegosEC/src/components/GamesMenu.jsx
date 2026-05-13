export function GamesMenu({ onPick }) {
  return (
    <div>
      <header className="ec-topbar">
        <span style={{ width: 72 }} />
        <h1>Juegos EC</h1>
        <span style={{ width: 72 }} />
      </header>
      <div id="games-menu">
        <div className="games-grid">
          <button type="button" className="game-card" onClick={() => onPick('wordle')}>
            <div className="gc-top">
              <div className="gc-letters" aria-hidden="true">
                <span className="gl gl-hit">P</span>
                <span className="gl gl-mis">A</span>
                <span className="gl gl-hit">L</span>
                <span className="gl gl-near">A</span>
                <span className="gl gl-hit">S</span>
              </div>
            </div>
            <div className="gc-info">
              <p className="gc-num">01</p>
              <h2 className="gc-name">La Palabra</h2>
              <p className="gc-desc">
                Adivina la palabra del día en 6 intentos (español, sin tildes en el teclado).
              </p>
              <span className="gc-play">Jugar →</span>
            </div>
          </button>

          <button type="button" className="game-card" onClick={() => onPick('riddles')}>
            <div className="gc-top">
              <div className="gc-letters" aria-hidden="true">
                <span className="gl gl-near">?</span>
                <span className="gl gl-hit">¿</span>
                <span className="gl gl-mis">!</span>
                <span className="gl gl-hit">¡</span>
                <span className="gl gl-near">?</span>
              </div>
            </div>
            <div className="gc-info">
              <p className="gc-num">02</p>
              <h2 className="gc-name">Adivinanzas</h2>
              <p className="gc-desc">Clásicos en español con varias opciones. Suma aciertos.</p>
              <span className="gc-play">Jugar →</span>
            </div>
          </button>

          <button type="button" className="game-card" onClick={() => onPick('paint')}>
            <div className="gc-top">
              <div className="gc-letters" aria-hidden="true">
                <span className="gl gl-hit">P</span>
                <span className="gl gl-near">I</span>
                <span className="gl gl-mis">N</span>
                <span className="gl gl-near">T</span>
                <span className="gl gl-hit">A</span>
              </div>
            </div>
            <div className="gc-info">
              <p className="gc-num">03</p>
              <h2 className="gc-name">Pintar</h2>
              <p className="gc-desc">Lienzo libre con un tema aleatorio para inspirarte.</p>
              <span className="gc-play">Jugar →</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
