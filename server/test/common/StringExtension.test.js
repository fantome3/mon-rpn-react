import { StringExtension } from "../../src/common/stringExtension";

describe("StringExtension.format", () => {
  it("remplace les positions de base", () => {
    const tpl = "La maison de {0} est {1} depuis hier {2}";
    expect(StringExtension.format(tpl, "Pierre", "brûlée", "soir"))
      .toBe("La maison de Pierre est brûlée depuis hier soir");
  });

  it("gère les accolades échappées", () => {
    const tpl = "Prix catalogue {{0}} € / promo {0} €";
    expect(StringExtension.format(tpl, 42))
      .toBe("Prix catalogue {0} € / promo 42 €");
  });

  it("laisse intact les index manquants", () => {
    const tpl = "Hello {0} {1}";
    expect(StringExtension.format(tpl, "world"))
      .toBe("Hello world {1}");
  });

  it("supporte tous types primitifs", () => {
    const tpl = "bool {0}, num {1}, obj {2}";
    const res = StringExtension.format(tpl, true, 3.14, { a: 1 });
    expect(res).toBe("bool true, num 3.14, obj [object Object]");
  });

  it("ne modifie pas une chaîne sans jetons", () => {
    expect(StringExtension.format("Rien à remplacer")).toBe("Rien à remplacer");
  });

  it("rejette un template non-string", () => {
    // @ts-expect-error intentional wrong type
    expect(() => StringExtension.format(123)).toThrow(TypeError);
  });

  it("fonctionne avec une longue liste d'arguments", () => {
    const tpl = "{0}-{1}-{2}-{3}-{4}";
    const args = ["a", "b", "c", "d", "e"];
    expect(StringExtension.format(tpl, ...args)).toBe("a-b-c-d-e");
  });
});
