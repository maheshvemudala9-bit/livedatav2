// Builds /profiles query params from a form element. Only params understood by
// getSearchFiltersFromParams (AdvancedSearchForm.js) are ever sent.
const ALLOWED = [
  'gender', 'ageFrom', 'ageTo', 'maritalStatus', 'caste', 'education',
  'occupation', 'workingLocation', 'heightFrom', 'membershipType',
];

const buildSearchQuery = (formEl, lockedGender = '') => {
  const data = new FormData(formEl);
  const out = new URLSearchParams();
  ALLOWED.forEach((key) => {
    const v = String(data.get(key) || '').trim();
    if (v && v !== '0') out.set(key, v);
  });
  if (lockedGender) out.set('gender', lockedGender);
  const from = Number(out.get('ageFrom'));
  const to = Number(out.get('ageTo'));
  if (from && to && from > to) {
    out.set('ageFrom', String(to));
    out.set('ageTo', String(from));
  }
  out.set('page', '1');
  return out;
};

export default buildSearchQuery;
