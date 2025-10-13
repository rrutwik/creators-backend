import { ObjectId } from "mongoose";

export interface ChessGame {
  _id?: string;
  game_id: string;
  player_white: string | ObjectId;
  player_black: string | ObjectId;
  game_state: {
    fen: string;
    pgn?: string;
    turn: 'white' | 'black';
    status: 'waiting_for_opponent' | 'active' | 'completed' | 'abandoned';
    winner?: 'white' | 'black' | 'draw';
    moves?: string[];
    current_card?: string;
    check_attempts?: number;
    cards_deck?: {
      suit: string;
      value: string;
      color: string;
    }[];
  };
  created_at?: Date;
  updated_at?: Date;
  completed_at?: Date;
}

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
