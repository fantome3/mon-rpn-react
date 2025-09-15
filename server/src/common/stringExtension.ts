/**
 * StringExtension provides utility methods for string manipulation.
 * It includes a method to format strings by replacing placeholders with provided arguments.
 */
export default class StringExtension {
  // pré-compile le RegExp UNE seule fois
  private static readonly TOKEN = /{{|}}|{(\d+)}/g;

  static format<T extends unknown[]>(template: string, ...args: T): string {
    if (typeof template !== "string") {
      throw new TypeError("template must be a string");
    }

    // Early exit – nothing to replace
    if (!template.includes("{")) return template;

    return template.replace(StringExtension.TOKEN, (match, index) => {
      switch (match) {
        case "{{":
          return "{";
        case "}}":
          return "}";
        default: {
          const i = Number(index);
          return i in args ? String(args[i]) : match;
        }
      }
    });
  }
}
