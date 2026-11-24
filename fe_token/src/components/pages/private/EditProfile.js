
import React, { useEffect, useState } from "react";

import api from '../../../utils/api' // <-- updated import
import { imageUrl, approvedProfileImage } from '../../../utils/imageUrl';
import { Link } from 'react-router-dom'
import Profiles from '../../templates/ImagesLoader'
import { placeholderFor } from '../../../utils/placeholders';
import Sidebar from './templates/Sidebar'
//mui
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
//ICONs
import IconButton from "@mui/material/IconButton";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import PhoneIcon from "@mui/icons-material/Phone";
import InputAdornment from "@mui/material/InputAdornment";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee"
import moment from 'moment'
import jsonArr from "../../templates/data/jsonData";
import { useToast } from '../../../components/hooks/ToastContext';
import { toTitleCase } from '../../../utils/normalizeText';
import { RASI_LABELS, nakshatrasFor, padasFor, resolveSaved } from '../../../data/horoscope';
import GroupedRadioSelect from '../../common/GroupedRadioSelect';
import { EDUCATION_GROUPS, JOB_GROUPS } from '../../../data/educationJob';
import LocationCascade from '../../common/LocationCascade';
import { formatPlace, normalizeLegacyLocation, parsePlace, isCanonicalLocation, mapLegacyJobLocation } from '../../../data/locations';
//end of icons
import {
  fetchUserDetails,
  fetchUserGallery,
  updateUserRecords,
  updateUserRegistrationDetails
} from '../../../services/userService';
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Box, Typography } from "@mui/material";
import axios from "axios";
import '../../../assets/css/pages/edit-profile.css';
import { API_BASE_URL } from '../../../utils/apiBase';

const theme = createTheme({
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          "&.Mui-error .MuiOutlinedInput-notchedOutline": {
            borderColor: "#ffcccc",
          },
        },
        input: {
          "&[readonly]": {
            backgroundColor: "#f0f0f0", // Light grey color
          },
        },
      },
    },
  },
});

const siblingValue = (v) => (v === null || v === undefined || String(v).trim() === '' ? '0' : String(v));
const DETAIL_MAX = 200;
const DETAIL_HELP = "Do not enter phone numbers or email addresses.";
const MaritalStatus = ["Single", "Married", "Divorced"];
const inrOptions = [{ label: "Thousand" }, { label: "Lakhs" }, { label: "Crores" }]
const diet = ["Vegeterian", "Eggitarian", "Non-vegetarian"];
const habitsOptions = ["Never", "Occasionally", "Socially", "Regularly"]
const heights = jsonArr.heightData ? jsonArr.heightData.map(res => res.heightlabel) : [];
// ["5","5-1","5-2"];
const genders = ["Male", "Female"]
// const castes =["Goldsmith","Carpenter","Kamma","Kapu","Brahmin"];
const castes = jsonArr.casteData ? jsonArr.casteData.map(res => res.castelabel) : [];
// ["Ardra","Shathabhisha","Swathi","Anuradha","Vishaka"]
//  ["Midhuna","Simha","Tula"]
// [ "Psychology Or Social Sciences", "Business", "Law", "Medical", "Computer & Information Technology", "Arts", "Commerce", "Engineering Technology", "Fashions", "Fine Arts", "Finance &amp; Accounting", "Education", "Architecture", "Others" ]

