import { useState, useEffect, useRef, ReactElement } from "react";
import * as Board from "../utility/Board";
import { playSound } from "../utility/Sounds";
import { sinInversePercentage } from "../utility/Utility";
import { Link } from "react-router-dom";

export default function Tutorial() {

  //#region constants
  const animationTime = 200;
  const fps = 144;
  const fadeInTime = 25;

  const tutorialPuzzles = [
    {
      fenCode: "7k/8/8/8/8/8/8/R7",
      numberOfMoves: 2,
      description: "Welcome to Chessicle!\n\nYour objective is to capture the black king, unlike traditional chess.\n\nThe black king can move one square horizontally, vertically, or diagonally.\n\nThe rook can move in a straight line."
    },
    {
      fenCode: "7k/8/8/8/8/8/8/N7",
      numberOfMoves: 6,
      description: "The knight can jump in an L shape\n\nIt can also jump over pieces."
    },
    {
      fenCode: "7k/8/8/8/8/B7/8/8",
      numberOfMoves: 2,
      description: "The bishop is a rook but it moves diagonally."
    },
    {
      fenCode: "7k/8/8/8/8/8/8/1Q6",
      numberOfMoves: 2,
      description: "The queen has the moveset of both a rook and a bishop, which makes it the most powerful piece."
    },
    {
      fenCode: "8/5k2/4r3/8/3P4/1B6/8/8",
      numberOfMoves: 3,
      description: "The pawn can only move up the board in two ways.\n\nIt can only move to the top left or the top right when it is capturing a piece.\n\nIt may only go up when there is not a piece obstructing it."
    },
    {
      fenCode: "4r1k1/8/8/3P4/8/8/8/8",
      numberOfMoves: 4,
      description: "If a pawn makes it to the end of the board, it can promote to a bishop, knight, rook, or queen!"
    },
    {
      fenCode: "8/8/7B/R7/6pk/8/8/8",
      numberOfMoves: 2,
      description: "You will often need to attract the king to capture him in the moves given."
    },
    {
      fenCode: "8/8/8/8/8/8/R3B1pk/8",
      numberOfMoves: 2,
      description: "Black's pawns will always make a queen."
    },
    {
      fenCode: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQ1BNR",
      numberOfMoves: 5,
      description: "This is the starting chess position in a real chess game (minus the white king).\n\nIf you are stuck, look up the \"Scholar\'s Mate\"."
    },
    {
      fenCode: "4Rp2/4n3/1n6/8/3P2n1/3n4/8/4k3",
      numberOfMoves: 2,
      description: "The priority for which piece takes the piece you moved checks each row from left to right and it start with the top row."
    },
    {
      fenCode: "6R1/8/7p/6n1/8/2P1P3/P7/6k1",
      numberOfMoves: 2,
      description: "Black will keep make moves until there are no more possible captures."
    }
  ]
  //#endregion

  //#region useRef
  const chessBoardRef = useRef<HTMLDivElement>(null);
  const gameOverScreenRef = useRef<HTMLDivElement>(null);
  const puzzleCompletedScreenRef = useRef<HTMLDivElement>(null);
  const tutorialCompletedScreenRef = useRef<HTMLDivElement>(null);
  //#endregion

  //#region useState
  const [tutorialIndex, setTutorialIndex] = useState(0);
  const [description, setDescription] = useState("");
  const [fenCode, setFenCode] = useState("");
  const [puzzlesNumberOfMoves, setPuzzlesNumberOfMoves] = useState(0);
  const [numberOfMoves, setNumberOfMoves] = useState(0);
  const [activePiece, setActivePiece] = useState<HTMLElement | null>(null);
  const [pieces, setPieces] = useState<Board.Piece[]>([]);
  const [initialX, setInitialX] = useState(-1);
  const [initialY, setInitialY] = useState(-1);
  const [interactable, setInteractable] = useState(true);
  const [promotionScreen, setPromotionScreen] = useState(false);
  const [gameOverScreen, setGameOverScreen] = useState(false);
  const [puzzleCompletedScreen, setPuzzleCompletedScreen] = useState(false);
  const [tutorialCompletedScreen, setTutorialCompletedScreen] = useState(false);
  const [pawnToPromote, setPawnToPromote] = useState<Board.Piece | undefined>(undefined);
  const [dots, setDots] = useState<Board.Position[]>([]);
  //#endregion

  //#region useEffect
  useEffect(() => setTutorialIndex(0), []);
  useEffect(() => {
    setDescription(tutorialPuzzles[tutorialIndex].description);
    setFenCode(tutorialPuzzles[tutorialIndex].fenCode);
    setPuzzlesNumberOfMoves(tutorialPuzzles[tutorialIndex].numberOfMoves);
  }, [tutorialIndex]);
  useEffect(() => setUpBoard(), [fenCode]);
  useEffect(() => setNumberOfMoves(puzzlesNumberOfMoves), [puzzlesNumberOfMoves]);
  useEffect(() => executeBlacksTurn(), [pieces]);
  useEffect(() => fadeInScreen("game over"), [gameOverScreen]);
  useEffect(() => fadeInScreen("puzzle completed"), [puzzleCompletedScreen]);
  useEffect(() => fadeInScreen("tutorial completed"), [tutorialCompletedScreen]);
  //#endregion

  const board: ReactElement[] = [];
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 8; x++) {
      let color = (x + y) % 2 === 0 ? "light-square" : "dark-square";
      if (x === initialX && y === initialY) color = "highlight-square";
      let image = undefined;
      let type = undefined;
      pieces.map(p => {
        if (p.x === x && p.y === y) {
          image = `assets/images/${p.isWhite ? "w" : "b"}${p.type}.png`;
          type = `${p.isWhite ? "white" : "black"}-piece`;
        }
        return p;
      });
      let dotSquare = false;
      dots.forEach(dot => { if (dot.x === x && dot.y === y) dotSquare = true; });

      board.push(<div className={`square ${color}`} key={`${x} ${y}`}>
        {image && <div className={`chess-piece ${type}`} style={{ backgroundImage: `url(${image})` }} onDragStart={(e) => { e.preventDefault() }}></div>}
        {image && dotSquare && <div className="circle"></div>}
        {!image && dotSquare && <div className="dot"></div>}
      </div >);
    }

  //#region Mouse Logic
  const grabPiece = (e: React.MouseEvent) => {
    if (!interactable) return;
    if (chessBoardRef.current) {
      const iX = Math.floor((e.clientX - chessBoardRef.current.offsetLeft) / 100);
      const iY = Math.floor((e.clientY - chessBoardRef.current.offsetTop) / 100);
      const piece = chessBoardRef.current.children[iY * 8 + iX].children[0] as HTMLElement;
      if (piece && piece.classList.contains("white-piece")) {
        setInitialX(iX);
        setInitialY(iY);
        piece.style.position = "absolute";
        piece.style.zIndex = "30";
        const x = e.clientX - 50;
        const y = e.clientY - 50;
        piece.style.left = x + "px";
        piece.style.top = y + "px";
        setActivePiece(piece);
        const currentPiece = pieces.find((p) => { if (p.x === iX && p.y === iY) return p; })
        if (currentPiece)
          setDots(Board.calculateLegalMoves(pieces, currentPiece));
        else console.error("The current piece is undefined when grabbing");
      }
    }
  }

  const updateActivePiece = (e: React.MouseEvent) => {
    if (!activePiece || !interactable) return;
    const x = e.clientX - 50;
    const y = e.clientY - 50;
    activePiece.style.left = x + "px";
    activePiece.style.top = y + "px";
  }

  const dropPiece = (e: React.MouseEvent) => {
    setInitialX(-1);
    setInitialY(-1);

    if (!interactable) return;

    if (chessBoardRef.current && activePiece) {
      const x = Math.floor((e.clientX - chessBoardRef.current.offsetLeft) / 100);
      const y = Math.floor((e.clientY - chessBoardRef.current.offsetTop) / 100);

      activePiece.style.position = "static";
      activePiece.style.zIndex = "10";
      setActivePiece(null);
      setDots([]);

      const moveState = Board.tryMove(pieces, numberOfMoves, { x: initialX, y: initialY }, { x: x, y: y });
      processWhitesMove(moveState, { x: initialX, y: initialY }, { x: x, y: y });
    }
  }
  //#endregion

  //#region Piece Logic
  const dragBlackPiece = (startPosition: Board.Position, endPosition: Board.Position) => {
    let step = 0;

    const movingPiece = chessBoardRef.current?.children[startPosition.y * 8 + startPosition.x].children[0] as HTMLElement;
    if (!movingPiece) { console.error("The dragging HTML Element is undefined"); setInteractable(true); return; }

    const takingPiece = chessBoardRef.current?.children[endPosition.y * 8 + endPosition.x].children[0] as HTMLElement;
    if (!movingPiece) { console.error("The piece being taken HTML Element is undefined"); setInteractable(true); return; }

    movingPiece.style.position = "absolute";

    const clientRect = movingPiece.getBoundingClientRect();

    const startingX = clientRect.left;
    const startingY = clientRect.top;
    const endingX = startingX + (endPosition.x - startPosition.x) * 100;
    const endingY = startingY + (endPosition.y - startPosition.y) * 100;

    const intervalID = setInterval(() => {
      if (!chessBoardRef.current) return;

      movingPiece.style.left =
        startingX + (endingX - startingX) * sinInversePercentage(step / ((animationTime / 1000) * fps)) + "px";
      movingPiece.style.top =
        startingY + (endingY - startingY) * sinInversePercentage(step / ((animationTime / 1000) * fps)) + "px";

      takingPiece.style.opacity = ((animationTime / 1000 * fps - step) / (animationTime / 1000 * fps)).toString();

      if (++step > (animationTime / 1000) * fps) {
        window.clearInterval(intervalID);
        takingPiece.style.opacity = "1";
        executeMove(startPosition, endPosition);
      }
    }, 1000 / fps);
  }

  const executeMove = (from: Board.Position, to: Board.Position) => {
    setPieces((value) => {
      const indexToTake = value.findIndex((p) => { return p.x === to.x && p.y === to.y })

      if (indexToTake !== -1)
        value.splice(indexToTake, 1);
      return value.map(p => {
        if (p.x === from.x && p.y === from.y) {
          p.x = to.x;
          p.y = to.y;

          if (p.type === "p" && !p.isWhite && p.y === 7)
            p.type = "q";
        }
        return p;
      });

    });
  }

  const executeBlacksTurn = () => {
    if (promotionScreen || gameOverScreen || puzzleCompletedScreen) return;
    const blacksTurn = Board.blacksTurn(pieces);
    if (blacksTurn) {
      setInteractable(false);
      setTimeout(() => {
        const moveState = Board.tryMove(pieces, numberOfMoves, blacksTurn.from, blacksTurn.to);
        switch (moveState) {
          case "capture":
            playSound("capture");
            dragBlackPiece(blacksTurn.from, blacksTurn.to);
            break;
          case "promotion":
            playSound("promotion");
            dragBlackPiece(blacksTurn.from, blacksTurn.to);
            break;
          case "game over":
            playSound("game over");
            setGameOverScreen(true);
            dragBlackPiece(blacksTurn.from, blacksTurn.to);
            break;
          default:
            console.error(`${moveState} is not a valid move state for blacks turn`);
            break;
        }
      }, animationTime);
    }
    else setInteractable(true);
  }

  const processWhitesMove = (moveState: string, startPosition: Board.Position, endPosition: Board.Position) => {
    let blacksMove: { from: Board.Position, to: Board.Position } | null = null;
    switch (moveState) {
      case "checkmate":
        playSound("checkmate");
        setInteractable(false);
        if (tutorialIndex != tutorialPuzzles.length - 1)
          setPuzzleCompletedScreen(true);
        else
          setTutorialCompletedScreen(true);
        setNumberOfMoves(numberOfMoves - 1);
        executeMove(startPosition, endPosition);
        break;
      case "capture":
        playSound("capture");
        setNumberOfMoves(numberOfMoves - 1);
        executeMove(startPosition, endPosition);
        break;
      case "move":
        playSound("move");
        setNumberOfMoves(numberOfMoves - 1);
        executeMove(startPosition, endPosition);
        break;
      case "promotion":
        setPawnToPromote(pieces.find((p) => { if (p.x === startPosition.x && p.y === startPosition.y) return p; }));
        setPromotionScreen(true);
        setNumberOfMoves(numberOfMoves - 1);
        executeMove(startPosition, endPosition);
        break;
      case "game over":
        playSound("game over");
        setGameOverScreen(true);
        setInteractable(false);
        setNumberOfMoves(numberOfMoves - 1);
        executeMove(startPosition, endPosition);
        break;
      default:
        break;
    }
  }

  const promote = (type: string) => {
    if (!pawnToPromote) { console.error("The pawn to promote is undefined"); return; }
    setPieces((value) => {
      return value.map((p) => {
        if (p.x === pawnToPromote.x && p.y === pawnToPromote.y)
          p.type = type;
        return p;
      });
    });
    setPawnToPromote(undefined);
    setPromotionScreen(false);
    playSound("promotion");
  }
  //#endregion

  //#region UI Logic
  const setUpBoard = () => {
    setPieces(Board.translateFenCode(fenCode));
    setNumberOfMoves(puzzlesNumberOfMoves);
    setActivePiece(null);
    setInitialX(-1);
    setInitialY(-1);
    setInteractable(true);
    setPromotionScreen(false);
    setGameOverScreen(false);
    setPuzzleCompletedScreen(false);
    setTutorialCompletedScreen(false);
    setPawnToPromote(undefined);
  }

  const fadeInScreen = (name: string) => {
    let screen: HTMLDivElement | null = null;
    switch (name) {
      case "game over":
        screen = gameOverScreenRef.current;
        break;
      case "puzzle completed":
        screen = puzzleCompletedScreenRef.current;
        break;
      case "tutorial completed":
        screen = tutorialCompletedScreenRef.current;
        break;
      default:
        console.error(name + " is not a valid screen name");
        break;
    }

    if (screen) {
      screen.style.opacity = "0";

      let opacity = 0;
      const interval = setInterval(() => {
        if (screen) {
          if (opacity < 1) {
            opacity += 0.05;
            screen.style.opacity = opacity.toString();
          } else {
            clearInterval(interval);
            screen.style.opacity = "1";
          }
        }
      }, fadeInTime);
    }
  }
  //#endregion

  return (
    <div id="main-container">
      <div id="board" onMouseDown={e => grabPiece(e)} onMouseMove={e => updateActivePiece(e)} onMouseUp={e => dropPiece(e)} ref={chessBoardRef} > {board}
        {promotionScreen &&
          <div className="faded-background">
            <div id="promotion-screen">
              <button id="knight-promotion-button" className="promotion-button" style={{ backgroundImage: "url(assets/images/wn.png)" }} onClick={() => promote("n")}></button>
              <button id="bishop-promotion-button" className="promotion-button" style={{ backgroundImage: "url(assets/images/wb.png)" }} onClick={() => promote("b")}></button>
              <button id="rook-promotion-button" className="promotion-button" style={{ backgroundImage: "url(assets/images/wr.png)" }} onClick={() => promote("r")}></button>
              <button id="queen-promotion-button" className="promotion-button" style={{ backgroundImage: "url(assets/images/wq.png)" }} onClick={() => promote("q")}></button>
            </div>
          </div>
        }
        {gameOverScreen &&
          <div className="faded-background" ref={gameOverScreenRef}>
            <div id="game-over-screen" className="board-screen">
              <div id="game-over-text" className="big-text">Game Over</div>
              <button id="game-over-restart-button" onClick={() => setUpBoard()}>Restart</button>
            </div>
          </div>
        }
        {puzzleCompletedScreen &&
          <div className="faded-background" ref={puzzleCompletedScreenRef}>
            <div id="puzzle-completed-screen" className="board-screen">
              <p className="big-text">Puzzle Completed!</p>
              <button id="next-puzzle-button" onClick={() => setTutorialIndex(tutorialIndex + 1)}>Next Puzzle</button>
              <button id="restart-button" onClick={() => setUpBoard()}>Restart</button>
            </div>
          </div>
        }
        {tutorialCompletedScreen &&
          <div className="faded-background" ref={tutorialCompletedScreenRef}>
            <div id="tutorial-completed-screen" className="board-screen">
              <p className="big-text">Tutorial Completed!</p>
              <button id="restart-button" onClick={() => setUpBoard()}>Restart</button>
              <Link to="/">
                <button id="home-button">Home</button>
              </Link>
            </div>
          </div>
        }
      </div >
      {(fenCode !== "") &&
        <div id="info-panel">
          <p id="description" className="small-text" style={{ whiteSpace: "pre-wrap", padding: "0px 15px" }}>{description}</p>
          <p id="number-of-moves" className="big-text">Number of Moves: {numberOfMoves}</p>
          <button
            id="restart-button"
            className="big-text"
            onClick={() => { if (interactable) setUpBoard(); }}
            style={{ color: "black" }}
          >
            Restart
          </button>
        </div>
      }
    </div >
  );
}