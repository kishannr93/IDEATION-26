import { MealDay, MealScanRecord, MealType, RegisteredTeam, TeamMember } from '../types';

export const MEAL_COOLDOWN_MS = 3 * 60 * 60 * 1000; // 3 hours strict per-team cooldown

export const MEAL_DAYS: MealDay[] = ['Day 1 (Dec 1)', 'Day 2 (Dec 2)'];

export const MEAL_TYPES: MealType[] = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];

/**
 * Generates a deterministic, unique-per-team QR / meal coupon code (e.g. MEAL-IDN-0001-7F3A)
 * using the team's ID and name so it remains identical across all admin & participant devices.
 */
export function getTeamMealCode(
  team: Pick<RegisteredTeam, 'id' | 'teamName' | 'mealCode'>
): string {
  if (team.mealCode && team.mealCode.trim().length > 0) {
    return team.mealCode.trim().toUpperCase();
  }
  const cleanId = (team.id || 'IDN-0000').trim().toUpperCase();
  const seed = `${cleanId}::${(team.teamName || '').trim().toUpperCase()}::IDEATION2026_MEAL`;
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const suffix = ((hash >>> 0) % 1679616).toString(36).toUpperCase().padStart(4, '0');
  return `MEAL-${cleanId}-${suffix}`;
}

export function getMemberMealCode(
  team: Pick<RegisteredTeam, 'id' | 'teamName' | 'mealCode'>,
  memberIndex: number
): string {
  return `${getTeamMealCode(team)}-M${memberIndex + 1}`;
}

export function buildTeamRegistrationQrPayload(team: RegisteredTeam): string {
  return JSON.stringify({
    type: 'IDEATION_TEAM_PASS',
    id: team.id,
    mealCode: getTeamMealCode(team),
    team: team.teamName,
    college: team.college,
    members: team.members.length,
    status: team.paymentStatus,
  });
}

export function buildTeamMealQrPayload(
  team: Pick<RegisteredTeam, 'id' | 'teamName' | 'mealCode'>
): string {
  return JSON.stringify({
    type: 'IDEATION_MEAL_PASS',
    id: team.id,
    mealCode: getTeamMealCode(team),
    team: team.teamName,
  });
}

export function buildMemberMealQrPayload(
  team: Pick<RegisteredTeam, 'id' | 'teamName' | 'mealCode'>,
  member: TeamMember,
  memberIndex: number
): string {
  return JSON.stringify({
    type: 'IDEATION_MEMBER_MEAL_PASS',
    id: team.id,
    mealCode: getTeamMealCode(team),
    memberCode: getMemberMealCode(team, memberIndex),
    memberId: member.id,
    memberName: member.name,
    usn: member.usn,
    team: team.teamName,
  });
}

export interface ParsedMealQr {
  idOrCode: string;
  mealCode?: string;
  memberId?: string;
  memberIndex?: number;
}

export function parseMealQrInput(rawContent: string): ParsedMealQr {
  const raw = rawContent.trim();
  if (!raw) return { idOrCode: '' };

  if (raw.startsWith('{') && raw.endsWith('}')) {
    try {
      const parsed = JSON.parse(raw);
      const idOrCode = String(
        parsed.id || parsed.teamId || parsed.mealCode || ''
      )
        .trim()
        .toUpperCase();
      return {
        idOrCode,
        mealCode: parsed.mealCode ? String(parsed.mealCode).trim().toUpperCase() : undefined,
        memberId: parsed.memberId ? String(parsed.memberId).trim() : undefined,
      };
    } catch {
      // Fallback to pattern matching
    }
  }

  // Match member-level code like MEAL-IDN-0001-7F3A-M2
  const memberCodeMatch = raw.match(/MEAL-IDN-\d{4}-[A-Z0-9]+-M(\d+)/i);
  if (memberCodeMatch) {
    const baseCode = memberCodeMatch[0].replace(/-M\d+$/i, '').toUpperCase();
    const mIdx = Math.max(0, parseInt(memberCodeMatch[1], 10) - 1);
    return { idOrCode: baseCode, mealCode: baseCode, memberIndex: mIdx };
  }

  const mealCodeMatch = raw.match(/MEAL-IDN-\d{4}-[A-Z0-9]+/i);
  if (mealCodeMatch) {
    const code = mealCodeMatch[0].toUpperCase();
    return { idOrCode: code, mealCode: code };
  }

  const teamIdMatch = raw.match(/IDN-\d{4}/i);
  if (teamIdMatch) {
    return { idOrCode: teamIdMatch[0].toUpperCase() };
  }

  return { idOrCode: raw.toUpperCase() };
}

