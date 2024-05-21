import axios from "axios";
import { useState, useEffect, useRef, ReactElement } from "react";
import * as Board from "../utility/Board";
import { playSound } from "../utility/Sounds";
import { sinInversePercentage } from "../utility/Utility";
import { hasSelectionSupport } from "@testing-library/user-event/dist/utils";

export default function Home() {

  //#region constants
  const animationTime = 200;
  const fps = 144;
  const fadeInTime = 25;
  interface PuzzleFormat {
    id: number;
    fenCode: string;
    date: string;
    numberOfMoves: number;
    createdAt: string;
    updatedAt: string;
  }
  //#endregion

  //#region useRef
  const chessBoardRef = useRef<HTMLDivElement>(null);
  const gameOverScreenRef = useRef<HTMLDivElement>(null);
  const puzzleCompletedScreenRef = useRef<HTMLDivElement>(null);
  const noPuzzleTodayScreenRef = useRef<HTMLDivElement>(null);
  //#endregion

  //#region useState
  const [puzzlesNumberOfMoves, setPuzzlesNumberOfMoves] = useState(0);
  const [numberOfMoves, setNumberOfMoves] = useState(0);
  const [activePiece, setActivePiece] = useState<HTMLElement | null>(null);
  const [pieces, setPieces] = useState<Board.Piece[]>([]);
  const [initialX, setInitialX] = useState(-1);
  const [initialY, setInitialY] = useState(-1);
  const [interactable, setInteractable] = useState(true);
  const [promotionScreen, setPromotionScreen] = useState(false);
  const [gameOverScreen, setGameOverScreen] = useState(false);
  const [noPuzzleTodayScreen, setNoPuzzleTodayScreen] = useState(false);
  const [puzzleCompletedScreen, setPuzzleCompletedScreen] = useState(false);
  const [pawnToPromote, setPawnToPromote] = useState<Board.Piece | undefined>(undefined);
  const [todaysPuzzle, setTodaysPuzzle] = useState<PuzzleFormat | undefined>(undefined);
  //#endregion

  //#region useEffect
  useEffect(() => {
    const date = new Date();
    let dateString = date.getFullYear().toString() + "-";
    if (date.getMonth() + 1 < 10) dateString += "0";
    dateString += (date.getMonth() + 1).toString() + "-";
    if (date.getDate() < 10) dateString += "0";
    dateString += date.getDate();
    axios.get(`https://api.chessicle.net/todaysPuzzle/${dateString}`).then((response) => {
      if (response.data[0]) {
        if (canPlay(response.data[0] as PuzzleFormat)) {
          setPuzzlesNumberOfMoves(response.data[0].numberOfMoves);
          setTodaysPuzzle(response.data[0] as PuzzleFormat);
        }
        else {
          console.log("can't play");
          setInteractable(false);
          setPuzzleCompletedScreen(true);
          setNoPuzzleTodayScreen(false);
        }
      } else {
        setNoPuzzleTodayScreen(true);
      }
    });
  }, []);
  useEffect(() => setUpBoard(), [todaysPuzzle]);
  useEffect(() => setNumberOfMoves(puzzlesNumberOfMoves), [puzzlesNumberOfMoves]);
  useEffect(() => executeBlacksTurn(), [pieces]);
  useEffect(() => fadeInScreen("game over"), [gameOverScreen]);
  useEffect(() => fadeInScreen("puzzle completed"), [puzzleCompletedScreen]);
  useEffect(() => fadeInScreen("no puzzle today"), [noPuzzleTodayScreen]);
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

      board.push(<div className={`square ${color} .no-drag`} key={`${x} ${y}`}>
        {image && <div className={`chess-piece ${type}`} style={{ backgroundImage: `url(${image})` }}></div>}
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
    switch (moveState) {
      case "checkmate":
        playSound("checkmate");
        setInteractable(false);
        setPuzzleCompletedScreen(true);
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
    if (!todaysPuzzle?.fenCode) return;
    setPieces(Board.translateFenCode(todaysPuzzle?.fenCode));
    setNumberOfMoves(puzzlesNumberOfMoves);
    setActivePiece(null);
    setInitialX(-1);
    setInitialY(-1);
    setInteractable(true);
    setPromotionScreen(false);
    setGameOverScreen(false);
    setPuzzleCompletedScreen(false);
    setNoPuzzleTodayScreen(false);
    setPawnToPromote(undefined);
  }

  const fadeInScreen = (name: string) => {
    let screen: HTMLDivElement | null = null;
    console.log(name);
    switch (name) {
      case "game over":
        screen = gameOverScreenRef.current;
        break;
      case "puzzle completed":
        screen = puzzleCompletedScreenRef.current;
        console.log(puzzleCompletedScreen);
        saveCompletedPuzzle();
        break;
      case "no puzzle today":
        screen = noPuzzleTodayScreenRef.current;
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

  //#region Local Storage
  const canPlay = (puzzle: PuzzleFormat): boolean => {
    // if (loggedIn) {

    // } else {
    if (!puzzle) return false;
    const localDataString = localStorage.getItem("localData");
    if (localDataString) {
      const localData = JSON.parse(localDataString);
      let works = true;
      localData.puzzles.forEach((p: { id: number; completed: boolean }) => {
        console.log(p.id + " " + puzzle.id);
        if (p.id === puzzle.id && p.completed)
          works = false;
      });
      return works;
    }
    else {
      localStorage.setItem("localData", JSON.stringify({
        puzzles: []
      }));
      return true;
    }
    // }
  }

  const saveCompletedPuzzle = () => {
    // if (loggedIn) {

    // } else {
    if (!todaysPuzzle) return;
    const localDataString = localStorage.getItem("localData");
    if (localDataString) {
      const localData = JSON.parse(localDataString);
      let hasPuzzle = false;
      localData.puzzles.forEach((p: { id: number; completed: boolean; }) => {
        if (p.id === todaysPuzzle.id) hasPuzzle = true;
      });
      if (!hasPuzzle) {
        localData.puzzles.push({ id: todaysPuzzle.id, completed: true });
        localStorage.setItem("localData", JSON.stringify(localData));
      }
    }
    else {
      localStorage.setItem("localData", JSON.stringify({
        puzzles: [
          {
            id: todaysPuzzle.id,
            completed: true,
          }
        ]
      }));
    }
    // }
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
              <div className="small-text" style={{ padding: "10px" }}>Come back tomorrow for a new puzzle!</div>
            </div>
          </div>
        }
        {noPuzzleTodayScreen &&
          <div className="faded-background" ref={noPuzzleTodayScreenRef}>
            <div id="no-puzzle-today-screen" className="board-screen">
              <div id="no-puzzle-today-text" className="big-text">Sorry, No puzzle today. :(</div>
            </div>
          </div>
        }
      </div >
      {(todaysPuzzle && !puzzleCompletedScreen) &&
        <div id="info-panel">
          <p id="number-of-moves" className="big-text">Number of Moves: {numberOfMoves}</p>
          < button
            id="restart-button"
            className="big-text"
            onClick={() => { if (interactable) setUpBoard() }}
            style={{ color: "black" }}
          >
            Restart
          </button>
        </div>
      }
    </div >
  );
}