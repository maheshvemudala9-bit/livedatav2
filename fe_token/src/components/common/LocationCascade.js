import React from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import { COUNTRY_NAMES, INDIA, INDIA_STATES, getDistricts, isCanonicalLocation } from '../../data/locations';

const STATE_NAMES = INDIA_STATES.map((s) => s.name);
const cleanText = (s) => String(s || '').replace(/,/g, ' ').slice(0, 100);
// Puts the priority names first (in the given order), then the rest unchanged.
const orderStates = (names, priority) => [...priority.filter((p) => names.includes(p)), ...names.filter((n) => !priority.includes(n))];

/**
 * Country > State > District cascade. Renders its fields as a fragment so the host grid lays them out.
 *  value:    { country, state, district } (strings, '' or null when empty)
 *  onChange: (next) => void with the same shape
 *  variant:  "mui" (searchable Autocomplete, Edit Profile) | "native" (plain select, Signup)
 * Country India: state = 36 states / UTs, district = districts of that state.
 * priorityStates (opt-in, default none): state names listed first in the India state list.
 * Any other country: state and city are free text (max 100).
 * A stored value that is not on the lists is shown read-only with a hint and a "Re-select" button;
 * it is kept as is until the user re-selects, so nothing is erased silently.
 */
const LocationCascade = ({
  value,
  onChange,
  variant = 'mui',
  labels = {},
  idPrefix = 'loc',
  fieldClassName = '',
  fullClassName = '',
  error = '',
  legacyHint = 'Please re-select your location.',
  required = false,
  // City/District asterisk; defaults to `required`. Signup's work location keeps Country required only.
  districtRequired = required,
  countryError = '',
  // CSS class for error text (Signup passes 'sg-error' so it shows in red).
  errorClassName = 'error',
  priorityStates = [],
}) => {
  const country = (value && value.country) || '';
  const state = (value && value.state) || '';
  const district = (value && value.district) || '';
  const L = {
    country: 'Country',
    state: 'State',
    district: 'District / City',
    stateText: 'State / Province',
    cityText: 'City',
    legacy: 'Location',
    ...labels,
  };
  const isIndia = country === INDIA;
  const legacy = !isCanonicalLocation({ country, state, district });

  const set = (patch) => onChange({ country, state, district, ...patch });
  const pickCountry = (c) => onChange({ country: c || '', state: '', district: '' });
  const pickState = (s) => set({ state: s || '', district: '' });
  const pickDistrict = (d) => set({ district: d || '' });
  const stateOptions = isIndia ? orderStates(STATE_NAMES, priorityStates) : [];
  const districts = isIndia ? getDistricts(state) : [];
  const stateHelper = !country ? 'Select Country first' : '';
  const districtHelper = isIndia && !state ? 'Select State first' : '';
  const reselect = () => onChange({ country: '', state: '', district: '' });

  const wrap = (key, children, extra = '') => (
    <div className={`${fieldClassName} ${extra}`.trim()} key={key}>{children}</div>
  );
  const errorEl = error ? <span className={errorClassName}>{error}</span> : null;

  if (legacy) {
    const raw = [district, state, country].filter(Boolean).join(', ');
    if (variant === 'native') {
      return wrap('legacy', (
        <>
          <label className="sg-label" htmlFor={`${idPrefix}-legacy`}>{L.legacy}</label>
          <input id={`${idPrefix}-legacy`} className="form-control" value={raw} readOnly />
          <small className="error">{legacyHint}</small>
          <div><button type="button" className="btn btn-sm" onClick={reselect}>Re-select</button></div>
        </>
      ), fullClassName);
    }
    return wrap('legacy', (
      <>
        <TextField
          id={`${idPrefix}-legacy`}
          label={L.legacy}
          value={raw}
          variant="outlined"
          margin="normal"
          fullWidth
          InputProps={{ readOnly: true }}
          helperText={legacyHint}
          FormHelperTextProps={{ sx: { color: '#d32f2f' } }}
        />
        <Button type="button" size="small" onClick={reselect}>Re-select</Button>
        {errorEl}
      </>
    ), fullClassName);
  }

  if (variant === 'native') {
    const id = (n) => `${idPrefix}-${n}`;
    return (
      <>
        {wrap('country', (
          <>
            <label className="sg-label" htmlFor={id('country')}>{L.country}{required ? ' *' : ''}</label>
            <select id={id('country')} className="form-control" value={country} onChange={(e) => pickCountry(e.target.value)}>
              <option value="">Select Country</option>
              {COUNTRY_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            {countryError && <span className={errorClassName}>{countryError}</span>}
          </>
        ))}
        {wrap('state', isIndia || !country ? (
          <>
            <label className="sg-label" htmlFor={id('state')}>{L.state}</label>
            <select id={id('state')} className="form-control" value={state} disabled={!country} onChange={(e) => pickState(e.target.value)}>
              <option value="">{country ? 'Select State' : 'Select Country first'}</option>
              {stateOptions.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </>
        ) : (
          <>
            <label className="sg-label" htmlFor={id('state')}>{L.stateText}</label>
            <input id={id('state')} className="form-control" type="text" maxLength={100} value={state} onChange={(e) => pickState(cleanText(e.target.value))} />
          </>
        ))}
        {wrap('district', isIndia || !country ? (
          <>
            <label className="sg-label" htmlFor={id('district')}>{L.district}{districtRequired ? ' *' : ''}</label>
            <select id={id('district')} className="form-control" value={district} disabled={!isIndia || !state} onChange={(e) => pickDistrict(e.target.value)}>
              <option value="">{isIndia && state ? 'Select District' : (country ? 'Select State first' : 'Select Country first')}</option>
              {districts.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            {errorEl}
          </>
        ) : (
          <>
            <label className="sg-label" htmlFor={id('district')}>{L.cityText}{districtRequired ? ' *' : ''}</label>
            <input id={id('district')} className="form-control" type="text" maxLength={100} value={district} onChange={(e) => pickDistrict(cleanText(e.target.value))} />
            {errorEl}
          </>
        ))}
      </>
    );
  }

  return (
    <>
      {wrap('country', (
        <Autocomplete
          id={`${idPrefix}-country`}
          options={COUNTRY_NAMES}
          value={country || null}
          onChange={(e, v) => pickCountry(v)}
          autoHighlight
          clearOnEscape
          isOptionEqualToValue={(o, v) => o === v}
          renderInput={(params) => (
            <TextField {...params} label={L.country} variant="outlined" margin="normal"
              inputProps={{ ...params.inputProps, 'aria-label': L.country }} />
          )}
        />
      ))}
      {wrap('state', isIndia || !country ? (
        <Autocomplete
          id={`${idPrefix}-state`}
          options={stateOptions}
          value={state || null}
          disabled={!country}
          onChange={(e, v) => pickState(v)}
          autoHighlight
          clearOnEscape
          isOptionEqualToValue={(o, v) => o === v}
          renderInput={(params) => (
            <TextField {...params} label={L.state} variant="outlined" margin="normal" helperText={stateHelper}
              inputProps={{ ...params.inputProps, 'aria-label': L.state }} />
          )}
        />
      ) : (
        <TextField id={`${idPrefix}-state`} label={L.stateText} value={state} variant="outlined" margin="normal" fullWidth
          inputProps={{ maxLength: 100 }} onChange={(e) => pickState(cleanText(e.target.value))} />
      ))}
      {wrap('district', (
        <>
          {isIndia || !country ? (
            <Autocomplete
              id={`${idPrefix}-district`}
              options={districts}
              value={district || null}
              disabled={!isIndia || !state}
              onChange={(e, v) => pickDistrict(v)}
              autoHighlight
              clearOnEscape
              isOptionEqualToValue={(o, v) => o === v}
              renderInput={(params) => (
                <TextField {...params} label={L.district} variant="outlined" margin="normal"
                  helperText={districtHelper || (!country ? 'Select Country first' : '')}
                  inputProps={{ ...params.inputProps, 'aria-label': L.district }} />
              )}
            />
          ) : (
            <TextField id={`${idPrefix}-district`} label={L.cityText} value={district} variant="outlined" margin="normal" fullWidth
              inputProps={{ maxLength: 100 }} onChange={(e) => pickDistrict(cleanText(e.target.value))} />
          )}
          {errorEl}
        </>
      ))}
    </>
  );
};

export default LocationCascade;
