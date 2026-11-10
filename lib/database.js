export const initDatabase = () => {
  if (!global.db || typeof global.db !== 'object') global.db = {};
  if (!Array.isArray(global.db.banned)) global.db.banned = [];
  if (typeof global.db.public !== 'boolean') global.db.public = true;
  if (!global.db.users || typeof global.db.users !== 'object') global.db.users = {};
  if (!global.db.chats || typeof global.db.chats !== 'object') global.db.chats = {};
  if (!global.db.settings || typeof global.db.settings !== 'object') global.db.settings = {};
};
