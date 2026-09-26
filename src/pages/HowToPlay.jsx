import PageMeta from "../components/PageMeta";
import { POWERS } from "../game/rogueLogic";
import "./HowToPlay.css";

export default function HowToPlay() {
  return (
    <main className="how-to-play">
      <PageMeta
        title="How to Play Voltorb Flip | Rules, Classic, Free Play & Rogue"
        description="Learn the rules of Voltorb Flip from Pokémon HeartGold and SoulSilver: how the row and column counters work, how levels go up and down, and every Rogue mode power."
        path="/how-to-play"
      />

      <header className="page-intro">
        <h2 className="page-title">How to play</h2>
        <p className="page-lede">
          Voltorb Flip is the Game Corner card game from Pokémon HeartGold and SoulSilver. Flip tiles to multiply
          your score, and use the numbers around the board to avoid the Voltorbs.
        </p>
      </header>

      <div className="prose">
        <h3>The board</h3>
        <p>
          Every board is a <strong>5x5 grid</strong> of hidden tiles. Each tile hides either a{" "}
          <strong>Voltorb</strong> or a <strong>multiplier</strong> (1, 2, or 3). Flip a multiplier tile and your
          level score is multiplied by that value! Flip a Voltorb and you lose whatever score you'd built up for the
          level.
        </p>
        <p>
          The counters at the end of each row and column show the total of that line's multipliers (top) and how many
          Voltorbs it hides (bottom). Clear the board by flipping every <strong>2 and 3</strong> without hitting a
          Voltorb.
        </p>
        <p>
          Right-click a tile, or long-press it on a phone, to mark it with a note. On touch screens you can also turn
          on <strong>Note Mode</strong> below the board so that every tap notes instead of flips.
        </p>

        <h3>Classic</h3>
        <p>
          Taken straight from HeartGold and SoulSilver's Game Corner: you start at Level 1 and move up a level each
          time you clear the board. Higher levels have more Voltorbs and fewer multipliers.
        </p>
        <p>
          Flipping a Voltorb doesn't end your run! You lose that level's score, and if you flipped at least as many
          tiles as your level number, you stay on the same level and try again. If you flipped fewer, you drop back
          to the level matching the number of tiles you flipped. Clear five boards in a row, flipping at least 8
          tiles on each, and you jump straight to Level 8!
        </p>
        <p>
          Every board you clear adds its score to your total. Starting a <strong>New run</strong> takes you back to
          Level 1, and if you're logged in, your total is added to your wallet as Coins.
        </p>

        <h3>Free Play</h3>
        <p>
          Pick any of the 8 levels and play at your own pace, with <strong>Reset</strong> and{" "}
          <strong>Reveal</strong> whenever you want them. Free Play is for practice, so it doesn't earn Coins.
        </p>

        <h3>Rogue</h3>
        <p>
          Rogue is my own experimental mode. Each level you beat, you choose between a power-up and bonus score. Go
          as far as you can: one Voltorb without protection ends the run.
        </p>

        <dl className="power-list">
          {Object.entries(POWERS).map(([name, power]) => (
            <div key={name} className="power-list__item">
              <img src={power.icon} alt="" className="power-list__icon" />
              <dt className="power-list__name">{name}</dt>
              <dd className="power-list__desc">{power.desc}</dd>
            </div>
          ))}
        </dl>

        <h3>Coins and the Shop</h3>
        <p>
          If you're <strong>logged in</strong>, your score is turned into Coins: in Classic when you start a New
          run, and in Rogue when your run ends (when you lose, start a New run, or leave the page). Spend them in
          the <strong>Shop</strong> on themes, which change the tile artwork and the site's colours once equipped.
          Everything else works the same when you're logged out; you just won't earn or spend Coins.
        </p>
      </div>
    </main>
  );
}
