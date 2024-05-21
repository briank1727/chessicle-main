export interface Piece {
    type: string,
    isWhite: boolean,
    x: number,
    y: number
}

export interface Position {
    x: number,
    y: number
}

export const tryMove = (pieces: Piece[], numberOfMoves: number, initialPosition: Position, endPosition: Position): string => {
    if (!initialPosition || !endPosition) return "";

    const pieceToMove = pieceAt(pieces, initialPosition);
    if (!pieceToMove) return "";

    const legalMoves = calculateLegalMoves(pieces, pieceToMove);
    if (legalMoves.length === 0) return "";

    for (const move of legalMoves) {
        if (move.x === endPosition.x && move.y === endPosition.y) {
            const pieceBeingTaken = pieceAt(pieces, endPosition);

            if (pieceBeingTaken && pieceBeingTaken.type === "k") return "checkmate";
            if ((pieceToMove.isWhite && numberOfMoves === 1) || !areThereAnyWhitePieces(pieces, endPosition))
                return "game over";
            if (pieceToMove.type === "p") {
                if (pieceToMove.isWhite && endPosition.y === 0)
                    return "promotion";
                else if (!pieceToMove.isWhite && endPosition.y === 7)
                    return "promotion";
            }
            if (!doesWhiteHaveAnyMoves(pieces, endPosition)) return "game over";
            if (pieceBeingTaken) {
                return "capture";
            } else return "move";
        }
    }

    return "";
}

export const translateFenCode = (fenCode: string) => {
    const pieces: Piece[] = [];

    let x = 0;
    let y = 0;

    for (let i = 0; i < fenCode.length; i++) {
        if (isCharNumber(fenCode[i]))
            x += parseInt(fenCode[i]);
        else if (fenCode[i] === '/') {
            x = 0;
            y++;
        }
        else {
            pieces.push({
                type: fenCode[i].toLowerCase(),
                isWhite: isLowercase(fenCode[i]) ? false : true,
                x: x,
                y: y
            });
            x++;
        }
    }

    return pieces;
}

export const areThereAnyWhitePieces = (pieces: Piece[], endPosition: Position): boolean => {
    let b = false;
    pieces.forEach(p => { if (p.isWhite && !(p.x === endPosition.x && p.y === endPosition.y)) b = true; });
    return b;
}

export const blacksTurn = (pieces: Piece[]): { from: Position, to: Position } | null => {
    for (let y = 0; y < 8; y++)
        for (let x = 0; x < 8; x++) {
            const piece = pieceAt(pieces, { x: x, y: y });

            if (piece && !piece.isWhite) {
                const legalMoves = sortPositions(calculateLegalMoves(pieces, piece));

                for (const move of legalMoves) {
                    const pieceToTake = pieceAt(pieces, move);

                    if (pieceToTake)
                        return { from: { x: x, y: y }, to: move };
                }
            }
        }

    return null;
}

const sortPositions = (positions: Position[]): Position[] => {
    if (!positions) return [];

    const returnPositions = [];

    for (const position of positions) {
        let hasBeenInserted = false;

        for (let i = 0; i < returnPositions.length; i++) {
            if (position.y < returnPositions[i].y) {
                returnPositions.splice(i, 0, position);
                hasBeenInserted = true;
                break;
            } else if (position.y === returnPositions[i].y)
                if (position.x < returnPositions[i].x) {
                    returnPositions.splice(i, 0, position);
                    hasBeenInserted = true;
                    break;
                }
        }

        if (!hasBeenInserted) returnPositions.push(position);
    }

    return returnPositions;
}

const isCharNumber = (c: string) => {
    return c >= "0" && c <= "9";
}

const isLowercase = (str: string) => {
    return str === str.toLowerCase() && str !== str.toUpperCase();
}

const pieceAt = (pieces: Piece[], position: Position): Piece | undefined => {
    return pieces.find((p) => { return p.x === position.x && p.y === position.y });
}

const inBounds = (position: Position): boolean => {
    return position.x >= 0 && position.x < 8 && position.y >= 0 && position.y < 8;
}

const doesWhiteHaveAnyMoves = (pieces: Piece[], endPosition: Position): boolean => {
    for (const piece of pieces)
        if (piece.isWhite && !(piece.x === endPosition.x && piece.y === endPosition.y))
            if (calculateLegalMoves(pieces, piece).length > 0) {
                return true;
            }

    return false;
}

//#region Piece Moves
export const calculateLegalMoves = (pieces: Piece[], piece: Piece): Position[] => {
    let possibleMoves: Position[] = [];
    const initialPosition = { x: piece.x, y: piece.y };

    switch (piece.type) {
        case "p":
            possibleMoves = legalPawnMoves(pieces, initialPosition);
            break;
        case "n":
            possibleMoves = legalKnightMoves(pieces, initialPosition);
            break;
        case "b":
            possibleMoves = legalBishopMoves(pieces, initialPosition);
            break;
        case "r":
            possibleMoves = legalRookMoves(pieces, initialPosition);
            break;
        case "q":
            possibleMoves = legalBishopMoves(pieces, initialPosition);
            let moreLegalMoves = legalRookMoves(pieces, initialPosition);
            for (const move of moreLegalMoves) possibleMoves.push(move);
            break;
        case "k":
            possibleMoves = legalKingMoves(pieces, initialPosition);
            break;
        default:
            console.error(`The piece of type ${piece.type} is not valid`);
            break;
    }

    return possibleMoves;
}

