import { Personne } from "./personne";

export class Compte {
  constructor(
    public readonly titulaire: Personne,
    public readonly email: string,
    public readonly telephone: string
  ) {}

  isValid(): boolean {
    return (
      this.titulaire.isComplete() &&
      this.email.trim().length > 0 &&
      this.telephone.trim().length > 0
    );
  }

  toJSON(): {
    titulaire: ReturnType<Personne["toJSON"]>;
    email: string;
    telephone: string;
  } {
    return {
      titulaire: this.titulaire.toJSON(),
      email: this.email.trim(),
      telephone: this.telephone.trim(),
    };
  }
}