import React from 'react';

// "I'm looking for" select. Logged-in users with a known gender get the opposite
// gender locked (disabled select + hidden input, since disabled fields are not submitted).
const GenderField = ({ id, isLoggedIn, oppositeGender }) => {
  const locked = isLoggedIn && !!oppositeGender;
  return (
    <div className="hp-field">
      <label htmlFor={id}>I'm looking for</label>
      {locked ? (
        <>
          <select id={id} value={oppositeGender} disabled aria-readonly="true" onChange={() => {}}>
            <option value="Female">Bride</option>
            <option value="Male">Groom</option>
          </select>
          <input type="hidden" name="gender" value={oppositeGender} />
        </>
      ) : (
        <select id={id} name="gender" defaultValue="Female" required>
          <option value="Female">Bride</option>
          <option value="Male">Groom</option>
        </select>
      )}
    </div>
  );
};

export default GenderField;
