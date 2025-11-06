export interface IRoomService {
  createRoom(name: string, gmId: string, gmName: string, scenario?: string, isPrivate?: boolean, password?: string | null): any;
  getRoomById(roomId: string): any;
  getAllRooms(): any[];
  getPublicRooms(): any[];
  getRoomsByGM(gmId: string): any[];
  getRoomsByPlayer(playerId: string): any[];
}
