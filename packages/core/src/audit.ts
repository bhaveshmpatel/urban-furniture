
import { prisma } from '@repo/db';

export async function logAudit(
  entity: string,
  entityId: string,
  action: 'CREATE' | 'UPDATE' | 'ARCHIVE' | 'RESET_TO_DRAFT',
  userId: string | null,
  before?: any,
  after?: any
) {
  // @ts-ignore
  await prisma.auditLog.create({
    data: {
      entity,
      entityId,
      action,
      userId,
      before: before ? JSON.stringify(before) : undefined,
      after: after ? JSON.stringify(after) : undefined,
    },
  });
}

