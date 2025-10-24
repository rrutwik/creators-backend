import Container, { Service } from 'typedi';
import { ChessGame } from '@/interfaces/chessgame.interface';
import { ChessGameModel } from '@/models/chess_games.model';
import { HttpException } from '@/exceptions/HttpException';
import { logger } from '@/utils/logger';
import mongoose from 'mongoose';
import { TextEncoder } from 'util';

@Service()
export class ChessService {

  private async createUniqueGameId(creatorId: string): Promise<string> {
    const data = `${creatorId}-${Date.now()}-${Math.random()}`;
    const bytes = new TextEncoder().encode(data);

    const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", bytes);

    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    return hashHex.slice(0, 12).toUpperCase();
  }

  public async createGame(playerId: string, playerColor: 'white' | 'black'): Promise<ChessGame> {
    try {
      const game = await ChessGameModel.create({
        game_id: await this.createUniqueGameId(playerId),
        player_white: playerColor === 'white' ? playerId : null,
        player_black: playerColor === 'black' ? playerId : null,
        game_state: {
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          turn: 'white',
          status: 'waiting_for_opponent',
          moves: []
        }
      });

      logger.info(`Chess game created: ${game.game_id} by ${playerId} as ${playerColor}`);
      return game.toJSON();
    } catch (error) {
      logger.error('Error creating chess game:', error);
      throw error;
    }
  }

  public async registerOpponent(gameId: string, opponentId: string): Promise<ChessGame> {
    try {
      const game = await ChessGameModel.findOne({ game_id: gameId });
      if (!game) {
        throw new HttpException(404, 'Chess game not found');
      }

      // Check if game is waiting for opponent
      if (game.game_state.status !== 'waiting_for_opponent') {
        throw new HttpException(400, 'Game is not waiting for an opponent');
      }

      // Check if opponent is trying to join their own game
      const creatorId = game.player_white || game.player_black;
      if (creatorId?.toString() === opponentId) {
        throw new HttpException(400, 'Cannot join your own game as opponent');
      }

      // Check if opponent already has an active game with this player
      const existingGame = await ChessGameModel.findOne({
        $or: [
          { player_white: creatorId, player_black: opponentId },
          { player_white: opponentId, player_black: creatorId }
        ],
        'game_state.status': { $in: ['waiting_for_opponent', 'active'] }
      });

      if (existingGame) {
        throw new HttpException(400, 'Active game already exists between these players');
      }

      // Determine opponent color and update game
      const creatorColor = game.player_white ? 'white' : 'black';
      const opponentColor = creatorColor === 'white' ? 'black' : 'white';

      if (opponentColor === 'white') {
        game.player_white = opponentId;
      } else {
        game.player_black = opponentId;
      }

      // Update game state to active
      game.game_state.status = 'active';
      game.markModified('game_state');

      const updatedGame = await game.save();
      logger.info(`Opponent ${opponentId} registered for game ${gameId} as ${opponentColor}`);

      return updatedGame.toJSON();
    } catch (error) {
      logger.error('Error registering opponent:', error);
      throw error;
    }
  }

  public async getGameById(gameId: string): Promise<ChessGame> {
    try {
      const game = await ChessGameModel.findOne({ game_id: gameId });
      if (!game) {
        throw new HttpException(404, 'Chess game not found');
      }
      return game.toJSON();
    } catch (error) {
      logger.error('Error fetching chess game:', error);
      throw error;
    }
  }

  public async getActiveGamesForPlayer(playerId: string): Promise<ChessGame[]> {
    try {
      // add user first name
      const games = await ChessGameModel.find({
        $or: [
          { player_white: playerId },
          { player_black: playerId }
        ],
        'game_state.status': { $in: ['waiting_for_opponent', 'active'] }
      }).populate('player_white', 'first_name last_name').populate('player_black', 'first_name last_name').sort({ updated_at: -1 });

      return games.map(game => game.toJSON());
    } catch (error) {
      logger.error('Error fetching active games for player:', error);
      throw error;
    }
  }

