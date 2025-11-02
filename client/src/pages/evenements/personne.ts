export class Personne {
  constructor(private readonly _prenom: string, private readonly _nom: string) {}

  static empty(): Personne {
    return new Personne("", "");
  }

  get prenom(): string {
    return this._prenom;
  }

  get nom(): string {
    return this._nom;
  }

  withPrenom(value: string): Personne {
    return new Personne(value, this._nom);
  }

  withNom(value: string): Personne {
    return new Personne(this._prenom, value);
  }

  isComplete(): boolean {
    return this._prenom.trim().length > 0 && this._nom.trim().length > 0;
  }

  toJSON(): { prenom: string; nom: string } {
    return {
      prenom: this._prenom.trim(),
      nom: this._nom.trim(),
    };
  }
}