const legalPawnMoves = (pieces: Piece[], position: Position): Position[] => {
    const pawn = pieceAt(pieces, position);
    if (!pawn) return [];

    let possibleMoves = [];
    let multiplier = pawn.isWhite ? -1 : 1;

    let topLeftPosition = { x: position.x - 1, y: position.y + multiplier };
    let topRightPosition = { x: position.x + 1, y: position.y + multiplier };
    let topPosition = { x: position.x, y: position.y + multiplier };

    if (inBounds(topLeftPosition)) {
        const topLeft = pieceAt(pieces, topLeftPosition);
        if (topLeft)
            if (topLeft.isWhite !== pawn.isWhite)
                possibleMoves.push(topLeftPosition);
    }

    if (inBounds(topRightPosition)) {
        const topRight = pieceAt(pieces, topRightPosition);
        if (topRight)
            if (topRight.isWhite !== pawn.isWhite)
                possibleMoves.push(topRightPosition);
    }

    if (inBounds(topPosition))
        if (!pieceAt(pieces, topPosition)) possibleMoves.push(topPosition);

    return possibleMoves;
}

const legalKnightMoves = (pieces: Piece[], position: Position): Position[] => {
    const knight = pieceAt(pieces, position);
    if (!knight) return [];

    let possibleMoves = [];
    let currentOffset = { x: 2, y: 1 };

    for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
            for (let k = 0; k < 2; k++) {
                let currentPosition = {
                    x: position.x + currentOffset.x,
                    y: position.y + currentOffset.y,
                };

                if (inBounds(currentPosition)) {
                    let currentPiece = pieceAt(pieces, currentPosition);

                    if (!currentPiece) possibleMoves.push(currentPosition);
                    else if (
                        currentPiece.isWhite !== knight.isWhite &&
                        currentPiece.type !== "x"
                    )
                        possibleMoves.push(currentPosition);
                }

                currentOffset = { x: currentOffset.y, y: currentOffset.x };
            }
            currentOffset.y *= -1;
        }
        currentOffset.x *= -1;
    }

    return possibleMoves;
}

const legalBishopMoves = (pieces: Piece[], position: Position): Position[] => {
    const bishop = pieceAt(pieces, position);
    if (!bishop) return [];

    let possibleMoves = [];

    let currentOffset = { x: 1, y: 1 };

    for (let i = 0; i < 4; i++) {
        currentOffset = { x: currentOffset.y, y: currentOffset.x * -1 };
        let currentPosition = {
            x: position.x + currentOffset.x,
            y: position.y + currentOffset.y,
        };

        while (inBounds(currentPosition)) {
            const currentPiece = pieceAt(pieces, currentPosition);
            if (!currentPiece)
                possibleMoves.push({ x: currentPosition.x, y: currentPosition.y });
            else if (
                currentPiece.isWhite !== bishop.isWhite &&
                currentPiece.type !== "x"
            ) {
                possibleMoves.push({ x: currentPosition.x, y: currentPosition.y });
                break;
            } else break;

            currentPosition = {
                x: currentPosition.x + currentOffset.x,
                y: currentPosition.y + currentOffset.y,
            };
        }
    }

    return possibleMoves;
}

const legalRookMoves = (pieces: Piece[], position: Position): Position[] => {
    const rook = pieceAt(pieces, position);
    if (!rook) return [];

    let possibleMoves = [];
    let currentOffset = { x: 1, y: 0 };

    for (let i = 0; i < 4; i++) {
        currentOffset = { x: currentOffset.y, y: currentOffset.x * -1 };
        let currentPosition = {
            x: position.x + currentOffset.x,
            y: position.y + currentOffset.y,
        };

        while (inBounds(currentPosition)) {
            const currentPiece = pieceAt(pieces, currentPosition);

            if (!currentPiece)
                possibleMoves.push({ x: currentPosition.x, y: currentPosition.y });
            else if (currentPiece.isWhite !== rook.isWhite && currentPiece.type !== "x") {
                possibleMoves.push({ x: currentPosition.x, y: currentPosition.y });
                break;
            } else break;

            currentPosition = {
                x: currentPosition.x + currentOffset.x,
                y: currentPosition.y + currentOffset.y,
            };
        }
    }

    return possibleMoves;
}

const legalKingMoves = (pieces: Piece[], position: Position): Position[] => {
    const king = pieceAt(pieces, position);
    if (!king) return [];

    let possibleMoves = [];
    let currentOffset = { x: 1, y: 0 };

    for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 4; j++) {
            currentOffset = { x: currentOffset.y, y: currentOffset.x * -1 };
            let currentPosition = {
                x: position.x + currentOffset.x,
                y: position.y + currentOffset.y,
            };
            if (inBounds(currentPosition)) {
                const currentPiece = pieceAt(pieces, currentPosition);
                if (!currentPiece) possibleMoves.push(currentPosition);
                else if (currentPiece.isWhite !== king.isWhite && currentPiece.type !== "x")
                    possibleMoves.push(currentPosition);
            }
        }
        currentOffset.y = 1;
    }

    return possibleMoves;
}
//#endregion