// Bulles d'aide « comment remplir » des 5 champs de la saisie V1 (T6).
// Éditables par le prof (aletheia_params) ; ces valeurs sont les défauts de repli.

export interface AidesV1 {
  these: string
  arguments: string
  accord: string
  questions: string
  vocabulaire: string
}

export const AIDES_V1_DEFAUT: AidesV1 = {
  these: 'L’idée centrale des chapitres lus cette semaine, avec tes mots.',
  arguments: 'Comment l’auteur défend cette idée : ses arguments, ses exemples.',
  accord: 'Une fois l’idée comprise : qu’en penses-tu, et pour quelles raisons ?',
  questions: 'Une question par ligne…\nEx. : Pourquoi Nietzsche oppose-t-il Apollon et Dionysos ?',
  vocabulaire: 'Un mot par ligne…\nIls deviendront des cartes à réviser dans Quazian.',
}
