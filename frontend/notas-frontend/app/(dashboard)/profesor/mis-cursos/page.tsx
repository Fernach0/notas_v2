import { redirect } from 'next/navigation';

// Esta página fue fusionada con el Dashboard del profesor (/profesor)
export default function MisCursosRedirect() {
  redirect('/profesor');
}
