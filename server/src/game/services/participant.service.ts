import { pool } from '../../config/db';
import { AuthenticatedUser } from '../../websocket/ws.types';

export async function getParticipantForSession(
  queryable: Pick<typeof pool, 'query'>,
  user: AuthenticatedUser,
  sessionId: string
) {
  const participantResult = await queryable.query(
    `
        SELECT id, display_name, role
        FROM session_participants
        WHERE session_id = $1
          AND user_id = $2
        LIMIT 1
        `,
    [sessionId, user.id]
  );

  if (participantResult.rows.length === 0) {
    throw new Error('Jucătorul nu aparține acestei sesiuni.');
  }

  return participantResult.rows[0];
}
