// "Photo not available" placeholders (neutral, male, female).
import notfound from '../assets/images/users/notfound.webp';
import notfoundMale from '../assets/images/users/notfound-male.webp';
import notfoundFemale from '../assets/images/users/notfound-female.webp';

export { notfound, notfoundMale, notfoundFemale };

// Gender-specific placeholder; neutral when gender is unknown.
export const placeholderFor = (gender) => {
  const g = String(gender || '').trim().toLowerCase();
  if (g === 'female' || g === 'f' || g === 'bride') return notfoundFemale;
  if (g === 'male' || g === 'm' || g === 'groom') return notfoundMale;
  return notfound;
};
