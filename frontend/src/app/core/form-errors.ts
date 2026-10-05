import type { AbstractControl, FormGroup } from '@angular/forms';

/** Messages de validation cote client, alignes sur ceux de l'API (qui reste l'autorite). */
export function clientErrors(form: FormGroup): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const [name, control] of Object.entries(form.controls)) {
    const message = describe(control);
    if (message) {
      errors[name] = message;
    }
  }
  return errors;
}

function describe(control: AbstractControl): string | null {
  const errors = control.errors;
  if (!errors) {
    return null;
  }
  if (errors['required']) {
    return 'Champ obligatoire.';
  }
  if (errors['maxlength']) {
    return `${(errors['maxlength'] as { requiredLength: number }).requiredLength} caractères au plus.`;
  }
  if (errors['min']) {
    return `Minimum : ${(errors['min'] as { min: number }).min}.`;
  }
  return 'Valeur invalide.';
}