export interface TeamMealSlotProgress {
  day: MealDay;
  mealType: MealType;
  totalMembers: number;
  scannedCount: number;
  scannedMembers: TeamMember[];
  remainingMembers: TeamMember[];
  isServed: boolean;
  slotLogs: MealScanRecord[];
  lastScannedAt?: string;
}

export function getTeamMealSlotProgress(
  team: RegisteredTeam,
  day: MealDay,
  mealType: MealType
): TeamMealSlotProgress {
  const members = Array.isArray(team.members) ? team.members : [];
  const totalMembers = members.length;
  const allLogs = Array.isArray(team.mealLogs) ? team.mealLogs : [];
  const slotLogs = allLogs.filter((l) => l.day === day && l.mealType === mealType);

  // Backwards compatibility: a legacy team-wide scan without memberId marks all members scanned
  const hasLegacyWholeTeamScan = slotLogs.some((l) => !l.memberId);

  const scannedMemberIdSet = new Set<string>();
  if (hasLegacyWholeTeamScan) {
    members.forEach((m) => scannedMemberIdSet.add(m.id));
  } else {
    slotLogs.forEach((l) => {
      if (l.memberId) scannedMemberIdSet.add(l.memberId);
    });
  }

  const scannedMembers = members.filter((m) => scannedMemberIdSet.has(m.id));
  const remainingMembers = members.filter((m) => !scannedMemberIdSet.has(m.id));
  const scannedCount = scannedMembers.length;
  const isServed = totalMembers > 0 && scannedCount >= totalMembers;

  let lastScannedAt: string | undefined;
  let maxTs = -1;
  for (const log of slotLogs) {
    const t = Date.parse(log.scannedAt);
    if (!Number.isNaN(t) && t >= maxTs) {
      maxTs = t;
      lastScannedAt = log.scannedAt;
    }
  }

  return {
    day,
    mealType,
    totalMembers,
    scannedCount,
    scannedMembers,
    remainingMembers,
    isServed,
    slotLogs,
    lastScannedAt,
  };
}

export interface MealCooldownStatus {
  blocked: boolean;
  remainingMs: number;
  nextEligibleAt?: string;
  lastScan?: MealScanRecord;
}

export function getLatestMealScan(mealLogs?: MealScanRecord[]): MealScanRecord | undefined {
  if (!Array.isArray(mealLogs) || mealLogs.length === 0) return undefined;
  let latest: MealScanRecord | undefined;
  let latestMs = -1;
  for (const log of mealLogs) {
    const t = Date.parse(log.scannedAt);
    if (!Number.isNaN(t) && t >= latestMs) {
      latestMs = t;
      latest = log;
    }
  }
  return latest;
}

/**
 * Evaluates whether the team is currently in a 3-hour cooldown.
 * Note: While a meal slot is in-progress (some members scanned, others still remaining),
 * remaining members of that SAME active slot can still be scanned immediately until
 * all members are scanned -> marked as SERVED, OR if 3 hours have elapsed since the
 * team's last completed/prior meal scan.
 */
