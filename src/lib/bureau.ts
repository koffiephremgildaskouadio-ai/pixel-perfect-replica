interface BureauMember {
  bureau_rank: number | null;
  district: string | null;
  is_active?: boolean | null;
}

export function orderedBureau<T extends BureauMember>(members: T[]): T[] {
  return members.filter((member) =>
    member.district?.toLowerCase().includes("novalim") &&
    member.is_active !== false &&
    member.bureau_rank !== null && member.bureau_rank >= 1 && member.bureau_rank <= 16
  ).sort((a, b) => (a.bureau_rank ?? 0) - (b.bureau_rank ?? 0));
}