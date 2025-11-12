

// Nouvelle version RoomService pour TypeORM
import { AppDataSource } from '../data-source.js';
import { Room } from '../models/Room';
import { PlayerInRoom } from '../models/PlayerInRoom';
import { User } from '../models/User';
import { Scenario } from '../models/Scenario';
import { Repository } from 'typeorm';

export class RoomService {
  // Récupère un joueur dans une room (PlayerInRoom) par roomId et userId
  async getPlayerInRoom(roomId: string, userId: string): Promise<PlayerInRoom | null> {
    return await this.playerRepo.findOne({ where: { room: { id: roomId }, user: { id: userId } }, relations: ['user', 'room'] });
  }
  private roomRepo: Repository<Room>;
  private playerRepo: Repository<PlayerInRoom>;
  private userRepo: Repository<User>;
  private scenarioRepo: Repository<Scenario>;

  constructor() {
    this.roomRepo = AppDataSource.getRepository(Room);
    this.playerRepo = AppDataSource.getRepository(PlayerInRoom);
    this.userRepo = AppDataSource.getRepository(User);
    this.scenarioRepo = AppDataSource.getRepository(Scenario);
  }

  async createRoom({ name, gmId, scenarioId, isPrivate = false, password = null }: {
    name: string;
    gmId: string;
    scenarioId?: string;
    isPrivate?: boolean;
    password?: string | null;
  }): Promise<Room> {
    const gm = await this.userRepo.findOneByOrFail({ id: gmId });
    let scenario: Scenario | undefined = undefined;
    if (scenarioId) {
      // findOneBy retourne Scenario | null, donc on convertit null en undefined
      const found = await this.scenarioRepo.findOneBy({ id: scenarioId });
      scenario = found === null ? undefined : found;
    }
    const room = this.roomRepo.create({
      name,
      gm,
      scenario,
      isPrivate,
      password: password ?? undefined,
      status: 'waiting',
      currentScene: 0,
      scenesHistory: [],
      maxPlayers: 6
    });
    return await this.roomRepo.save(room);
  }

  async getRoomById(roomId: string): Promise<Room | null> {
    return await this.roomRepo.findOne({
      where: { id: roomId },
      relations: ['gm', 'scenario', 'players', 'players.user']
    });
  }

  async getAllRooms(): Promise<Room[]> {
    return await this.roomRepo.find({ relations: ['gm', 'scenario', 'players', 'players.user'] });
  }

  async getPublicRooms(): Promise<Room[]> {
    return await this.roomRepo.find({ where: { isPrivate: false }, relations: ['gm', 'scenario', 'players', 'players.user'] });
  }

  async getRoomsByGM(gmId: string): Promise<Room[]> {
    return await this.roomRepo.find({ where: { gm: { id: gmId } }, relations: ['gm', 'scenario', 'players', 'players.user'] });
  }

  async getRoomsByPlayer(playerId: string): Promise<Room[]> {
  const playerRooms = await this.playerRepo.find({ where: { user: { id: playerId } }, relations: ['room'] });
  // getRoomById peut retourner null, donc on filtre les nulls
  const rooms = await Promise.all(playerRooms.map(async pr => await this.getRoomById(pr.room.id)));
  return rooms.filter((r): r is Room => r !== null);
  }

  async deleteRoom(roomId: string): Promise<boolean> {
  const res = await this.roomRepo.delete(roomId);
  return (res.affected ?? 0) > 0;
  }

  async addPlayerToRoom(roomId: string, userId: string, character?: any, role: 'player' | 'gm' = 'player'): Promise<PlayerInRoom> {
    const room = await this.getRoomById(roomId);
    if (!room) throw new Error('Room non trouvée');
    const user = await this.userRepo.findOneByOrFail({ id: userId });
    const player = this.playerRepo.create({ room, user, character, role, joinedAt: new Date() });
    return await this.playerRepo.save(player);
  }

  async removePlayerFromRoom(roomId: string, userId: string): Promise<boolean> {
    const player = await this.playerRepo.findOne({ where: { room: { id: roomId }, user: { id: userId } } });
    if (!player) return false;
    await this.playerRepo.remove(player);
    return true;
  }

  async updateRoomStatus(roomId: string, status: 'waiting' | 'active' | 'paused' | 'completed'): Promise<Room | null> {
    const room = await this.getRoomById(roomId);
    if (!room) throw new Error('Room non trouvée');
    room.status = status;
    return await this.roomRepo.save(room);
  }

  async getStats() {
    const rooms = await this.getAllRooms();
    // On ne peut plus compter room.players car la propriété n'existe plus directement sur Room (relation via PlayerInRoom)
    // On compte les PlayerInRoom associés à chaque room
    const playerCounts = await Promise.all(
      rooms.map(async room => {
        const count = await this.playerRepo.count({ where: { room: { id: room.id } } });
        return count;
      })
    );
    return {
      totalRooms: rooms.length,
      publicRooms: rooms.filter(r => !r.isPrivate).length,
      privateRooms: rooms.filter(r => r.isPrivate).length,
      activeRooms: rooms.filter(r => r.status === 'active').length,
      waitingRooms: rooms.filter(r => r.status === 'waiting').length,
      pausedRooms: rooms.filter(r => r.status === 'paused').length,
      completedRooms: rooms.filter(r => r.status === 'completed').length,
      totalPlayers: playerCounts.reduce((sum, c) => sum + c, 0)
    };
  }
}

// Singleton
export const roomService = new RoomService();