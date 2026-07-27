import { config } from '../config.js';
import * as local from './storage/local.js';
import * as supabase from './storage/supabase.js';

const storage = config.storage.type === 'supabase' ? supabase : local;

export const initStorage = storage.initStorage;
export const saveFile = storage.saveFile;
export const saveBuffer = storage.saveBuffer;
export const saveFromPath = storage.saveFromPath;
export const deleteFile = storage.deleteFile;
export const streamFile = storage.streamFile;
export const filenameFromUrl = storage.filenameFromUrl;

export default storage;
