import "./HowToPlay.css";

export default function HowToPlay() {
  return (
    <main className="static-page how-to-play">
      <h2 className="static-page-title how-to-play-title">How to Play</h2>

      {/* Controls Block */}
      <div className="how-to-play-section">
        <h3 className="how-to-play-section__title">Voltorb Flip</h3>
        <div className="how-to-play-section__body">
          <p>
            Every board is a <strong>5x5 grid</strong> of hidden tiles. Each tile hides either a{" "}
            <strong>Voltorb</strong> or a <strong>multiplier</strong> (1, 2, or 3). Flip a multiplier
            tile and your level score is multiplied by that value! Flip a Voltorb and the run ends,
            with whatever score you'd built up for the level lost.
          </p>

          <p>
            Clear the board by flipping every non-1 multiplier tile <strong>(2s or 3s)</strong> without hitting a Voltorb!
          </p>
        </div>
      </div>

      {/* Classic Mode Block */}
      <div className="how-to-play-section">
        <h3 className="how-to-play-section__title">Classic Mode</h3>
        <div className="how-to-play-section__body">
          <p>
            In <strong>Classic mode</strong>, taken straight from HeartGold and SoulSilver's Game Corner, you start at Level 1 and
            progress to the next level by clearing the board. Each level becomes more difficult as more Voltorbs and less
            multipliers make up the board.
          </p>

          <p>
            Flip a Voltorb doesn't instantly end the game! If you have flipped enough tiles that round, you stay on the same level and
            get to try again. However, if you haven't flipped enough tiles, you are reverted back to a previous level based on how many
            tiles you flipped. 
          </p>

          <p>
            Only starting a <strong>New Game</strong> will erase the Coins you have built up, but if you have logged in, they are added
            to your wallet and can be spent in the Shop to unlock themes for the website!
          </p>
        </div>
      </div>

      {/* Free Play Mode Block */}
      <div className="how-to-play-section">
        <h3 className="how-to-play-section__title">Free Play Mode</h3>
        <div className="how-to-play-section__body">
          <p>
            In <strong>Free Play mode</strong>, you can select any level you like and get to play freely! You can choose from the 8 difficulty
            levels available, and you get to Reset or Reveal the board at will. 
          </p>

          <p>
            Unfortunately, you <strong>cannot earn Coins</strong> in Free Play mode!
          </p>
        </div>
      </div>

      {/* Rogue Mode Block */}
      <div className="how-to-play-section">
        <h3 className="how-to-play-section__title">Rogue Mode</h3>
        <div className="how-to-play-section__body">
          <p>
            <strong>Rogue mode</strong> is an experimental game mode of mine where you earn power-ups for beating every level! Your aim is to go as far
            as you can, using the power-ups to either earn more points or to aid you beating the board. Below are the available power-ups!
          </p>

          <ul className="how-to-play-list">
            <li className="how-to-play-list-item">
              <strong>Protect</strong>
              <span>Survive a Voltorb instead of losing.</span>
            </li>
            <li className="how-to-play-list-item">
              <strong>Corner Count</strong>
              <span>Reveals a bonus stat counter for the board's main diagonal.</span>
            </li>
            <li className="how-to-play-list-item">
              <strong>Money Multiplier</strong>
              <span>Doubles the bonus score offered whenever you level up.</span>
            </li>
            <li className="how-to-play-list-item">
              <strong>Reveal 3</strong>
              <span>Auto-flips a 3 tile (or a 2, if no 3 exists) at the start of each level.</span>
            </li>
            <li className="how-to-play-list-item">
              <strong>Peek</strong>
              <span>
                Peek at a tile's value without flipping it.
              </span>
            </li>
            <li className="how-to-play-list-item">
              <strong>No Ones</strong>
              <span>
                Flipping a 1 costs you 10% of your total score, but your banked score doubles every
                level.
              </span>
            </li>
            <li className="how-to-play-list-item">
              <strong>Mega Stone</strong>
              <span>Your total score quadruples if the very first tile you flip for the level is a Voltorb.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Coins & Shop Block */}
      <div className="how-to-play-section">
        <h3 className="how-to-play-section__title">Coins &amp; the Shop</h3>
        <div className="how-to-play-section__body">
          <p>
            If you're <strong>logged in</strong>, your total score is converted into Coins whenever
            a run ends (in Classic when you start a new run, and in Rogue when you lose or
            reset). Head to the <strong>Shop</strong> to spend those Coins on new themes, which
            change your tile artwork and the site's colour scheme once equipped. Playing while logged out
            still works exactly the same, you just won't earn or spend any coins.
          </p>
        </div>
      </div>
    </main>
  );
}