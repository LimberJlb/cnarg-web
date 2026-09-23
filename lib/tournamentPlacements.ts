export interface TournamentPlacement {
  rank: number;
  title: string;
  badge: string;
  color: 'gold' | 'silver' | 'bronze' | 'cyan' | 'blue' | 'purple' | 'zinc';
  icon?: string;
}

export function calculateTournamentPlacements(matches: any[]): Record<string, TournamentPlacement> {
  const placements: Record<string, TournamentPlacement> = {};
  if (!matches || matches.length === 0) return placements;

  const sorted = [...matches].sort((a, b) => (a.match_order || 0) - (b.match_order || 0));

  // 1. Grand Finals (Order 30 / Winners Grand Finals)
  const gf = sorted.find((m) => m.stage === 'GRAND FINALS' && m.bracket_group === 'winners');
  if (gf) {
    const winnerId = gf.team_1_score > gf.team_2_score ? gf.team_1_id : gf.team_2_id;
    const loserId = gf.team_1_score > gf.team_2_score ? gf.team_2_id : gf.team_1_id;
    if (winnerId) {
      placements[winnerId] = {
        rank: 1,
        title: 'Campeón',
        badge: '1º Lugar',
        color: 'gold',
      };
    }
    if (loserId) {
      placements[loserId] = {
        rank: 2,
        title: 'Subcampeón',
        badge: '2º Lugar',
        color: 'silver',
      };
    }
  }

  // 2. Losers Finals (Grand Finals R1, Order 29)
  const lf = sorted.find((m) => m.stage === 'GRAND FINALS R1' && m.bracket_group === 'losers');
  if (lf) {
    const loserId = lf.team_1_score > lf.team_2_score ? lf.team_2_id : lf.team_1_id;
    if (loserId && !placements[loserId]) {
      placements[loserId] = {
        rank: 3,
        title: '3º Puesto',
        badge: '3º Puesto',
        color: 'bronze',
      };
    }
  }

  // 3. Losers Semifinals (Finals R2, Order 27)
  const lsf = sorted.find((m) => m.stage === 'FINALS R2' && m.bracket_group === 'losers');
  if (lsf) {
    const loserId = lsf.team_1_score > lsf.team_2_score ? lsf.team_2_id : lsf.team_1_id;
    if (loserId && !placements[loserId]) {
      placements[loserId] = {
        rank: 4,
        title: '4º Puesto',
        badge: 'Top 4',
        color: 'cyan',
      };
    }
  }

  // 4. Losers Quarterfinals (Finals R1, Order 25, 26)
  const lqf = sorted.filter((m) => m.stage === 'FINALS R1' && m.bracket_group === 'losers');
  for (const m of lqf) {
    const loserId = m.team_1_score > m.team_2_score ? m.team_2_id : m.team_1_id;
    if (loserId && !placements[loserId]) {
      placements[loserId] = {
        rank: 5,
        title: 'Top 5-6',
        badge: 'Top 5-6',
        color: 'blue',
      };
    }
  }

  // 5. Losers Round 3 (Semifinals R2, Order 21, 22)
  const lr3 = sorted.filter((m) => m.stage === 'SEMIFINALS R2' && m.bracket_group === 'losers');
  for (const m of lr3) {
    const loserId = m.team_1_score > m.team_2_score ? m.team_2_id : m.team_1_id;
    if (loserId && !placements[loserId]) {
      placements[loserId] = {
        rank: 7,
        title: 'Top 7-8',
        badge: 'Top 7-8',
        color: 'purple',
      };
    }
  }

  // 6. Losers Round 2 (Semifinals R1, Order 17, 18, 19, 20)
  const lr2 = sorted.filter((m) => m.stage === 'SEMIFINALS R1' && m.bracket_group === 'losers');
  for (const m of lr2) {
    const loserId = m.team_1_score > m.team_2_score ? m.team_2_id : m.team_1_id;
    if (loserId && !placements[loserId]) {
      placements[loserId] = {
        rank: 9,
        title: 'Top 9-12',
        badge: 'Top 9-12',
        color: 'zinc',
      };
    }
  }

  // 7. Losers Round 1 (Quarterfinals R1, Order 9, 10, 11, 12)
  const lr1 = sorted.filter((m) => m.stage === 'QUARTERFINALS R1' && m.bracket_group === 'losers');
  for (const m of lr1) {
    const loserId = m.team_1_score > m.team_2_score ? m.team_2_id : m.team_1_id;
    if (loserId && !placements[loserId]) {
      placements[loserId] = {
        rank: 13,
        title: 'Top 13-16',
        badge: 'Top 13-16',
        color: 'zinc',
      };
    }
  }

  // Equipos que participaron en Round of 16 pero no registraron losers
  for (const m of sorted.filter((x) => x.stage === 'ROUND OF 16')) {
    if (m.team_1_id && !placements[m.team_1_id]) {
      placements[m.team_1_id] = { rank: 13, title: 'Top 13-16', badge: 'Top 13-16', color: 'zinc' };
    }
    if (m.team_2_id && !placements[m.team_2_id]) {
      placements[m.team_2_id] = { rank: 13, title: 'Top 13-16', badge: 'Top 13-16', color: 'zinc' };
    }
  }

  return placements;
}
