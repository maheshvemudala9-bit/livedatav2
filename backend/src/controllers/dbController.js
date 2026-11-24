 
const prepareDBData = require('../services/db');
const pool = require('../services/pool');
const { convertCredentials, verifyPassword, hashPassword } = require('../services/passwordfunction');
const {
  generateAccessToken,
  generateRefreshToken,
  accessCookieOptions,
  refreshCookieOptions
} = require('./tokenController');

const { processImage } = require('../services/imageService');
const contactAccess = require('../services/contactAccess');
const blocks = require('../services/blocks');
const locationFields = require('../services/locationFields');

// Generic text used for every "this user blocked you" case, so a blocked user
// cannot tell a block apart from a missing profile.
const NOT_AVAILABLE = 'This profile is not available.';
// The acting user is always req.user.uid. A different id in the body is rejected
// with 403 (same convention as chatController / proposalController).
// Returns true when it already sent the 403.
const rejectSpoofedId = (req, res, bodyId) => {
  if (bodyId != null && bodyId !== '' && Number(bodyId) !== Number(req.user.uid)) {
    res.status(403).json({ status: 'Failure', result: 'Not allowed.' });
    return true;
  }
  return false;
};

// true when `ownerUid` (the profile being requested) has blocked the viewer.
const ownerBlockedViewer = async (req, ownerUid) => {
  const viewerUid = req.user && req.user.uid;
  if (viewerUid == null || ownerUid == null) return false;
  if (Number(viewerUid) === Number(ownerUid)) return false;
  return blocks.isBlockedBy(ownerUid, viewerUid);
};
const EMPLOYED_IN = ['Government', 'Private', 'Defense', 'Self Employed', 'Business', 'Not Working'];
const SALARY_UNITS = ['Thousands', 'Lakhs', 'Crores']; // salary_amount is per annum in this unit
exports.register = async (req, res) => {
  try {
    const data = req.body;
    // Normalize email (case-insensitive) before storing. Non-email fields untouched.
    if (data.uemail != null) {
      data.uemail = String(data.uemail).trim().toLowerCase();
    }
    // Location text: type / length checked before the write; '' and Signup placeholders -> NULL.
    for (const [key, max] of [['ucountry', 100], ['ustate', 100], ['upresentloc', 100], ['upob', 300]]) {
      const c = locationFields.cleanLocField(locationFields.dropPlaceholder(data[key]), max);
      if (!c.ok) {
        return res.status(200).send(`${JSON.stringify({ status: 'Failure', result: `Location values must be text of ${max} characters or fewer.` })}`);
      }
      data[key] = c.value;
    }
    // Employment: values must come from the lists; missing -> NULL (older cached bundles still register).
    const failReg = (msg) => res.status(200).send(`${JSON.stringify({ status: 'Failure', result: msg })}`);
    const emp = data.employed_in == null ? '' : String(data.employed_in).trim();
    if (emp && !EMPLOYED_IN.includes(emp)) return failReg('Invalid employment type.');
    const unit = data.salary_unit == null ? '' : String(data.salary_unit).trim();
    if (unit && !SALARY_UNITS.includes(unit)) return failReg('Invalid salary unit.');
    const sal = data.salary_amount == null ? '' : String(data.salary_amount).trim();
    if (sal && (!/^\d+(\.\d{1,2})?$/.test(sal) || Number(sal) > 9999999999)) {
      return failReg('Salary must be a number of 0 or more.');
    }
    data.employed_in = emp || null;
    data.salary_unit = unit || null;
    data.salary_amount = sal === '' ? null : Number(sal);
    if (emp === 'Not Working') {
      data.ujob = 'Not Working';
      data.salary_amount = 0;
      data.upackage = 'NA';
    }
    let obj = await prepareDBData.register(data);
    if (!obj) {
      res.status(200).send(`${JSON.stringify({ status: 'Failure', result: 'Data Already Exists.' })}`);
    } else {
      res.status(200).send(`${JSON.stringify({ status: 'Success', result: 'Data Registered Successfully.' })}`);
    }
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
};

exports.login = async (req, res) => {
  try {
    const data    = req.body;
    // Identifier can be an email, mobile number, or Matrimony ID (MAT123).
    // Frontend still sends it in the `uemail` field; fall back to `identifier`.
    const identifier = data.uemail != null ? data.uemail : data.identifier;
    // Only lowercase email identifiers (contain "@"); leave phone/MAT ids as-is.
    const normIdentifier =
      typeof identifier === 'string' && identifier.includes('@')
        ? identifier.trim().toLowerCase()
        : identifier;
    const userobj = await prepareDBData.GetUserDetails(normIdentifier);

    if (!userobj || userobj.length === 0) {
      return res.status(200).json({ status: 'Failure', result: 'Data Does not Exists.' });
    }

    const accountStatus = userobj[0].status;

    if (accountStatus === 'Closed') {
      return res.status(200).json({
        status: 'Failure',
        result: 'This account has been closed. Please contact support.'
      });
    }

    if (accountStatus === 'Blocked') {
      return res.status(200).json({
        status: 'Failure',
        result: 'Your account has been blocked. Please contact support.'
      });
    }


    if (userobj[0].upassword === 'Closed') {
      return res.status(200).json({
        status: 'Failure',
        result: 'This account has been closed. Please contact support.'
      });
    }

    // Password is the only credential check — the identifier already selected
    // the correct user (by email / mobile / Matrimony ID). The old email-equality
    // guard was removed because it broke mobile / MAT-ID logins.
    // NOTE: return 200 (not 401) for a wrong password. A wrong password is an
    // expected login outcome, not an expired session — returning 401 here caused
    // the api.js refresh interceptor to swallow it and redirect, so the error
    // message never reached the login form.
    const result = await verifyPassword(data.upassword, userobj[0].upassword);
    if (!result.ok) {
      return res.status(200).json({ status: 'Failure', result: 'Invalid Credentials.' });
    }

    // Lazy migration: on a successful legacy (AES) match, re-hash the submitted
    // plaintext with bcrypt and persist it. Never block/fail login if this errors.
    if (result.legacy) {
      try {
        const newHash = await hashPassword(data.upassword);
        await prepareDBData.updateUserPasswordById(userobj[0].uid, newHash);
      } catch (e) {
        console.warn('Lazy password migration failed for uid', userobj[0].uid, e.message);
      }
    }

    const tokenPayload = {
      uid:     userobj[0].uid,
      uemail:  userobj[0].uemail,
      ugender: userobj[0].ugender
    };

    const accessToken  = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);


    res.cookie('accessToken',  accessToken,  accessCookieOptions);
    res.cookie('refreshToken', refreshToken, refreshCookieOptions);

 
    return res.status(200).json({
      status: 'Success',
      result: 'Login Successfully.',
      data: {
        userId:     userobj[0].uid,
        userGender: userobj[0].ugender
   
      }
    });

  } catch (error) {
    res.status(500).json({ status: 'Failure', result: error.message });
  }
};