export function evaluateMealCooldown(
  mealLogs?: MealScanRecord[],
  nowMs: number = Date.now(),
  team?: RegisteredTeam,
  targetDay?: MealDay,
  targetMealType?: MealType
): MealCooldownStatus {
  const logs = Array.isArray(mealLogs) ? mealLogs : [];
  const lastScan = getLatestMealScan(logs);
  if (!lastScan) {
    return { blocked: false, remainingMs: 0 };
  }

  // Determine the latest scan that should trigger the 3-hour team lock:
  // 1) If targetDay & targetMealType are provided, allow remaining members of that SAME slot
  //    to finish scanning unless a *different* meal slot was scanned within 3 hours.
  if (team && targetDay && targetMealType) {
    const targetProgress = getTeamMealSlotProgress(team, targetDay, targetMealType);
    const otherSlotLogs = logs.filter(
      (l) => !(l.day === targetDay && l.mealType === targetMealType)
    );

    if (targetProgress.isServed) {
      // Slot itself is completed -> lock based on its completion scan (or latest scan)
      const latestSlotScan = getLatestMealScan(targetProgress.slotLogs) || lastScan;
      const tMs = Date.parse(latestSlotScan.scannedAt);
      if (!Number.isNaN(tMs) && nowMs - tMs < MEAL_COOLDOWN_MS) {
        return {
          blocked: true,
          remainingMs: Math.max(0, MEAL_COOLDOWN_MS - (nowMs - tMs)),
          nextEligibleAt: new Date(tMs + MEAL_COOLDOWN_MS).toISOString(),
          lastScan: latestSlotScan,
        };
      }
      return { blocked: false, remainingMs: 0, lastScan: latestSlotScan };
    }

    // Target slot is still open / in-progress (scannedCount < totalMembers):
    // Only block if a DIFFERENT meal slot was scanned less than 3 hours ago!
    const latestOther = getLatestMealScan(otherSlotLogs);
    if (latestOther) {
      const otherMs = Date.parse(latestOther.scannedAt);
      if (!Number.isNaN(otherMs) && nowMs - otherMs < MEAL_COOLDOWN_MS) {
        return {
          blocked: true,
          remainingMs: Math.max(0, MEAL_COOLDOWN_MS - (nowMs - otherMs)),
          nextEligibleAt: new Date(otherMs + MEAL_COOLDOWN_MS).toISOString(),
          lastScan: latestOther,
        };
      }
    }
    return { blocked: false, remainingMs: 0, lastScan };
  }

  // General overview status: lock is shown when a slot is fully SERVED (or legacy scan) within last 3 hours
  if (team) {
    let blockingCompletedScan: MealScanRecord | undefined;
    let blockingMs = -1;
    for (const d of MEAL_DAYS) {
      for (const m of MEAL_TYPES) {
        const prog = getTeamMealSlotProgress(team, d, m);
        if (prog.isServed) {
          const latestInSlot = getLatestMealScan(prog.slotLogs);
          if (latestInSlot) {
            const tMs = Date.parse(latestInSlot.scannedAt);
            if (!Number.isNaN(tMs) && tMs > blockingMs) {
              blockingMs = tMs;
              blockingCompletedScan = latestInSlot;
            }
          }
        }
      }
    }
    if (blockingCompletedScan && blockingMs > 0 && nowMs - blockingMs < MEAL_COOLDOWN_MS) {
      return {
        blocked: true,
        remainingMs: Math.max(0, MEAL_COOLDOWN_MS - (nowMs - blockingMs)),
        nextEligibleAt: new Date(blockingMs + MEAL_COOLDOWN_MS).toISOString(),
        lastScan: blockingCompletedScan,
      };
    }
    return { blocked: false, remainingMs: 0, lastScan };
  }

  const lastMs = Date.parse(lastScan.scannedAt);
  if (Number.isNaN(lastMs)) {
    return { blocked: false, remainingMs: 0, lastScan };
  }
  const elapsedMs = nowMs - lastMs;
  if (elapsedMs < MEAL_COOLDOWN_MS) {
    const remainingMs = Math.max(0, MEAL_COOLDOWN_MS - elapsedMs);
    return {
      blocked: true,
      remainingMs,
      nextEligibleAt: new Date(lastMs + MEAL_COOLDOWN_MS).toISOString(),
      lastScan,
    };
  }
  return { blocked: false, remainingMs: 0, lastScan };
}

export function formatCooldownDuration(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  return `${hours}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
}

export function mergeMealLogs(
  primary?: MealScanRecord[],
  secondary?: MealScanRecord[]
): MealScanRecord[] {
  const map = new Map<string, MealScanRecord>();
  const add = (list?: MealScanRecord[]) => {
    if (!Array.isArray(list)) return;
    for (const item of list) {
      if (!item || !item.scannedAt) continue;
      const key =
        item.id || `${item.day}::${item.mealType}::${item.memberId || 'ALL'}::${item.scannedAt}`;
      if (!map.has(key)) {
        map.set(key, item);
      }
    }
  };
  add(primary);
  add(secondary);
  return Array.from(map.values()).sort(
    (a, b) => Date.parse(a.scannedAt) - Date.parse(b.scannedAt)
  );
}
