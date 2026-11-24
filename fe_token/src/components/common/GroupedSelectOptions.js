import React from 'react';

// <optgroup> per category with an <option> per subcategory (value = stored value).
const GroupedSelectOptions = ({ groups }) =>
  groups.map((g) => (
    <optgroup key={g.name} label={g.name}>
      {g.subs.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
    </optgroup>
  ));

export default GroupedSelectOptions;
