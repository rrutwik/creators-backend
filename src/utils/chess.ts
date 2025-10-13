export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
export type PieceColor = 'white' | 'black';
export type BoardOrientation = 'white' | 'black' | 'auto';
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades' | 'joker';

export interface Piece {
  type: PieceType;
  color: PieceColor;
  id: string;
}

export interface Position {
  row: string;
  col: string;
}

export interface PlayingCard {
  suit: Suit;
  value: string;
  color: 'red' | 'black';
}

export interface GameState {
  board: (Piece | null)[][];
  deck: PlayingCard[];
  discardPile: PlayingCard[];
  currentCard: PlayingCard | null;
  currentPlayer: PieceColor;
  selectedPiece: Position | null;
  validMoves: Position[];
  gameOver: boolean;
  winner: PieceColor | null;
  moveHistory: string[];
}