exports.getUserById = async (req, res) => {
  try {
    const data = req.body;
    if (await ownerBlockedViewer(req, data.id)) {
      return res.status(200).json({ status: 'Failure', result: NOT_AVAILABLE });
    }
    let user   = await prepareDBData.GetUserById(data.id);
    if (!user) {
      res.status(200).send(`${JSON.stringify({ status: 'Failure', result: 'No User Found.' })}`);
    } else {
      const viewerUid = req.user && req.user.uid;
      const safe = Array.isArray(user)
        ? user.map((row) => contactAccess.sanitizeUserRow(row, viewerUid, row.uid))
        : user;
      res.status(200).send(safe);
    }
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
};


// Loads the viewer once and returns { viewer: {paid, membershipType}, annotate(row) }.
// annotate() adds the tier-only `contactLock` and strips membership_type /
// payment_status / marriage_status (computed server-side, never trusted from the client).
async function buildListLockContext(viewerUid) {
  const me = viewerUid != null ? await prepareDBData.getUserMobile(Number(viewerUid)) : null;
  const viewerRow = me || { uid: viewerUid != null ? Number(viewerUid) : null };
  const membershipType = contactAccess.MEMBERSHIP_TYPES.includes(viewerRow.membership_type)
    ? viewerRow.membership_type
    : 'Gold';
  return {
    viewer: { paid: viewerRow.payment_status === 'Paid', membershipType },
    annotate: (row) => {
      const out = { ...row, contactLock: contactAccess.tierContactLock(viewerRow, row) };
      delete out.membership_type;
      delete out.payment_status;
      delete out.marriage_status;
      return out;
    }
  };
}

exports.getAllUsers = async (req, res) => {
  try {
    const page   = parseInt(req.query.page,  10) || 1;
    const limit  = parseInt(req.query.limit, 10) || 20;
    const gender = req.query.gender || null;

    const result = await prepareDBData.GetAllUsers(page, limit, gender, req.user && req.user.uid);
    const ctx = await buildListLockContext(req.user && req.user.uid);

    if (!result || !result.rows || result.rows.length === 0) {
      return res.status(200).json({ status: 'Success', data: [], total: 0, page, limit, viewer: ctx.viewer });
    }

    return res.status(200).json({
      status: 'Success',
      data:   result.rows.map((row) => contactAccess.sanitizeUserRow(ctx.annotate(row), req.user && req.user.uid, row.uid)),
      total:  result.total,
      page,
      limit,
      viewer: ctx.viewer
    });
  } catch (error) {
    res.status(500).json({ status: 'Failure', error: error.message });
  }
};



exports.uploadProfileImages = async (req, res) => {
  try {
    const { gallery } = req.body;
 
    if (!gallery) {
      return res.status(400).json({ status: 'Failure', result: 'No gallery data provided.' });
    }
 
    const items   = JSON.parse(gallery);
    const userId  = req.user.uid;
    const processed = [];
 
    for (const item of items) {
      // item.imagepath is a base64 string from frontend
      const paths = await processImage(item.imagepath, userId);
 
      processed.push({
        imagepath:        paths.original,  // full size
        imagepath_medium: paths.medium,    // 600×800
        imagepath_thumb:  paths.thumb,     // 150×150
        isprofile:        item.isprofile || false,
        userid:           userId,
        updateddate:      item.updateddate || new Date().toISOString().split('T')[0]
      });
    }
 
    // Save all 3 paths per image to DB
    const savedList = JSON.stringify(processed);
    const result    = await prepareDBData.SaveUserGallery(savedList);
 
    return res.status(200).json({
      status: 'Success',
      result: 'Images uploaded successfully.',
      data:   result
    });
 
  } catch (error) {
    console.error('uploadProfileImages error:', error);
    res.status(500).json({ status: 'Failure', result: error.message });
  }
};

exports.DeleteUserGalleryRecord = async (req, res) => {
  try {
    // Owner comes from the authenticated token, never from the request body.
    const { id } = req.body;
    const uid = req.user && req.user.uid;
    if (!id || !uid) {
      return res.status(400).json({ status: 'Failure', result: 'Gallery record id is required.' });
    }
    const result = await prepareDBData.DeleteUserGalleryRecord(Number(id), Number(uid));
    if (!result.success) {
      return res.status(400).json({ status: 'Failure', result: result.message });
    }
    return res.status(200).json({ status: 'Success', result: result.message, deletedId: result.deletedId });
  } catch (error) {
    res.status(500).json({ status: 'Failure', result: error.message });
  }
};

// ─── Update User Records ──────────────────────────────────────────────────────
exports.updateUserRecords = async (req, res) => {
  try {
    const data      = req.body;
    const fail = (msg) => res.status(200).send(`${JSON.stringify({ status: 'Failure', result: msg })}`);

    // The target user is ALWAYS the authenticated user. A different uid in the body is rejected.
    if (rejectSpoofedId(req, res, data.uid != null && data.uid !== '' ? data.uid : data.user_id)) return;
    data.uid = Number(req.user.uid);

    // Gothram: optional free text, trimmed, max 100 chars (rejected if longer).
    // Key omitted (undefined) = keep the stored value; explicit "" / null clears it.
    if (data.gothram !== undefined && data.gothram !== null && typeof data.gothram !== 'string') {
      return fail('Gothram must be text.');
    }
    const gothramProvided = data.gothram !== undefined;
    data.gothram = typeof data.gothram === 'string' ? data.gothram.trim() : '';
    if (data.gothram.length > 100) return fail('Gothram must be 100 characters or fewer.');
    if (data.gothram === '') data.gothram = null;

    // Education Detail / Job Detail: optional free text, trimmed, max 200 chars (rejected if longer).
    // Key omitted (undefined) = keep the stored value; explicit "" / null clears it (NULL).
    // Validated here, before any write.
    const detailFields = [
      ['educationDetail', 'Education Detail'],
      ['jobDetail', 'Job Detail'],
    ];
    const detailProvided = {};
    for (const [key, label] of detailFields) {
      const v = data[key];
      if (v !== undefined && v !== null && typeof v !== 'string') return fail(`${label} must be text.`);
      detailProvided[key] = v !== undefined;
      const t = typeof v === 'string' ? v.trim() : '';
      if (t.length > 200) return fail(`${label} must be 200 characters or fewer.`);
      data[key] = t === '' ? null : t;
    }

    // Family Background location (country / state / district). Any key present = overwrite all three;
    // none present = keep the stored columns. Each part max 100 chars.
    const famKeys = ['familyCountry', 'familyState', 'familyDistrict'];
    const familyProvided = famKeys.some((k) => data[k] !== undefined);
    for (const k of famKeys) {
      const c = locationFields.cleanLocField(data[k], 100);
      if (!c.ok) return fail('Family location values must be text of 100 characters or fewer.');
      data[k] = c.value;
    }
    if (data.familyResidence !== undefined && data.familyResidence !== null) {
      const c = locationFields.cleanLocField(data.familyResidence, 300);
      if (!c.ok) return fail('Family residence must be text of 300 characters or fewer.');
      data.familyResidence = c.value;
    }

    // Job location (country / state / district). Any key present = overwrite all three and rebuild the
    // readable userdetails.jobcity text ("City, State, Country"); none present = keep stored values.
    // '' -> NULL. Each part max 100 chars. The client's own jobCity value is never trusted.
    const jobLocKeys = ['jobCountry', 'jobState', 'jobDistrict'];
    const jobLocProvided = jobLocKeys.some((k) => data[k] !== undefined);
    for (const k of jobLocKeys) {
      const c = locationFields.cleanLocField(data[k], 100);
      if (!c.ok) return fail('Job location values must be text of 100 characters or fewer.');
      data[k] = c.value;
    }
    data.jobCity = jobLocProvided
      ? ([data.jobDistrict, data.jobState, data.jobCountry].filter(Boolean).join(', ') || null)
      : undefined;

    // Alternate phone (optional, own account only: uid comes from the auth token).
    let altPhone;                       // undefined = leave unchanged
    if (data.ualtphone !== undefined) {
      const norm = contactAccess.normalizeAltPhone(data.ualtphone);
      if (!norm.ok) return fail(norm.error);
      altPhone = norm.value;
      if (altPhone !== null) {
        const me = await prepareDBData.getUserMobile(Number(req.user.uid));
        const strip = (p) => String(p || '').replace(/[\s-]/g, '').replace(/^\+/, '');
        if (me && strip(me.uphone) === strip(altPhone)) {
          return fail('Alternate phone number must be different from your primary number.');
        }
      }
    }
    delete data.ualtphone;

    // Both writes (userdetails + alternate phone) run in one transaction.
    try {
      await prepareDBData.SaveUserProfileTx(data.uid, data, altPhone, gothramProvided, {
        eduProvided: detailProvided.educationDetail,
        jobProvided: detailProvided.jobDetail,
        familyProvided,
        jobLocProvided,
      });
    } catch (txError) {
      console.error('updateUserRecords save failed:', txError.message);
      return fail('Records not Saved. Please check data once..');
    }
    res.status(200).send(`${JSON.stringify({ status: 'Success', userdetials: data, result: 'User Details Updated Successfully.' })}`);
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
};

// ─── Fetch All User Details ───────────────────────────────────────────────────
exports.FetchAllUserDetails = async (req, res) => {
  try {
    const data      = req.body;
    if (await ownerBlockedViewer(req, data.uid)) {
      return res.status(200).json({ status: 'Failure', result: NOT_AVAILABLE });
    }
    let userGallery = await prepareDBData.FetchAllUserDetails(data.uid);
    if (!userGallery) {
      res.status(200).send(`${JSON.stringify({ status: 'Failure', result: 'No details Found.' })}`);
    } else {
      const row = userGallery[0];
      if (!row) {
        return res.status(200).send(userGallery[0]);
      }
      const viewerUid = req.user && req.user.uid;
      const safe = contactAccess.sanitizeUserRow(row, viewerUid, data.uid);
      const isOwner = viewerUid != null && Number(viewerUid) === Number(data.uid);
      if (!isOwner) {
        const viewer = viewerUid != null ? await prepareDBData.getUserMobile(Number(viewerUid)) : null;
        const owner = await prepareDBData.getUserMobile(Number(data.uid));
        const access = contactAccess.canViewContact(viewer || { uid: null }, owner || { uid: Number(data.uid) });
        Object.assign(safe, contactAccess.buildContactAccessPayload(access, row.marriage_status));
      }
      res.status(200).send(safe);
    }
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
};

// ─── Fetch List Data ──────────────────────────────────────────────────────────
exports.Fetchlistdata = async (req, res) => {
  try {
    const {
      gender, ageFrom, ageTo, maritalStatus,
      heightFrom, heightTo, country, state, city,
      caste, education, occupation, annualIncome,
      workingLocation, membershipType, withPhoto, page = 1, limit = 20
    } = req.body;

    const result = await prepareDBData.Fetchlistdata({
      gender, ageFrom, ageTo, maritalStatus,
      heightFrom, heightTo, country, state, city,
      caste, education, occupation, annualIncome,
      workingLocation, membershipType, withPhoto,
      viewerUid: req.user && req.user.uid,
      page:  Number(page)  || 1,
      limit: Number(limit) || 20
    });

    const ctx = await buildListLockContext(req.user && req.user.uid);

    if (!result || !result.rows || result.rows.length === 0) {
      return res.status(200).json({ status: 'Success', data: [], total: 0, page: Number(page), limit: Number(limit), viewer: ctx.viewer });
    }

    return res.status(200).json({
      status: 'Success',
      data:   result.rows.map(ctx.annotate),
      total:  result.total,
      page:   Number(page),
      limit:  Number(limit),
      viewer: ctx.viewer
    });
  } catch (error) {
    res.status(500).json({ status: 'Failure', error: error.message });
  }
};

// ─── Get User Records ─────────────────────────────────────────────────────────
exports.getUserRecords = async (req, res) => {
  try {
    let userdetails = await prepareDBData.getAllUserDetails(req.user && req.user.uid);
    if (!userdetails) {
      res.status(200).send(`${JSON.stringify({ status: 'Failure', result: 'No details Found.' })}`);
    } else {
      res.status(200).send(userdetails);
    }
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
};

// ─── Update User Registration Details ────────────────────────────────────────
exports.UpdateUserRegistrationDetails = async (req, res) => {
  try {
    const data = req.body;
    if (rejectSpoofedId(req, res, data.uid)) return;
    data.uid = Number(req.user.uid);
    // Location text: type / length checked before the write; '' -> NULL.
    // Present location (country / state / city): key omitted = keep the stored value (Edit Profile no
    // longer sends them). The flags are set here, never taken from the client.
    data.countryProvided = data.country !== undefined;
    data.stateProvided = data.state !== undefined;
    data.cityProvided = data.city !== undefined;
    for (const [key, max] of [['country', 100], ['state', 100], ['city', 100], ['pob', 300]]) {
      const c = locationFields.cleanLocField(locationFields.dropPlaceholder(data[key]), max);
      if (!c.ok) {
        return res.status(200).send(`data: ${JSON.stringify({ status: 'fail', result: `Location values must be text of ${max} characters or fewer.` })}`);
      }
      data[key] = c.value;
    }
    let result = await prepareDBData.UpdateUserRegistrationDetails(data);
    if (result) {
      res.status(200).send(`data: ${JSON.stringify({ status: 'ok', result: 'User Details Updated Successfully.', userdetials: data })}`);
    } else {
      res.status(200).send(`data: ${JSON.stringify({ status: 'fail', result: 'Records not Saved. Please check data once..' })}`);
    }
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
};

// ─── Update User Profile Status ───────────────────────────────────────────────
exports.updateUserProfileStatus = async (req, res) => {
  try {
    const { id } = req.body;
    let result   = await prepareDBData.updateUserProfileStatus(id, req.user.uid);
    if (result.forbidden) {
      return res.status(403).send({ status: 'Failure', result: 'Not allowed.' });
    }
    if (result.success) {
      res.status(200).send({ status: 'ok',   result: result.message, userdetials: { id } });
    } else {
      res.status(200).send({ status: 'fail', result: result.message });
    }
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
};

// ─── Get Public Profile (no auth needed) ─────────────────────────────────────
exports.getPublicProfile = async (req, res) => {
  try {
    const { uid } = req.body;
    if (!uid) {
      return res.status(400).json({ status: 'Failure', result: 'uid is required.' });
    }
    if (await ownerBlockedViewer(req, uid)) {
      return res.status(200).json({ status: 'Failure', result: NOT_AVAILABLE });
    }
    const data = await prepareDBData.getPublicProfile(uid);
    if (!data) {
      return res.status(200).json({ status: 'Failure', result: 'Profile not found.' });
    }
    const extra = { marriageSettled: data.marriage_status === 'Marriage Settled' };
    const viewerUid = req.user && req.user.uid;
    if (viewerUid != null && Number(viewerUid) !== Number(uid)) {
      const viewer = await prepareDBData.getUserMobile(Number(viewerUid));
      const owner = await prepareDBData.getUserMobile(Number(uid));
      const access = contactAccess.canViewContact(viewer || { uid: null }, owner || { uid: Number(uid) });
      Object.assign(extra, contactAccess.buildContactAccessPayload(access, data.marriage_status));
    }
    return res.status(200).json({ status: 'Success', data, ...extra });
  } catch (error) {
    res.status(500).json({ status: 'Failure', result: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const uid = req.user.uid; // from auth cookie middleware

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 'Failure',
        result: 'Current password and new password are required.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        status: 'Failure',
        result: 'New password must be at least 6 characters.'
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        status: 'Failure',
        result: 'New password must be different from current password.'
      });
    }

    // Get current encrypted password from DB
    const userRecord = await prepareDBData.getUserPassword(uid);
    if (!userRecord) {
      return res.status(404).json({ status: 'Failure', result: 'User not found.' });
    }

    // Decrypt and validate current password
    const decrypted = await convertCredentials([{ upassword: userRecord.upassword }], false);
    if (decrypted !== currentPassword) {
      return res.status(200).json({
        status: 'Failure',
        result: 'Current password is incorrect.'
      });
    }

    // Encrypt new password using same encryption
    const encrypted = await convertCredentials({ upassword: newPassword }, true);

    // Update in DB
    const updated = await prepareDBData.updateUserPassword(uid, encrypted);
    if (!updated) {
      return res.status(500).json({ status: 'Failure', result: 'Failed to update password.' });
    }

    return res.status(200).json({
      status: 'Success',
      result: 'Password updated successfully.'
    });

  } catch (error) {
    console.error('changePassword error:', error);
    res.status(500).json({ status: 'Failure', result: error.message });
  }
};

// ─── Close Account ────────────────────────────────────────────────────────────
// POST /api/closeAccount
// uid taken from HttpOnly cookie (req.user.uid)
exports.closeAccount = async (req, res) => {
  try {
    const uid = req.user.uid; // from auth middleware

    const closed = await prepareDBData.closeAccount(uid);
    if (!closed) {
      return res.status(404).json({ status: 'Failure', result: 'User not found.' });
    }

    // Clear cookies — force logout after closing
    res.clearCookie('accessToken',  { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
    res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });

    return res.status(200).json({
      status: 'Success',
      result: 'Account closed successfully.'
    });
  } catch (error) {
    console.error('closeAccount error:', error);
    res.status(500).json({ status: 'Failure', result: error.message });
  }
};

// ─── Reset Password (Forgot Password flow) ────────────────────────────────────
// POST /api/resetPassword
// Body: { email, newPassword }
// Public route — no auth needed (user is not logged in)
exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        status: 'Failure',
        result: 'Email and new password are required.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        status: 'Failure',
        result: 'Password must be at least 6 characters.'
      });
    }

    // Normalize email (case-insensitive) for lookup and update.
    const normEmail = String(email || '').trim().toLowerCase();

    // Check email exists
    const userobj = await prepareDBData.GetUserDetails(normEmail);
    if (!userobj || userobj.length === 0) {
      return res.status(200).json({
        status: 'Failure',
        result: 'No account found with this email.'
      });
    }

    // Check account not closed/blocked
    if (userobj[0].status === 'Closed' || userobj[0].status === 'Blocked') {
      return res.status(200).json({
        status: 'Failure',
        result: 'This account is not active. Please contact support.'
      });
    }

    // Encrypt new password using same encryption as signup
    const encrypted = await convertCredentials({ upassword: newPassword }, true);

    // Update password in DB
    const updated = await prepareDBData.updatePasswordByEmail(normEmail, encrypted);
    if (!updated) {
      return res.status(500).json({
        status: 'Failure',
        result: 'Failed to reset password. Please try again.'
      });
    }

    return res.status(200).json({
      status: 'Success',
      result: 'Password reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    console.error('resetPassword error:', error);
    res.status(500).json({ status: 'Failure', result: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADD to controllers/dbController.js
// ─────────────────────────────────────────────────────────────────────────────

// ─── 1. getPrivacySettings ────────────────────────────────────────────────────
// GET /api/getPrivacySettings  — auth protected
// uid comes from HttpOnly cookie via req.user.uid
exports.getPrivacySettings = async (req, res) => {
  try {
    const uid = req.user.uid;

    const data = await prepareDBData.getPrivacySettings(uid);
    if (!data) {
      return res.status(404).json({ status: 'Failure', result: 'User not found.' });
    }

    return res.status(200).json({
      status: 'Success',
      data: {
        hide_email:   data.hide_email,
        hide_phone:   data.hide_phone,
        hide_gallery: data.hide_gallery,
        hide_picture: data.hide_picture
      }
    });
  } catch (error) {
    console.error('getPrivacySettings controller error:', error);
    res.status(500).json({ status: 'Failure', result: error.message });
  }
};

// ─── 2. updatePrivacySettings ─────────────────────────────────────────────────
// POST /api/updatePrivacySettings  — auth protected
// Body: { hide_email, hide_phone, hide_gallery, hide_picture }
exports.updatePrivacySettings = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { hide_email, hide_phone, hide_gallery, hide_picture } = req.body;

    // Validate all 4 are boolean
    if (
      typeof hide_email   !== 'boolean' ||
      typeof hide_phone   !== 'boolean' ||
      typeof hide_gallery !== 'boolean' ||
      typeof hide_picture !== 'boolean'
    ) {
      return res.status(400).json({
        status: 'Failure',
        result: 'All privacy fields must be boolean values.'
      });
    }

    const updated = await prepareDBData.updatePrivacySettings(
      uid, hide_email, hide_phone, hide_gallery, hide_picture
    );

    if (!updated) {
      return res.status(404).json({ status: 'Failure', result: 'User not found.' });
    }

    return res.status(200).json({
      status: 'Success',
      result: 'Privacy settings updated successfully.',
      data: {
        hide_email:   updated.hide_email,
        hide_phone:   updated.hide_phone,
        hide_gallery: updated.hide_gallery,
        hide_picture: updated.hide_picture
      }
    });
  } catch (error) {
    console.error('updatePrivacySettings controller error:', error);
    res.status(500).json({ status: 'Failure', result: error.message });
  }
};

// ─── 3. REPLACE existing getUserMobile ────────────────────────────────────────
// Find exports.getUserMobile in dbController.js and replace entirely with this:
exports.getUserMobile = async (req, res) => {
  try {
    const { uid } = req.body;
    const requesterId = req.user.uid;

    if (!uid) {
      return res.status(400).json({ status: 'Failure', result: 'uid is required.' });
    }

    const data = await prepareDBData.getUserMobile(Number(uid));
    if (!data) {
      return res.status(200).json({ status: 'Failure', result: 'User not found.' });
    }

    // Owner always sees their own contact info — no rules/limits apply.
    const isOwner = Number(requesterId) === Number(uid);

    const buildPayload = () => ({
      uid:    data.uid,
      uphone: isOwner || !data.hide_phone ? data.uphone : null,
      ualtphone: isOwner || !data.hide_phone ? data.ualtphone : null,
      uemail: isOwner || !data.hide_email ? data.uemail : null,
      hide_phone: data.hide_phone,
      hide_email: data.hide_email
    });

    if (isOwner) {
      return res.status(200).json({ status: 'Success', data: buildPayload() });
    }

    // ── Block checks (before any limit / recordContactView) ────────────────
    const rel = await blocks.blockedRelationship(requesterId, uid);
    if (rel.blockedMe) {
      return res.status(200).json({ status: 'Failure', result: NOT_AVAILABLE });
    }
    if (rel.iBlocked) {
      return res.status(200).json({
        status: 'Failure',
        reason: 'you_blocked',
        result: 'Unblock this user to view contact details.'
      });
    }

    // ── Payment / membership / marriage-status gate ────────────────────────
    // Checked before the hide_phone rule, the daily limit and recordContactView,
    // so a denial never consumes a contact view. Denial withholds phone + email.
    const requester = await prepareDBData.getUserMobile(Number(requesterId));
    if (!requester) {
      return res.status(200).json({ status: 'Failure', result: 'User not found.' });
    }
    const access = contactAccess.canViewContact(requester, data);
    const accessPayload = contactAccess.buildContactAccessPayload(access, data.marriage_status);
    if (!access.allowed) {
      return res.status(200).json({
        status: 'Failure',
        reason: access.reason,
        result: contactAccess.MESSAGES[access.reason],
        ...accessPayload
      });
    }

    // ── Rule 3: Hidden-contact rule ────────────────────────────────────────
    // A user who hides their OWN phone cannot view others' contact numbers.
    if (requester.hide_phone) {
      return res.status(200).json({
        status: 'Failure',
        reason: 'contact_hidden',
        result: "Your contact number is in hidden mode, so you can't view other members' contact numbers. Make your number public in Profile Security to view contact details."
      });
    }

    // ── Rules 1 & 2: Daily limit (value read from DB settings) ─────────────
    // Re-viewing a profile already unlocked today is free and does not count.
    const alreadyViewed = await prepareDBData.hasViewedContactToday(Number(requesterId), Number(uid));

    if (!alreadyViewed) {
      const limit = await prepareDBData.getNumericSetting('daily_contact_view_limit', 5);
      const usedToday = await prepareDBData.getTodayContactViewCount(Number(requesterId));

      if (usedToday >= limit) {
        return res.status(200).json({
          status: 'Failure',
          reason: 'daily_limit_reached',
          limit,
          result: `You have reached your daily limit of ${limit} contact views. Your limit will be renewed tomorrow, so please come back then to view more contact numbers.`
        });
      }

      // Record this new view (counts toward today's limit).
      await prepareDBData.recordContactView(Number(requesterId), Number(uid));
    }

    return res.status(200).json({ status: 'Success', data: buildPayload(), ...accessPayload });
  } catch (error) {
    res.status(500).json({ status: 'Failure', result: error.message });
  }
};

// ─── 4. REPLACE existing GetUserGallery ───────────────────────────────────────
// Find exports.GetUserGallery in dbController.js and replace with this:
exports.GetUserGallery = async (req, res) => {
  try {
    const { uid }       = req.body;
    // requesterId may be null for public/unauthenticated calls
    const requesterId   = req.user ? req.user.uid : null;

    if (!uid) {
      return res.status(400).json({ status: 'Failure', result: 'uid is required.' });
    }

    // The owner blocked the requester: return an empty gallery (array shape kept).
    if (await ownerBlockedViewer(req, uid)) {
      return res.status(200).json([]);
    }

    const data = await prepareDBData.GetUserGallery(Number(uid), requesterId);

    return res.status(200).json(data);
  } catch (error) {
    console.error('GetUserGallery controller error:', error);
    res.status(500).json({ status: 'Failure', result: error.message });
  }
};

// ─── My package (dashboard "Your Current Package" card) ──────────────────────
// Read-only. The user is ALWAYS req.user.uid. Payment status is not returned.
// Limit + "used today" use the same helpers/day boundary as getUserMobile's
// daily-limit enforcement (app_settings 'daily_contact_view_limit', default 5;
// contact_views.viewed_on = CURRENT_DATE).
exports.getMyPackage = async (req, res) => {
  try {
    const uid = Number(req.user.uid);
    const me = await prepareDBData.getUserMobile(uid);
    if (!me) {
      return res.status(200).json({ status: 'Failure', result: 'User not found.' });
    }
    const membershipType = contactAccess.MEMBERSHIP_TYPES.includes(me.membership_type)
      ? me.membership_type
      : 'Gold';
    const contactLimitPerDay = await prepareDBData.getNumericSetting('daily_contact_view_limit', 5);
    const contactsUsedToday = await prepareDBData.getTodayContactViewCount(uid);
    return res.status(200).json({
      status: 'Success',
      data: { membershipType, contactLimitPerDay, contactsUsedToday, paid: me.payment_status === 'Paid' }
    });
  } catch (error) {
    console.error('getMyPackage error:', error.message);
    return res.status(500).json({ status: 'Failure', result: 'Could not load package.' });
  }
};

// ─── Block / Unblock ──────────────────────────────────────────────────────────
// The acting user is ALWAYS req.user.uid; a uid in the body is never trusted.
exports.blockUser = async (req, res) => {
  try {
    const target = blocks.toUid(req.body && req.body.targetUid);
    if (!target) {
      return res.status(400).json({ status: 'Failure', result: 'targetUid is required.' });
    }
    const r = await blocks.blockUser(req.user.uid, target);
    if (!r.success) {
      return res.status(200).json({ status: 'Failure', result: r.message });
    }
    return res.status(200).json({ status: 'Success', result: r.message, data: { iBlocked: true } });
  } catch (error) {
    console.error('blockUser error:', error);
    res.status(500).json({ status: 'Failure', result: error.message });
  }
};

exports.unblockUser = async (req, res) => {
  try {
    const target = blocks.toUid(req.body && req.body.targetUid);
    if (!target) {
      return res.status(400).json({ status: 'Failure', result: 'targetUid is required.' });
    }
    const r = await blocks.unblockUser(req.user.uid, target);
    return res.status(200).json({ status: 'Success', result: r.message, data: { iBlocked: false } });
  } catch (error) {
    console.error('unblockUser error:', error);
    res.status(500).json({ status: 'Failure', result: error.message });
  }
};

exports.getBlockStatus = async (req, res) => {
  try {
    const target = blocks.toUid(req.body && req.body.targetUid);
    if (!target) {
      return res.status(400).json({ status: 'Failure', result: 'targetUid is required.' });
    }
    const rel = Number(req.user.uid) === target
      ? { iBlocked: false, blockedMe: false }
      : await blocks.blockedRelationship(req.user.uid, target);
    return res.status(200).json({ status: 'Success', data: rel });
  } catch (error) {
    console.error('getBlockStatus error:', error);
    res.status(500).json({ status: 'Failure', result: error.message });
  }
};

// ─── Impersonation Exchange (shadow login) ────────────────────────────────────
// POST /api/impersonate/exchange  — PUBLIC, token-gated (no auth cookie needed).
// Exchanges a single-use, short-lived admin-issued impersonation token for REAL
// user access/refresh cookies, so an admin clicking a MAT-id opens that user's
// session in a new tab. The admin creates the token via POST /api/adminhub/impersonate.
//
// SAME-BROWSER COOKIE CAVEAT: user cookies (accessToken/refreshToken) and the
// admin cookie (adminToken) have different names and coexist, so this does NOT
// clear the admin session. BUT cookies are per-origin (not per-tab): if the
// admin already had a personal USER session in this browser, this exchange
// OVERWRITES those user cookies in every tab of the origin. That is expected for
// the admin workflow — there is no per-tab isolation.
exports.impersonateExchange = async (req, res) => {
  const client = await pool.connect();
  try {
    const token = req.body ? req.body.token : undefined;

    // Request-boundary validation: token must be a non-empty string that fits
    // the varchar(128) column. Anything else is an expected bad input → 200 Failure.
    if (typeof token !== 'string' || token.length < 1 || token.length > 128) {
      return res.status(200).json({ status: 'Failure', result: 'Invalid or expired token.' });
    }

    // Look up the token row.
    const tokenRes = await client.query(
      'SELECT token, uid, used, expires_at FROM admin_impersonation_tokens WHERE token = $1',
      [token]
    );
    const row = tokenRes.rows[0];
    if (!row || row.used === true || new Date(row.expires_at) < new Date()) {
      return res.status(200).json({ status: 'Failure', result: 'Invalid or expired token.' });
    }

    // Atomic single-use consume: `AND used = false` + RETURNING guarantees exactly
    // one consumer even under a double-submit race.
    const consumeRes = await client.query(
      'UPDATE admin_impersonation_tokens SET used = true WHERE token = $1 AND used = false RETURNING uid',
      [token]
    );
    if (consumeRes.rows.length === 0) {
      return res.status(200).json({ status: 'Failure', result: 'Invalid or expired token.' });
    }
    const uid = consumeRes.rows[0].uid;

    // Load the user. Mirror the user-login status guard exactly: Closed/Blocked
    // are refused; Pending is an admin-only label with no auth effect (allowed).
    const userRes = await client.query(
      'SELECT uid, uemail, ugender, status FROM users WHERE uid = $1',
      [uid]
    );
    const user = userRes.rows[0];
    if (!user) {
      return res.status(200).json({ status: 'Failure', result: 'Invalid or expired token.' });
    }
    if (user.status === 'Closed' || user.status === 'Blocked') {
      return res.status(200).json({ status: 'Failure', result: 'This account is not active. Please contact support.' });
    }

    const tokenPayload = {
      uid:     user.uid,
      uemail:  user.uemail,
      ugender: user.ugender
    };

    const accessToken  = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    res.cookie('accessToken',  accessToken,  accessCookieOptions);
    res.cookie('refreshToken', refreshToken, refreshCookieOptions);

    return res.status(200).json({
      status: 'Success',
      result: 'Login Successfully.',
      data: {
        userId:     user.uid,
        userGender: user.ugender
      }
    });
  } catch (error) {
    console.error('impersonateExchange error:', error);
    res.status(500).json({ status: 'Failure', result: error.message });
  } finally {
    client.release();
  }
};