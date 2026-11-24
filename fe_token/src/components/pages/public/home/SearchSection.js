import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import GenderField from './GenderField';
import Reveal from './Reveal';
import buildSearchQuery from './buildSearchQuery';
import jsonArr from '../../../templates/data/jsonData';
import { AGE_OPTIONS, MARITAL_OPTIONS, MEMBER_TYPES } from './homeData';
import GroupedSelectOptions from '../../../common/GroupedSelectOptions';
import { EDUCATION_GROUPS, JOB_GROUPS } from '../../../../data/educationJob';

const Select = ({ id, name, label, children }) => (
  <div className="hp-field">
    <label htmlFor={id}>{label}</label>
    <select id={id} name={name} defaultValue="">{children}</select>
  </div>
);

const SearchSection = ({ isLoggedIn, oppositeGender }) => {
  const navigate = useNavigate();
  const [more, setMore] = useState(false);

  const onSubmit = (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      navigate('/signup');
      return;
    }
    const qs = buildSearchQuery(e.currentTarget, oppositeGender);
    navigate(`/profiles?${qs.toString()}`);
  };

  const none = <option value="">No preference</option>;

  return (
    <section className="hp-section hp-section--cream" aria-labelledby="hp-search-title">
      <div className="hp-container">
        <Reveal className="hp-head">
          <h2 id="hp-search-title" className="hp-title">Find Your Match</h2>
          <p>
            Filter by community, education, profession and more.
            {!isLoggedIn && ' Create a free account to see results.'}
          </p>
        </Reveal>
        <Reveal delay={100}>
          <form className="hp-card hp-search" onSubmit={onSubmit}>
            <div className="hp-search__grid">
              <GenderField id="hp-s-gender" isLoggedIn={isLoggedIn} oppositeGender={oppositeGender} />
              <div className="hp-field">
                <label htmlFor="hp-s-from">Age from</label>
                <select id="hp-s-from" name="ageFrom" defaultValue="18">
                  {AGE_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="hp-field">
                <label htmlFor="hp-s-to">Age to</label>
                <select id="hp-s-to" name="ageTo" defaultValue="35">
                  {AGE_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <Select id="hp-s-marital" name="maritalStatus" label="Marital status">
                {none}
                {MARITAL_OPTIONS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </Select>
              <Select id="hp-s-caste" name="caste" label="Caste">
                {none}
                {jsonArr.casteData.map((c) => <option key={c.id} value={c.castelabel}>{c.castelabel}</option>)}
              </Select>
            </div>

            <div id="hp-more-filters" className="hp-search__grid hp-search__more" hidden={!more}>
              <Select id="hp-s-edu" name="education" label="Education">
                {none}
                <GroupedSelectOptions groups={EDUCATION_GROUPS} />
              </Select>
              <Select id="hp-s-occ" name="occupation" label="Occupation">
                {none}
                <GroupedSelectOptions groups={JOB_GROUPS} />
              </Select>
              <Select id="hp-s-loc" name="workingLocation" label="Working location">
                {none}
                {jsonArr.jobLocationsData.map((l) => <option key={l.location} value={l.location}>{l.location}</option>)}
              </Select>
              <Select id="hp-s-height" name="heightFrom" label="Height">
                {none}
                {jsonArr.heightData.map((h) => <option key={h.heightsearch} value={h.heightlabel}>{h.heightlabel}</option>)}
              </Select>
              <Select id="hp-s-member" name="membershipType" label="Member type">
                {none}
                {MEMBER_TYPES.map((m) => <option key={m} value={m}>{m}</option>)}
              </Select>
            </div>

            <div className="hp-search__actions">
              <button
                type="button"
                className="hp-link-btn"
                aria-expanded={more}
                aria-controls="hp-more-filters"
                onClick={() => setMore((v) => !v)}
              >
                {more ? 'Fewer filters' : 'More filters'}
                <i className={`fas fa-chevron-down ${more ? 'is-open' : ''}`} aria-hidden="true" />
              </button>
              <div className="hp-search__submit">
                <button type="submit" className="hp-btn hp-btn--primary">
                  {isLoggedIn ? 'Search Profiles' : 'Register Free to Search'}
                </button>
                {!isLoggedIn && <span className="hp-form__alt">Already a member? <Link to="/login">Login</Link></span>}
              </div>
            </div>
          </form>
        </Reveal>
      </div>
    </section>
  );
};

export default SearchSection;
