import fs from 'node:fs';
import path from 'node:path';

const DATA_FILE = path.resolve(process.env.DATA_FILE ?? 'data/members.json');

function load() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return { members: [] };
  }
}

function save(data) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  const tmp = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, DATA_FILE); // 쓰는 도중 꺼져도 파일이 깨지지 않도록
}

export function listMembers() {
  return load().members;
}

/** @returns {boolean} 새로 추가됐으면 true */
export function addMember(userId) {
  const data = load();
  if (data.members.includes(userId)) return false;
  data.members.push(userId);
  save(data);
  return true;
}

/** @returns {boolean} 삭제됐으면 true */
export function removeMember(userId) {
  const data = load();
  const before = data.members.length;
  data.members = data.members.filter((id) => id !== userId);
  if (data.members.length === before) return false;
  save(data);
  return true;
}
