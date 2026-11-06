import { describe, expect, it } from "vitest";
import { orderedBureau } from "./bureau";

describe("nouveau bureau officiel", () => {
  it("classe le président premier et le haut représentant deuxième jusqu’au poste 18", () => {
    const members = Array.from({ length: 18 }, (_, i) => ({
      id: i + 1, bureau_rank: i + 1, district: "Novalim-CIE",
    })).reverse();
    expect(orderedBureau(members).map(m => m.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]);
  });
  it("exclut les simples membres et les postes extérieurs au nouveau bureau", () => {
    const members = [
      { id: "simple", bureau_rank: null, district: "Novalim-CIE" },
      { id: "autre", bureau_rank: 19, district: "Novalim-CIE" },
      { id: "france", bureau_rank: 1, district: "France-ville" },
      { id: "president", bureau_rank: 1, district: "Novalim-CIE" },
    ];
    expect(orderedBureau(members).map(m => m.id)).toEqual(["president"]);
  });
});