const EditProfile = () => {
  //input handler states 
  const [salaryNum, setSalaryNum] = useState("");
  const [salaryUnits, setSalaryUnits] = useState(inrOptions[1]);
  const [salaryMessage, setSalaryMessage] = useState("")
  //end of input handler states
  const [formData, setFormData] = useState(
    {
      uid: localStorage.getItem('userId'),
      fname: "", lname: "", mobile: "", email: "", gender: null, pob: null, dob: "", tob: "", caste: null, maritalStatus: null, height: null,
      about: "", nakshtra: null, padam: null, rasi: null, gothram: "", altPhone: "", degree: null, profession: null, fatherName: "",
      motherName: "", brothers: "0", sisters: "0", brothersMarried: "0", sistersMarried: "0", fatherOccupation: null, motherOccupation: null,
      familyResidence: null, diet: null, habitsmoke: null, habitdrink: null, partnerPreferences: "",
      jobCountry: "", jobState: "", jobDistrict: "", jobLegacy: false, jobLegacyText: "",
      educationDetail: "", jobDetail: "",
      pobLoc: { country: "", state: "", district: "" },
      familyCountry: "", familyState: "", familyDistrict: "", familyLegacy: false,
      package: "NA"
    });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [horoHint, setHoroHint] = useState(false);
  const [getGallery, setGetGallery] = useState([])
  const [userDetails, setUserDetails] = useState([]);
  const userId = localStorage.getItem("userId"); // <-- define userId once

  const { showToast } = useToast();
  useEffect(() => {
    const fetchUserGallery = async () => {
      try {
        const response = await api.post(
          '/FetchUserDetails',
          { uid: userId }
        );
        setUserDetails(response.data);
      }
      catch (error) { console.error('Error fetching user details:', error); }

      try {
        const res = await api.post(
          '/GetUserGallery',
          { uid: userId }
        );
        setGetGallery(res.data);
      }
      catch (error) { console.error('Error fetching user gallery:', error); }
    };
    fetchUserGallery();
  }, [userId]);
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
    validateFields(name, value);
  };
  //salry

  const handleSalaryNumChange = (event) => {
    const value = event.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setSalaryNum(value); updateSalaryMessage(value, salaryUnits);
    }

  }; const handleSalaryUnitsChange = (event, newValue) => {
    setSalaryUnits(newValue); updateSalaryMessage(salaryNum, newValue);
  };
  const updateSalaryMessage = (num, units) => {
    if (num && units) {
      setSalaryMessage(`** ${num} ${units.label} per Annum`);
    } else { setSalaryMessage(""); }
  };
  //salry

  const handleGenderChange = (event, newValue) => { setFormData({ ...formData, gender: newValue }); validateFields('gender', newValue); };
  const handlePobChange = (next) => {
    const pob = formatPlace(next);
    setFormData(prev => ({ ...prev, pobLoc: next, pob }));
    validateFields('pob', next.district ? pob : '');
  }
  const handleCasteChange = (event, newValue) => { setFormData({ ...formData, caste: newValue }); validateFields('caste', newValue) }
  const handleMaritalStatusChange = (event, newValue) => { setFormData({ ...formData, maritalStatus: newValue }); validateFields('maritalStatus', newValue) }
  const handleHeightChange = (event, newValue) => { setFormData({ ...formData, height: newValue }); validateFields('height', newValue) }
  const handleNakshtraChange = (event, newValue) => {
    const padas = newValue ? padasFor(formData.rasi, newValue) : [];
    const padam = padas.length === 1 ? padas[0] : (padas.includes(formData.padam) ? formData.padam : null);
    setHoroHint(false);
    setFormData({ ...formData, nakshtra: newValue, padam });
  }
  const handlePadamChange = (event, newValue) => { setHoroHint(false); setFormData({ ...formData, padam: newValue }) }
  const handleRasiChange = (event, newValue) => {
    let nakshtra = formData.nakshtra, padam = formData.padam;
    if (!newValue || !nakshatrasFor(newValue).includes(nakshtra)) { nakshtra = null; padam = null; }
    else {
      const padas = padasFor(newValue, nakshtra);
      padam = padas.length === 1 ? padas[0] : (padas.includes(padam) ? padam : null);
    }
    setHoroHint(false);
    setFormData({ ...formData, rasi: newValue, nakshtra, padam });
  }
  const handleJobLocationChange = (next) => {
    setFormData(prev => ({
      ...prev,
      jobCountry: next.country, jobState: next.state, jobDistrict: next.district,
      jobLegacy: false, jobLegacyText: ""
    }));
  }
  const handleFamilyLocationChange = (next) => {
    setFormData(prev => ({
      ...prev,
      familyCountry: next.country, familyState: next.state, familyDistrict: next.district,
      familyResidence: formatPlace(next), familyLegacy: false
    }));
  }
  const handleDietChange = (event, newValue) => { setFormData({ ...formData, diet: newValue }); }
  const handleSmokeHabitsChange = (event, newValue) => { setFormData({ ...formData, habitsmoke: newValue }); }
  const handleDrinkHabitsChange = (event, newValue) => { setFormData({ ...formData, habitdrink: newValue }); }

  const validateFields = (name, value) => {
    const validationErrors = { ...errors };
    switch (name) {
      case "fname": validationErrors.fname = value.trim() ? "" : "Surname is required"; break;
      case "lname": validationErrors.lname = value.trim() ? "" : "Name is required"; break;
      case "email": validationErrors.email = value.trim()
        ? /\S+@\S+\.\S+/.test(value)
          ? "" : "Email is not valid"
        : "Email is required"; break;
      case "gender": validationErrors.gender = value ? "" : "Gender is required"; break;
      case "pob": validationErrors.pob = value ? "" : "Place of birth is required"; break;
      case 'caste': validationErrors.caste = value ? "" : "caste required."; break;
      case 'maritalStatus': validationErrors.maritalStatus = value ? "" : "Marital Status is required."; break;
      default: break;
    } setErrors(validationErrors);
  };
  useEffect(() => {
    if (salaryNum && salaryUnits) {
      const packageValue = `${salaryNum} ${salaryUnits.label}`;
      setFormData(prev => ({
        ...prev,
        package: packageValue
      }));
    } else if (salaryNum) {
      setFormData(prev => ({
        ...prev,
        package: salaryNum
      }));
    }
  }, [salaryNum, salaryUnits]);
  useEffect(() => {
    const fetchUserData = async () => {
      try {
       
        const response = await fetchUserDetails(userId);
        if (response.data) {
          console.log("xloginmys", response.data)
          const data = response.data;
        
          const horo = resolveSaved(data.rasi, data.nakshtra, data.padam);
          setHoroHint(horo.needsReselect);
          // Locations: map every legacy shape ('TS_Adilabad', 'Adilabad (TG)', 'AP') to the canonical
          // country / state / district. Unmappable values are returned as they are, and the cascade
          // then shows them read-only with a "re-select" hint instead of erasing them.
          // (Present location users.ucountry / ustate / upresentloc is not edited here and never sent.)
          const pobParsed = parsePlace(data.upob);
          const pobLoc = { country: pobParsed.country, state: pobParsed.state, district: pobParsed.district };
          const hasFamilyCols = !!(data.family_country || data.family_state || data.family_district);
          const famLoc = hasFamilyCols
            ? { country: data.family_country || "", state: data.family_state || "", district: data.family_district || "" }
            : normalizeLegacyLocation({ district: data.familyresidence });
          const famMapped = hasFamilyCols || (!!data.familyresidence && isCanonicalLocation(famLoc) && !!famLoc.country);
          const famLegacy = !hasFamilyCols && !!data.familyresidence && !famMapped;
          // Job location: new columns first, else map the legacy work-city / country value.
          // Unmappable ("Other" ...) is shown read-only and the stored value is kept (not sent).
          const hasJobCols = !!(data.job_country || data.job_state || data.job_city);
          const jobMapped = hasJobCols
            ? { country: data.job_country || "", state: data.job_state || "", district: data.job_city || "", ok: true }
            : mapLegacyJobLocation(data.jobcity);
          const jobLegacy = !jobMapped.ok;
          setFormData(prevFormData => ({
            ...prevFormData,
            "fname": data.ufname,
            "lname": data.ulname,
            "mobile": data.uphone,
            "email": data.uemail,
            "gender": data.ugender,
            "pob": pobParsed.ok ? formatPlace(pobLoc) : (data.upob || ""),
            "pobLoc": pobParsed.ok ? pobLoc : { country: "", state: "", district: data.upob || "" },
            "dob": data.udob,
            "tob": data.utob,
            "caste": data.ucaste,
            "maritalStatus": data.maritalstatus,
            "height": data.uheight,
            "educationDetail": data.education_detail || "",
            "jobDetail": data.job_detail || "",
            "jobCountry": jobLegacy ? "" : jobMapped.country,
            "jobState": jobLegacy ? "" : jobMapped.state,
            "jobDistrict": jobLegacy ? "" : jobMapped.district,
            "jobLegacy": jobLegacy,
            "jobLegacyText": jobLegacy ? (data.jobcity || "") : "",
            "about": data.about,
            "nakshtra": horo.nakshtra,
            "padam": horo.padam,
            "rasi": horo.rasi,
            "gothram": data.gothram || "",
            "altPhone": data.ualtphone || "",
            "degree": data.degree,
            "profession": data.ujob,
            "fatherName": data.fathername,
            "motherName": data.mothername,
            "brothers": siblingValue(data.brothers),
            "sisters": siblingValue(data.sisters),
            "brothersMarried": siblingValue(data.brothersmarried),
            "sistersMarried": siblingValue(data.sistersmarried),
            "fatherOccupation": data.fatheroccupation,
            "motherOccupation": data.motheroccupation,
            "familyResidence": famMapped ? formatPlace(famLoc) : (data.familyresidence || ""),
            "familyCountry": famMapped ? famLoc.country : "",
            "familyState": famMapped ? famLoc.state : "",
            "familyDistrict": famMapped ? famLoc.district : "",
            "familyLegacy": famLegacy,
            "diet": data.diet,
            "habitsmoke": data.habitsmoke,
            "habitdrink": data.habitdrink,
            "partnerPreferences": data.partnerpreferences,
            "package": data.upackage || "NA"

          }));
          if (data.upackage && data.upackage !== "NA") {
            // Try to extract number and unit from package string
            const match = data.upackage.match(/^([\d.]+)\s*(.*)$/);
            if (match) {
              setSalaryNum(match[1]);
              // Find matching unit from inrOptions
              const unit = inrOptions.find(opt =>
                match[2].toLowerCase().includes(opt.label.toLowerCase())
              );
              if (unit) {
                setSalaryUnits(unit);
              }
            }
          }

        } console.log("eeeeeeee")
      }
      catch (error) { console.error('Error fetching user details:', error); }
    }; fetchUserData();
  }, [formData.uid]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    // Alternate phone: optional; digits with optional leading +, 10-15 digits.
    const altRaw = String(formData.altPhone || '').replace(/[\s-]/g, '');
    const primaryRaw = String(formData.mobile || '').replace(/[\s-]/g, '');
    let altError = "";
    if (altRaw) {
      if (!/^\+?\d{10,15}$/.test(altRaw)) altError = "Enter a valid alternate number (10 to 15 digits, optional leading +).";
      else if (altRaw.replace(/^\+/, '') === primaryRaw.replace(/^\+/, '')) altError = "Alternate number must be different from your primary number.";
    }
    const gothramValue = String(formData.gothram || '').trim();
    const gothramError = gothramValue.length > 100 ? "Gothram must be 100 characters or fewer." : "";
    const educationDetailValue = String(formData.educationDetail || '').trim();
    const jobDetailValue = String(formData.jobDetail || '').trim();
    const educationDetailError = educationDetailValue.length > DETAIL_MAX ? `Education Detail must be ${DETAIL_MAX} characters or fewer.` : "";
    const jobDetailError = jobDetailValue.length > DETAIL_MAX ? `Job Detail must be ${DETAIL_MAX} characters or fewer.` : "";
    if (altError || gothramError || educationDetailError || jobDetailError) {
      setErrors(prev => ({ ...prev, altPhone: altError, gothram: gothramError, educationDetail: educationDetailError, jobDetail: jobDetailError }));
      showToast({ title: 'Check your details', description: altError || gothramError || educationDetailError || jobDetailError, type: 'error' });
      return;
    }
    setErrors(prev => ({ ...prev, altPhone: "", gothram: "", educationDetail: "", jobDetail: "" }));
    try {
      const normalizedFormData = {
  ...formData,
  gothram:    gothramValue,
  educationDetail: educationDetailValue, // always sent so clearing the box works
  jobDetail:       jobDetailValue,
  ualtphone:  altRaw,
  fname:      toTitleCase(formData.fname),
  lname:      toTitleCase(formData.lname),
  fatherName: toTitleCase(formData.fatherName),
  motherName: toTitleCase(formData.motherName),
  brothers:        siblingValue(formData.brothers),
  sisters:         siblingValue(formData.sisters),
  brothersMarried: siblingValue(formData.brothersMarried),
  sistersMarried:  siblingValue(formData.sistersMarried),
  about:        formData.about, // keep as-is — free text paragraph
  partnerPreferences: formData.partnerPreferences // keep as-is — free text
  // about & partnerPreferences kept as-is (free text paragraphs)
};
      
 setFormData(normalizedFormData);
      setSaving(true);
      // Unmapped legacy family location: send neither the cascade parts nor a changed text, so the
      // stored values stay as they are (omitted keys = keep).
      const payload = { ...normalizedFormData };
      if (payload.familyLegacy) {
        delete payload.familyCountry;
        delete payload.familyState;
        delete payload.familyDistrict;
      }
      // Unmapped legacy job location: send no job keys so the stored jobcity text stays as it is.
      delete payload.jobLegacy;
      delete payload.jobLegacyText;
      if (formData.jobLegacy) {
        delete payload.jobCountry;
        delete payload.jobState;
        delete payload.jobDistrict;
      }
      const res = await updateUserRecords(payload);
      if (res.data && res.data.status === "Success") {
        const ress = await updateUserRegistrationDetails(normalizedFormData);
        if (ress.data.status === "Success") {

          console.log("user Data updated successfully!");
          // event.target.reset();
        } else if (ress.data.status === "Fail") {
          console.log("Data update unsuccessful.");
        }
        //end user ingest
        setErrors({});
        showToast({
          title: 'Profile Updated',
          description: 'Your profile details have been saved successfully.',
          type: 'success'
        });
      } else {
        // ❌ Failure: show the server's message
        showToast({
          title: 'Update Failed',
          description: (res.data && typeof res.data.result === 'string' && res.data.result) || 'Could not update profile. Please try again.',
          type: 'error'
        });
      }
    }
    catch (error) {
      if (axios.isCancel(error)) {
        console.log("Failure", error.message)
      } else {
        const serverMsg = error && error.response && error.response.data && error.response.data.result;
        showToast({
          title: 'Update Failed',
          description: (typeof serverMsg === 'string' && serverMsg) || 'Could not update profile. Please try again.',
          type: 'error'
        });
      }
    } finally {
      setSaving(false);
    }
  };
  return (
    <>  <ThemeProvider theme={theme}>

      <div className="inner-heading" style={{ backgroundImage: `url(${Profiles.titlebg})` }}>
        <div className="container">
          <h3>Edit Personal Details</h3>
        </div>
      </div>
      {/* <!--Inner Heading End--> 
  
  <!--Inner Content Start--> */}
      <div className="inner-content">

        <div className="container">
          <div className="profile-Wrap">
            <div className="row">

              <Sidebar></Sidebar>
              <div className="col-lg-8 col-md-8 ep-main"><form className="ep-form" onSubmit={handleSubmit}>
                <div className="ep-body">
                  {/* <!-- General Information --> */}
                  <div className="ep-card ep-card--profile edit-info">
                    <div className="ep-card__head ep-card__head--profile">
                      <div className="avater-box ep-avatar">
                        <div className="ep-avatar__frame">
                          <i className="fas fa-user ep-avatar__placeholder" aria-hidden="true"></i>
                          {getGallery.length > 0 ? (
                            (() => {
                              const profileFile = approvedProfileImage(getGallery);
                              return profileFile ? (
                                <img
                                  // src={profileFile.imagepath}
                                  src={imageUrl(profileFile.imagepath_thumb) || imageUrl(profileFile.imagepath)}
                                  className="img-responsive img-circle edit-avater ep-avatar__img"
                                  alt="Profile"
                                  data-gender={localStorage.getItem('userGender') || ''}
                                  onError={e => { e.target.src = placeholderFor(localStorage.getItem('userGender')); }}
                                />
                              ) : null;
                            })()
                          ) : null}
                        </div>

                        {/* <img src={Profiles.authorimg} className="img-responsive img-circle edit-avater" alt="" /> */}
                        <div className="upload-btn-wrapper ep-avatar__action">
                          <Link to="/addgallery">
                            <button className="btn theme-btn ep-avatar__btn">Change Avatar</button>
                          </Link>
                          {/* <button className="btn theme-btn">Change Avatar</button> */}
                          {/* <li><Link to="/addgallery"><i className="fas fa-images"></i> Gallery </Link></li> */}
                          {/* <input type="file" name="myfile" /> */}
                        </div>
                      </div>
                      <h3>Personal Information</h3>
                    </div>
                    <div className="ep-grid">
                      <div className="ep-field"> {/* Container Box for consistent size */}

                        <TextField label="Surname" name="fname"
                          value={formData.fname}
                          onChange={handleChange}
                          variant="outlined"
                          InputProps={{
                            readOnly: true, startAdornment: (<InputAdornment position="start"> <PersonIcon />
                            </InputAdornment>),
                          }} margin="normal" fullWidth />
                        {errors.fname && <span className="error">{errors.fname}</span>}
                      </div>
                      <div className="ep-field">

                        <TextField label="Name" name="lname" value={formData.lname} onChange={handleChange} variant="outlined" InputProps={{ readOnly: true, startAdornment: (<InputAdornment position="start"> <PersonIcon /> </InputAdornment>), }} margin="normal" fullWidth /> {errors.lname && <span className="error">{errors.lname}</span>}
                      </div>
                      <div className="ep-field">
                        {/* <label>Gender</label> <input type="text" className="form-control" value="Daniel Deve" /> */}
                        <TextField label="Gender" name="gender" value={formData.gender}
                          onChange={handleGenderChange} variant="outlined"
                          InputProps={{ readOnly: true, startAdornment: (<InputAdornment position="start"> <PersonIcon /> </InputAdornment>), }} margin="normal" fullWidth />

                        {errors.gender && <span className="error">{errors.gender}</span>}
                      </div>
                      <LocationCascade
                        variant="mui"
                        idPrefix="ep-pob"
                        fieldClassName="ep-field"
                        fullClassName="ep-field--full"
                        labels={{ country: "Place of birth: Country", state: "Place of birth: State", district: "Place of birth: District / City", stateText: "Place of birth: State / Province", cityText: "Place of birth: City", legacy: "Place of birth" }}
                        value={formData.pobLoc}
                        onChange={handlePobChange}
                        error={errors.pob}
                      />
                      <div className="ep-field">

                        {/* <label>DOB</label> <input type="text" name="" data-datedropper placeholder="Date of Birth" className="datedropper form-control" /> */}
                        <TextField name="dob"
                          label="Date of Birth"
                          variant="outlined"
                          type="text"
                          value={formData.dob} InputProps={{
                            readOnly: true

                          }}
                          margin="normal" fullWidth
                        />

                      </div>
                      <div className="ep-field">
                        {/* <label>TOB</label><input type="text" name="" data-datedropper placeholder="Time of Birth" className="datedropper form-control" /> */}
                        <TextField
                          name="tob"
                          value={formData.tob}
                          onChange={handleChange}
                          label="Time of Birth"
                          variant="outlined"
                          type="time"
                          InputProps={{// icon
                            readOnly: true,
                          }}
                          margin="normal" fullWidth
                        />
                      </div>

                      <div className="ep-field">
                        {/* <label>Caste</label><input type="text" className="form-control" value="" /> */}

                        <Autocomplete name="caste"
                          options={castes}
                          getOptionLabel={(option) => option}
                          value={formData.caste}
                          onChange={handleCasteChange}

                          // value={heightValue}
                          // onChange={(event, newValue) => setHeightValue(newValue)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Select Caste"
                              variant="outlined"
                              margin="normal"
                            />
                          )}
                        />

                        {errors.caste && <span className="error">{errors.caste}</span>}
                      </div>
                      <div className="ep-field">
                        <Autocomplete
                          options={MaritalStatus}
                          value={formData.maritalStatus}
                          onChange={handleMaritalStatusChange}
                          getOptionLabel={(option) => option}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Martial Status"
                              variant="outlined"
                              margin="normal"
                            />
                          )}
                        />

                        {errors.maritalStatus && <span className="error">{errors.maritalStatus}</span>}
                      </div>
                      <div className="ep-field">
                        {/* <label>Height</label> */}
                        <Autocomplete
                          options={heights}
                          getOptionLabel={(option) => option}
                          value={formData.height}
                          onChange={handleHeightChange}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Select Height"
                              variant="outlined"
                              margin="normal"
                            />
                          )}
                        />
                      </div>


                      <div className="ep-field ep-field--full">
                        {/* <label>About Yourself</label><textarea className="form-control" placeholder="Introduction"></textarea> */}
                        <TextField label="About yourself" name="about"
                          value={formData.about}
                          onChange={handleChange}
                          variant="outlined"
                          margin="normal" multiline rows={4} fullWidth />

                      </div>

                    </div>
                  </div>
                  {/* <!-- End General Information --> 
              
              <!-- Edit Location --> */}
                  <div className="ep-card">
                    <div className="ep-card__head"><i className="fas fa-star-and-crescent"></i>
                      <h3>Horoscope Details</h3>
                      <p>Ensure compatibility in marriage through detailed astrological analysis of birth charts.</p>
                    </div>

                    <div className="ep-grid">
                      <div className="ep-field">
                        {/* <label>Nakshtra</label><input type="text" className="form-control" value="Ardra" /> */}
                        <Autocomplete
                          options={RASI_LABELS}
                          getOptionLabel={(option) => option}
                          value={formData.rasi}
                          onChange={handleRasiChange}
                          // value={heightValue}
                          // onChange={(event, newValue) => setHeightValue(newValue)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Select Rasi"
                              variant="outlined"
                              margin="normal"
                            />
                          )}
                        />
                      </div>
                      <div className="ep-field">
                        {/* <label>Padam</label><input type="text" className="form-control" value="3" /> */}
                        <Autocomplete
                          options={nakshatrasFor(formData.rasi)}
                          getOptionLabel={(option) => option}
                          value={formData.nakshtra}
                          disabled={!formData.rasi}
                          onChange={handleNakshtraChange}

                          // value={heightValue}
                          // onChange={(event, newValue) => setHeightValue(newValue)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Select Nakshatram"
                              placeholder={formData.rasi ? "" : "Select Rasi first"}
                              variant="outlined"
                              margin="normal"
                            />
                          )}
                        />
                      </div>
                      <div className="ep-field">
                        {/* <label>Rasi</label><input type="text" className="form-control" value="Midhuna" /> */}
                        <Autocomplete
                          options={padasFor(formData.rasi, formData.nakshtra)}
                          getOptionLabel={(option) => option}
                          value={formData.padam}
                          disabled={!formData.nakshtra}
                          onChange={handlePadamChange}

                          // value={heightValue}
                          // onChange={(event, newValue) => setHeightValue(newValue)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Select Padam"
                              variant="outlined"
                              margin="normal"
                            />
                          )}
                        />
                        {horoHint && <span className="error">Please re-select your Nakshatra and Padam.</span>}
                      </div>
                      <div className="ep-field">
                        <TextField label="Gothram" name="gothram"
                          value={formData.gothram || ""}
                          onChange={handleChange}
                          variant="outlined" margin="normal" fullWidth
                          inputProps={{ maxLength: 100 }} />
                        {errors.gothram && <span className="error">{errors.gothram}</span>}
                      </div>


                    </div>

                  </div>
                  {/* <!-- End Edit Location --> 
              
              <!-- contact info --> */}
                  <div className="ep-card">
                    <div className="ep-card__head"><i className="fas fa-address-book"></i>
                      <h3>Contact Information</h3>
                    </div>
                    <div className="ep-grid">
                      <div className="ep-field">
                        {/* <label>Email</label> <input type="email" className="form-control" value="" placeholder="" /> */}
                        <TextField label="Email" name="email"
                          value={formData.email}
                          onChange={handleChange}
                          variant="outlined" InputProps={{
                            readOnly: true, startAdornment: (<InputAdornment position="start">
                              <EmailIcon /> </InputAdornment>),
                          }} margin="normal" fullWidth // Ensures the TextField takes full width of the Box 
                        />
                      </div>
                      <div className="ep-field">
                        {/* <label>Mobile Number</label><input type="text" className="form-control" value="" placeholder="9xxxxxxxx" /> */}
                        <TextField label="Mobile" name="mobile"
                          value={formData.mobile}
                          onChange={handleChange}
                          variant="outlined" InputProps={{
                            readOnly: true, startAdornment: (<InputAdornment position="start">
                              <PhoneIcon /> </InputAdornment>),
                          }} margin="normal" fullWidth // Ensures the TextField takes full width of the Box 
                        />
                      </div>
                      <div className="ep-field">
                        <TextField label="Alternate Phone Number" name="altPhone"
                          value={formData.altPhone || ""}
                          onChange={handleChange}
                          variant="outlined" InputProps={{
                            startAdornment: (<InputAdornment position="start">
                              <PhoneIcon /> </InputAdornment>),
                          }} inputProps={{ maxLength: 20, inputMode: 'tel' }} margin="normal" fullWidth />
                        {errors.altPhone && <span className="error">{errors.altPhone}</span>}
                      </div>
                    </div>
                  </div>
                  {/* <!-- End Social Background --> 
              <!-- Qualification And Career --> */}
                  <div className="ep-card">
                    <div className="ep-card__head"><i className="fas fa-graduation-cap"></i>
                      <h3>Educational and Professional Details</h3>
                    </div>
                    <div className="ep-grid">
                      <div className="ep-field">
                        <GroupedRadioSelect
                          variant="mui"
                          label="Highest Education"
                          title="Select Highest Education"
                          groups={EDUCATION_GROUPS}
                          value={formData.degree}
                          onChange={(v) => setFormData((prev) => ({ ...prev, degree: v }))}
                        />
                      </div>
                      <div className="ep-field">
                        <GroupedRadioSelect
                          variant="mui"
                          label="Profession"
                          title="Select Profession"
                          groups={JOB_GROUPS}
                          value={formData.profession}
                          onChange={(v) => setFormData((prev) => ({ ...prev, profession: v }))}
                        />
                      </div>
                      <div className="ep-field">
                        <TextField label="Education Detail" name="educationDetail"
                          value={formData.educationDetail || ""}
                          onChange={(e) => setFormData((prev) => ({ ...prev, educationDetail: e.target.value }))}
                          multiline minRows={2} variant="outlined" margin="normal" fullWidth
                          inputProps={{ maxLength: DETAIL_MAX }}
                          helperText={`${DETAIL_HELP} (${String(formData.educationDetail || "").length}/${DETAIL_MAX})`} />
                        {errors.educationDetail && <span className="error">{errors.educationDetail}</span>}
                      </div>
                      <div className="ep-field">
                        <TextField label="Job Detail" name="jobDetail"
                          value={formData.jobDetail || ""}
                          onChange={(e) => setFormData((prev) => ({ ...prev, jobDetail: e.target.value }))}
                          multiline minRows={2} variant="outlined" margin="normal" fullWidth
                          inputProps={{ maxLength: DETAIL_MAX }}
                          helperText={`${DETAIL_HELP} (${String(formData.jobDetail || "").length}/${DETAIL_MAX})`} />
                        {errors.jobDetail && <span className="error">{errors.jobDetail}</span>}
                      </div>


                      <LocationCascade
                        variant="mui"
                        idPrefix="ep-job"
                        fieldClassName="ep-field"
                        fullClassName="ep-field--full"
                        labels={{ country: "Job Country", state: "Job State", district: "Job City", stateText: "Job State / Province", cityText: "Job City", legacy: "Current Job Location" }}
                        legacyHint="Please re-select your job location."
                        value={formData.jobLegacy
                          ? { country: "", state: "", district: formData.jobLegacyText || "" }
                          : { country: formData.jobCountry, state: formData.jobState, district: formData.jobDistrict }}
                        onChange={handleJobLocationChange}
                      />
                      <div className="ep-field ep-field--salary"> <div className="ep-salary"> <div className="ep-salary__amount">
                        <TextField label="Salary" variant="outlined"
                          InputProps={{
                            readOnly: false, startAdornment: (<InputAdornment position="start">
                              <CurrencyRupeeIcon /> </InputAdornment>),
                          }} margin="normal" fullWidth
                          value={salaryNum} onChange={handleSalaryNumChange}
                        /> </div> <div className="ep-salary__unit"> {/* INR Autocomplete */} <Autocomplete options={inrOptions} getOptionLabel={(option) => option.label}
                          value={salaryUnits} onChange={handleSalaryUnitsChange}
                          renderInput={(params) => (<TextField {...params} label="INR per annum" variant="outlined" margin="normal" />)} /> </div>
                      </div>
                        <Typography variant="body1" component="div" gutterBottom sx={{ color: 'green' }} className="ep-salary__msg"> {salaryMessage} </Typography>
                      </div>
                    </div>
                  </div>
                  {/* <!-- End Qualification And Career --> 
              
              <!-- Physical Info --> */}
                  <div className="ep-card">
                    <div className="ep-card__head"><i className="fas fa-people-roof"></i>
                      <h3> Family Background</h3>
                    </div>
                    <div className="ep-grid">
                      <div className="ep-field">
                        <TextField name="fatherName" label="Father Name" value={formData.fatherName} onChange={handleChange} variant="outlined" margin="normal" fullWidth
                        />

                      </div>
                      <div className="ep-field">
                        {/* <label>Father Occupation</label> <input type="text" className="form-control" value="" placeholder="e.g. Web Designer" /> */}
                        <TextField name="fatherOccupation" label="Father Occupation"
                          value={formData.fatherOccupation || ""}
                          onChange={(e) => setFormData((prev) => ({ ...prev, fatherOccupation: e.target.value }))}
                          placeholder="e.g. Goldsmith, Teacher, Business"
                          inputProps={{ maxLength: 100 }}
                          variant="outlined" margin="normal" fullWidth
                        />
                      </div>
                      <div className="ep-field">
                        {/* <label>Mother Name</label> <input type="text" className="form-control" value="" placeholder="e.g. Web Designer" /> */}
                        <TextField name="motherName" label="Mother Name" value={formData.motherName} onChange={handleChange} variant="outlined" margin="normal" fullWidth // Ensures the TextField takes full width of the Box 
                        />
                      </div>
                      <div className="ep-field">
                        {/* <label>Mother Occupation</label> <input type="text" className="form-control" value="" placeholder="e.g. Web Designer" /> */}
                        <TextField name="motherOccupation" label="Mother Occupation"
                          value={formData.motherOccupation || ""}
                          onChange={(e) => setFormData((prev) => ({ ...prev, motherOccupation: e.target.value }))}
                          placeholder="e.g. Homemaker, Teacher"
                          inputProps={{ maxLength: 100 }}
                          variant="outlined" margin="normal" fullWidth
                        />
                      </div>
                      <div className="ep-field">
                        {/* <label>Brothers</label> <input type="text" className="form-control" value="" placeholder="e.g. Web Designer" /> */}
                        <TextField name="brothers" label="Brothers" value={formData.brothers} onChange={handleChange} variant="outlined"
                          type="number" inputProps={{ min: 0 }}
                          margin="normal" fullWidth
                        // value={maleSiblings}
                        // onChange={handleMaleSiblingsChange}
                        />
                      </div>
                      <div className="ep-field">
                        {/* <label>Married Brothers</label><input type="text" className="form-control" value="" placeholder="e.g. Web Designer" /> */}
                        <TextField name="brothersMarried" label="No. of Brothers Married"
                          value={formData.brothersMarried}
                          type="number" inputProps={{ min: 0 }}
                          onChange={handleChange} variant="outlined"
                          margin="normal" fullWidth
                        // value={maleSiblingsMarried}
                        // onChange={handleMaleSiblingsMarried} 
                        />
                      </div>
                      <div className="ep-field">
                        {/* <label>Sisters</label>  <input type="text" className="form-control" value="" placeholder="e.g. Web Designer" /> */}
                        <TextField name="sisters" label="Sisters" value={formData.sisters} onChange={handleChange} variant="outlined"
                          type="number" inputProps={{ min: 0 }}
                          margin="normal" fullWidth
                        // value={femaleSiblings}
                        // onChange={handleFemaleSiblingsChange} 
                        />
                      </div>
                      <div className="ep-field">
                        {/* <label>Married Sisters</label><input type="text" className="form-control" value="" placeholder="e.g. Web Designer" /> */}
                        <TextField name="sistersMarried" label="No. of Sisters Married"
                          value={formData.sistersMarried}
                          type="number" inputProps={{ min: 0 }}
                          onChange={handleChange} variant="outlined"
                          margin="normal" fullWidth
                        // value={femaleSiblingsMarried}
                        // onChange={handleFemaleSiblingsMarried} 
                        />
                      </div>
                      <LocationCascade
                        variant="mui"
                        idPrefix="ep-family"
                        fieldClassName="ep-field"
                        fullClassName="ep-field--full"
                        labels={{ country: "Family Residence: Country", state: "Family Residence: State", district: "Family Residence: District / City", stateText: "Family Residence: State / Province", cityText: "Family Residence: City", legacy: "Current Family Residence" }}
                        legacyHint="Please re-select your family location."
                        value={formData.familyLegacy
                          ? { country: "", state: "", district: formData.familyResidence || "" }
                          : { country: formData.familyCountry, state: formData.familyState, district: formData.familyDistrict }}
                        onChange={handleFamilyLocationChange}
                      />
                    </div>
                  </div>
                  {/* <!-- End Physical Info --> 
              
              <!-- Hobbies --> */}
                  <div className="ep-card">
                    <div className="ep-card__head"><i className="fas fa-leaf"></i>
                      <h3>Lifestyle Information</h3>
                    </div>
                    <div className="ep-grid">
                      <div className="ep-field">
                        <Autocomplete
                          value={formData.diet} onChange={handleDietChange}
                          options={diet}
                          getOptionLabel={(option) => option}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Select Diet"
                              variant="outlined"
                              margin="normal"
                            />
                          )} fullWidth
                        />
                      </div>
                      <div className="ep-field">
                        {/* <label>Smoking Habits</label> <input type="text" className="form-control" value="" placeholder="" /> */}
                        <Autocomplete
                          value={formData.habitsmoke} onChange={handleSmokeHabitsChange}
                          options={habitsOptions}
                          getOptionLabel={(option) => option}
                          // value={genderValue}
                          // onChange={handleGenderChange}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Smoking Habit"
                              variant="outlined"
                              margin="normal"
                            />
                          )}
                        />
                      </div>
                      <div className="ep-field">
                        {/* <label>Drinking Habits</label>  <input type="text" className="form-control" value="" placeholder="" /> */}
                        <Autocomplete
                          value={formData.habitdrink} onChange={handleDrinkHabitsChange}
                          options={habitsOptions}
                          getOptionLabel={(option) => option}
                          // value={genderValue}
                          // onChange={handleGenderChange}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Drinking Habit"
                              variant="outlined"
                              margin="normal"
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>
                  {/* <!-- End Hobbies --> 
              
              <!-- Social Background --> */}
                  <div className="ep-card">
                    <div className="ep-card__head"><i className="fas fa-heart"></i>
                      <h3>Preferences for Partner</h3>
                    </div>
                    <div className="ep-grid">
                      {/* <div className="ep-field">
                        <label>Preferred Age Range</label>
                        <input type="text" className="form-control" value="" placeholder="" />
                      </div>
                      <div className="ep-field">
                        <label>Preferred Height Range</label>
                        <input type="text" className="form-control" value="" placeholder="" />
                      </div>
                      <div className="ep-field">
                        <label>Preferred Education Level</label>
                        <input type="text" className="form-control" value="" placeholder="" />
                      </div> */}
                      <div className="ep-field ep-field--full">
                        {/* <label>Other Preferences (Specific qualities or hobbies desired in a partner)</label> */}
                        {/* <textarea className="form-control"></textarea> */}
                        <TextField name="partnerPreferences"
                          value={formData.partnerPreferences} onChange={handleChange}
                          label="Other Preferences (Specific qualities or hobbies desired in a partner)"
                          variant="outlined"
                          multiline
                          rows={4}
                          margin="normal"
                          fullWidth
                        />
                      </div>
                    </div>
                  </div>
                  {/* <!-- End Social Background --> 
              
              <!-- Life Style --> */}

                  {/* <!-- End Life Style --> 
              
              <!-- Full Information --> */}

                  <div className="ep-savebar">
                    <button className="sub ep-savebar__btn" title="Update Profile" disabled={saving}>{saving ? 'Saving...' : 'Update Profile'}</button>

                  </div>
                </div>
              </form>    </div>
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
    </>
  )
}

export default EditProfile