  public async updateGameState(gameId: string, gameState: any, currentPlayerId: string): Promise<ChessGame> {
    try {
      const game = await ChessGameModel.findOne({ game_id: gameId });
      if (!game) {
        throw new HttpException(404, 'Chess game not found');
      }

      if (game.game_state.status !== 'active') {
        throw new HttpException(400, 'Game is not active');
      }

      // Verify the current player is part of this game
      const isPlayerWhite = game.player_white?.toString() === currentPlayerId;
      const isPlayerBlack = game.player_black?.toString() === currentPlayerId;

      if (!isPlayerWhite && !isPlayerBlack) {
        throw new HttpException(403, 'You are not a player in this game');
      }

      // Verify it's the player's turn
      const expectedTurn = game.game_state.turn;
      const playerColor = isPlayerWhite ? 'white' : 'black';

      if (expectedTurn !== playerColor) {
        throw new HttpException(400, `It's not your turn. Current turn: ${expectedTurn}`);
      }

      // Update the game state
      game.game_state = { ...game.game_state, ...gameState };
      game.markModified('game_state');

      const updatedGame = await game.save();
      logger.info(`Game ${gameId} state updated by ${currentPlayerId}`);

      return updatedGame.toJSON();
    } catch (error) {
      logger.error('Error updating chess game state:', error);
      throw error;
    }
  }

  public async endGame(gameId: string, winner: 'white' | 'black' | 'draw', currentPlayerId: string): Promise<ChessGame> {
    try {
      const game = await ChessGameModel.findOne({ game_id: gameId });
      if (!game) {
        throw new HttpException(404, 'Chess game not found');
      }

      // Verify the current player is part of this game
      const isPlayerWhite = game.player_white?.toString() === currentPlayerId;
      const isPlayerBlack = game.player_black?.toString() === currentPlayerId;

      if (!isPlayerWhite && !isPlayerBlack) {
        throw new HttpException(403, 'You are not a player in this game');
      }

      // Update game state to completed
      game.game_state.status = 'completed';
      game.game_state.winner = winner;
      game.completed_at = new Date();
      game.markModified('game_state');

      const updatedGame = await game.save();
      logger.info(`Game ${gameId} ended. Winner: ${winner}`);

      return updatedGame.toJSON();
    } catch (error) {
      logger.error('Error ending chess game:', error);
      throw error;
    }
  }

  public async abandonGame(gameId: string, currentPlayerId: string): Promise<ChessGame> {
    try {
      const game = await ChessGameModel.findOne({ game_id: gameId });
      if (!game) {
        throw new HttpException(404, 'Chess game not found');
      }

      // Verify the current player is part of this game
      const isPlayerWhite = game.player_white?.toString() === currentPlayerId;
      const isPlayerBlack = game.player_black?.toString() === currentPlayerId;

      if (!isPlayerWhite && !isPlayerBlack) {
        throw new HttpException(403, 'You are not a player in this game');
      }

      // Update game state to abandoned
      game.game_state.status = 'abandoned';
      game.completed_at = new Date();
      game.markModified('game_state');

      const updatedGame = await game.save();
      logger.info(`Game ${gameId} abandoned by ${currentPlayerId}`);

      return updatedGame.toJSON();
    } catch (error) {
      logger.error('Error abandoning chess game:', error);
      throw error;
    }
  }

  public async getGameHistory(playerId: string, limit: number = 10): Promise<ChessGame[]> {
    try {
      const games = await ChessGameModel.find({
        $or: [
          { player_white: playerId },
          { player_black: playerId }
        ],
        'game_state.status': { $in: ['completed', 'abandoned'] }
      })
      .sort({ completed_at: -1 })
      .limit(limit);

      return games.map(game => game.toJSON());
    } catch (error) {
      logger.error('Error fetching game history:', error);
      throw error;
    }
  }
}