// Location data for the country > state > district cascade (Edit Profile, Signup, Family Background).
//
// SOURCES (fetched 2026-11-23 via GitHub raw; no values typed from memory):
//  - Indian states / UTs / districts: https://github.com/KTBsomen/Indian-state-district-json
//    (india-states-districts-latest.json), cross-checked against
//    https://github.com/sanjaynishad/Indian-States-And-Districts (dist/Indian-states-districts.json).
//    Both datasets agree except Odisha, where the second source's common English spellings are used.
//    Andhra Pradesh = 28 districts: the dataset already includes Markapuram and Polavaram, which came
//    into force on 31 Dec 2025 (The Hindu, "Two new districts, Polavaram and Markapuram, come into force").
//    Telangana = 33 districts. Spelling normalised to the official names: Jagtial, Jangaon,
//    Jayashankar Bhupalpally, Medchal-Malkajgiri, Anantapuramu, NTR, YSR Kadapa.
//  - Countries: ISO 3166-1 (alpha-2 + English short names) from https://github.com/Mikanebu/country-list
//    (data.json, 249 entries). Names with commas / outdated forms were replaced by their common English
//    short form (Czechia, Eswatini, North Macedonia, Türkiye, South Korea, Russia, ...). India is listed
//    first, the rest alphabetically.
// Pure ES module with no imports (also loadable from Node for checks).
/* eslint-disable */
const COUNTRY_ROWS = [
  ["India","IN"],
  ["Afghanistan","AF"],
  ["Åland Islands","AX"],
  ["Albania","AL"],
  ["Algeria","DZ"],
  ["American Samoa","AS"],
  ["Andorra","AD"],
  ["Angola","AO"],
  ["Anguilla","AI"],
  ["Antarctica","AQ"],
  ["Antigua and Barbuda","AG"],
  ["Argentina","AR"],
  ["Armenia","AM"],
  ["Aruba","AW"],
  ["Australia","AU"],
  ["Austria","AT"],
  ["Azerbaijan","AZ"],
  ["Bahamas","BS"],
  ["Bahrain","BH"],
  ["Bangladesh","BD"],
  ["Barbados","BB"],
  ["Belarus","BY"],
  ["Belgium","BE"],
  ["Belize","BZ"],
  ["Benin","BJ"],
  ["Bermuda","BM"],
  ["Bhutan","BT"],
  ["Bolivia","BO"],
  ["Bonaire Sint Eustatius and Saba","BQ"],
  ["Bosnia and Herzegovina","BA"],
  ["Botswana","BW"],
  ["Bouvet Island","BV"],
  ["Brazil","BR"],
  ["British Indian Ocean Territory","IO"],
  ["British Virgin Islands","VG"],
  ["Brunei","BN"],
  ["Bulgaria","BG"],
  ["Burkina Faso","BF"],
  ["Burundi","BI"],
  ["Cabo Verde","CV"],
  ["Cambodia","KH"],
  ["Cameroon","CM"],
  ["Canada","CA"],
  ["Cayman Islands","KY"],
  ["Central African Republic","CF"],
  ["Chad","TD"],
  ["Chile","CL"],
  ["China","CN"],
  ["Christmas Island","CX"],
  ["Cocos (Keeling) Islands","CC"],
  ["Colombia","CO"],
  ["Comoros","KM"],
  ["Congo","CG"],
  ["Cook Islands","CK"],
  ["Costa Rica","CR"],
  ["Côte d'Ivoire","CI"],
  ["Croatia","HR"],
  ["Cuba","CU"],
  ["Curaçao","CW"],
  ["Cyprus","CY"],
  ["Czechia","CZ"],
  ["Democratic Republic of the Congo","CD"],
  ["Denmark","DK"],
  ["Djibouti","DJ"],
  ["Dominica","DM"],
  ["Dominican Republic","DO"],
  ["Ecuador","EC"],
  ["Egypt","EG"],
  ["El Salvador","SV"],
  ["Equatorial Guinea","GQ"],
  ["Eritrea","ER"],
  ["Estonia","EE"],
  ["Eswatini","SZ"],
  ["Ethiopia","ET"],
  ["Falkland Islands (Malvinas)","FK"],
  ["Faroe Islands","FO"],
  ["Fiji","FJ"],
  ["Finland","FI"],
  ["France","FR"],
  ["French Guiana","GF"],
  ["French Polynesia","PF"],
  ["French Southern Territories","TF"],
  ["Gabon","GA"],
  ["Gambia","GM"],
  ["Georgia","GE"],
  ["Germany","DE"],
  ["Ghana","GH"],
  ["Gibraltar","GI"],
  ["Greece","GR"],
  ["Greenland","GL"],
  ["Grenada","GD"],
  ["Guadeloupe","GP"],
  ["Guam","GU"],
  ["Guatemala","GT"],
  ["Guernsey","GG"],
  ["Guinea","GN"],
  ["Guinea-Bissau","GW"],
  ["Guyana","GY"],
  ["Haiti","HT"],
  ["Heard Island and McDonald Islands","HM"],
  ["Honduras","HN"],
  ["Hong Kong","HK"],
  ["Hungary","HU"],
  ["Iceland","IS"],
  ["Indonesia","ID"],
  ["Iran","IR"],
  ["Iraq","IQ"],
  ["Ireland","IE"],
  ["Isle of Man","IM"],
  ["Israel","IL"],
  ["Italy","IT"],
  ["Jamaica","JM"],
  ["Japan","JP"],
  ["Jersey","JE"],
  ["Jordan","JO"],
  ["Kazakhstan","KZ"],
  ["Kenya","KE"],
  ["Kiribati","KI"],
  ["Kuwait","KW"],
  ["Kyrgyzstan","KG"],
  ["Laos","LA"],
  ["Latvia","LV"],
  ["Lebanon","LB"],
  ["Lesotho","LS"],
  ["Liberia","LR"],
  ["Libya","LY"],
  ["Liechtenstein","LI"],
  ["Lithuania","LT"],
  ["Luxembourg","LU"],
  ["Macao","MO"],
  ["Madagascar","MG"],
  ["Malawi","MW"],
  ["Malaysia","MY"],
  ["Maldives","MV"],
  ["Mali","ML"],
  ["Malta","MT"],
  ["Marshall Islands","MH"],
  ["Martinique","MQ"],
  ["Mauritania","MR"],
  ["Mauritius","MU"],
  ["Mayotte","YT"],
  ["Mexico","MX"],
  ["Micronesia","FM"],
  ["Moldova","MD"],
  ["Monaco","MC"],
  ["Mongolia","MN"],
  ["Montenegro","ME"],
  ["Montserrat","MS"],
  ["Morocco","MA"],
  ["Mozambique","MZ"],
  ["Myanmar","MM"],
  ["Namibia","NA"],
  ["Nauru","NR"],
  ["Nepal","NP"],
  ["Netherlands","NL"],
  ["New Caledonia","NC"],
  ["New Zealand","NZ"],
  ["Nicaragua","NI"],
  ["Niger","NE"],
  ["Nigeria","NG"],
  ["Niue","NU"],
  ["Norfolk Island","NF"],
  ["North Korea","KP"],
  ["North Macedonia","MK"],
  ["Northern Mariana Islands","MP"],
  ["Norway","NO"],
  ["Oman","OM"],
  ["Pakistan","PK"],
  ["Palau","PW"],
  ["Palestine","PS"],
  ["Panama","PA"],
  ["Papua New Guinea","PG"],
  ["Paraguay","PY"],
  ["Peru","PE"],
  ["Philippines","PH"],
  ["Pitcairn Islands","PN"],
  ["Poland","PL"],
  ["Portugal","PT"],
  ["Puerto Rico","PR"],
  ["Qatar","QA"],
  ["Réunion","RE"],
  ["Romania","RO"],
  ["Russia","RU"],
  ["Rwanda","RW"],
  ["Saint Barthélemy","BL"],
  ["Saint Helena Ascension and Tristan da Cunha","SH"],
  ["Saint Kitts and Nevis","KN"],
  ["Saint Lucia","LC"],
  ["Saint Martin (French part)","MF"],
  ["Saint Pierre and Miquelon","PM"],
  ["Saint Vincent and the Grenadines","VC"],
  ["Samoa","WS"],
  ["San Marino","SM"],
  ["Sao Tome and Principe","ST"],
  ["Saudi Arabia","SA"],
  ["Senegal","SN"],
  ["Serbia","RS"],
  ["Seychelles","SC"],
  ["Sierra Leone","SL"],
  ["Singapore","SG"],
  ["Sint Maarten (Dutch part)","SX"],
  ["Slovakia","SK"],
  ["Slovenia","SI"],
  ["Solomon Islands","SB"],
  ["Somalia","SO"],
  ["South Africa","ZA"],
  ["South Georgia and the South Sandwich Islands","GS"],
  ["South Korea","KR"],
  ["South Sudan","SS"],
  ["Spain","ES"],
  ["Sri Lanka","LK"],
  ["Sudan","SD"],
  ["Suriname","SR"],
  ["Svalbard and Jan Mayen","SJ"],
  ["Sweden","SE"],
  ["Switzerland","CH"],
  ["Syria","SY"],
  ["Taiwan","TW"],
  ["Tajikistan","TJ"],
  ["Tanzania","TZ"],
  ["Thailand","TH"],
  ["Timor-Leste","TL"],
  ["Togo","TG"],
  ["Tokelau","TK"],
  ["Tonga","TO"],
  ["Trinidad and Tobago","TT"],
  ["Tunisia","TN"],
  ["Türkiye","TR"],
  ["Turkmenistan","TM"],
  ["Turks and Caicos Islands","TC"],
  ["Tuvalu","TV"],
  ["U.S. Virgin Islands","VI"],
  ["Uganda","UG"],
  ["Ukraine","UA"],
  ["United Arab Emirates","AE"],
  ["United Kingdom","GB"],
  ["United States","US"],
  ["United States Minor Outlying Islands","UM"],
  ["Uruguay","UY"],
  ["Uzbekistan","UZ"],
  ["Vanuatu","VU"],
  ["Vatican City","VA"],
  ["Venezuela","VE"],
  ["Vietnam","VN"],
  ["Wallis and Futuna","WF"],
  ["Western Sahara","EH"],
  ["Yemen","YE"],
  ["Zambia","ZM"],
  ["Zimbabwe","ZW"]
];

const STATE_ROWS = [
  ["Andaman and Nicobar Islands", "AN", ["Nicobars","North And Middle Andaman","South Andamans"]],
  ["Andhra Pradesh", "AP", ["Alluri Sitharama Raju","Anakapalli","Anantapuramu","Annamayya","Bapatla","Chittoor","Dr. B.R. Ambedkar Konaseema","East Godavari","Eluru","Guntur","Kakinada","Krishna","Kurnool","Markapuram","Nandyal","NTR","Palnadu","Parvathipuram Manyam","Polavaram","Prakasam","Sri Potti Sriramulu Nellore","Sri Sathya Sai","Srikakulam","Tirupati","Visakhapatnam","Vizianagaram","West Godavari","YSR Kadapa"]],
  ["Arunachal Pradesh", "AR", ["Anjaw","Bichom","Changlang","Dibang Valley","East Kameng","East Siang","Kamle","Keyi Panyor","Kra Daadi","Kurung Kumey","Leparada","Lohit","Longding","Lower Dibang Valley","Lower Siang","Lower Subansiri","Namsai","Pakke Kessang","Papum Pare","Shi Yomi","Siang","Tawang","Tirap","Upper Siang","Upper Subansiri","West Kameng","West Siang"]],
  ["Assam", "AS", ["Bajali","Baksa","Barpeta","Biswanath","Bongaigaon","Cachar","Charaideo","Chirang","Darrang","Dhemaji","Dhubri","Dibrugarh","Dima Hasao","Goalpara","Golaghat","Hailakandi","Hojai","Jorhat","Kamrup","Kamrup Metro","Karbi Anglong","Kokrajhar","Lakhimpur","Majuli","Marigaon","Nagaon","Nalbari","Sivasagar","Sonitpur","South Salmara Mancachar","Sribhumi","Tamulpur","Tinsukia","Udalguri","West Karbi Anglong"]],
  ["Bihar", "BR", ["Araria","Arwal","Aurangabad","Banka","Begusarai","Bhagalpur","Bhojpur","Buxar","Darbhanga","Gaya","Gopalganj","Jamui","Jehanabad","Kaimur (Bhabua)","Katihar","Khagaria","Kishanganj","Lakhisarai","Madhepura","Madhubani","Munger","Muzaffarpur","Nalanda","Nawada","Pashchim Champaran","Patna","Purbi Champaran","Purnia","Rohtas","Saharsa","Samastipur","Saran","Sheikhpura","Sheohar","Sitamarhi","Siwan","Supaul","Vaishali"]],
  ["Chandigarh", "CH", ["Chandigarh"]],
  ["Chhattisgarh", "CT", ["Balod","Balodabazar-Bhatapara","Balrampur-Ramanujganj","Bastar","Bemetara","Bijapur","Bilaspur","Dakshin Bastar Dantewada","Dhamtari","Durg","Gariyaband","Gaurela-Pendra-Marwahi","Janjgir-Champa","Jashpur","Kabeerdham","Khairagarh-Chhuikhadan-Gandai","Kondagaon","Korba","Korea","Mahasamund","Manendragarh-Chirmiri-Bharatpur (MCB)","Mohla-Manpur-Ambagarh Chouki","Mungeli","Narayanpur","Raigarh","Raipur","Rajnandgaon","Sakti","Sarangarh-Bilaigarh","Sukma","Surajpur","Surguja","Uttar Bastar Kanker"]],
  ["Dadra and Nagar Haveli and Daman and Diu", "DH", ["Dadra And Nagar Haveli","Daman","Diu"]],
  ["Delhi", "DL", ["Central","Central North","East","New Delhi","North","North East","North West","Old Delhi","Outer North","South","South East","South West","West"]],
  ["Goa", "GA", ["Kushavati","North Goa","South Goa"]],
  ["Gujarat", "GJ", ["Ahmedabad","Amreli","Anand","Arvalli","Banas Kantha","Bharuch","Bhavnagar","Botad","Chhotaudepur","Dahod","Dangs","Devbhumi Dwarka","Gandhinagar","Gir Somnath","Jamnagar","Junagadh","Kachchh","Kheda","Mahesana","Mahisagar","Morbi","Narmada","Navsari","Panch Mahals","Patan","Porbandar","Rajkot","Sabar Kantha","Surat","Surendranagar","Tapi","Vadodara","Valsad","Vav-Tharad"]],
  ["Haryana", "HR", ["Ambala","Bhiwani","Charkhi Dadri","Faridabad","Fatehabad","Gurugram","Hansi","Hisar","Jhajjar","Jind","Kaithal","Karnal","Kurukshetra","Mahendragarh","Nuh","Palwal","Panchkula","Panipat","Rewari","Rohtak","Sirsa","Sonipat","Yamunanagar"]],
  ["Himachal Pradesh", "HP", ["Bilaspur","Chamba","Hamirpur","Kangra","Kinnaur","Kullu","Lahaul And Spiti","Mandi","Shimla","Sirmaur","Solan","Una"]],
  ["Jammu and Kashmir", "JK", ["Anantnag","Bandipora","Baramulla","Budgam","Doda","Ganderbal","Jammu","Kathua","Kishtwar","Kulgam","Kupwara","Poonch","Pulwama","Rajouri","Ramban","Reasi","Samba","Shopian","Srinagar","Udhampur"]],
  ["Jharkhand", "JH", ["Bokaro","Chatra","Deoghar","Dhanbad","Dumka","East Singhbum","Garhwa","Giridih","Godda","Gumla","Hazaribagh","Jamtara","Khunti","Koderma","Latehar","Lohardaga","Pakur","Palamu","Ramgarh","Ranchi","Sahebganj","Saraikela Kharsawan","Simdega","West Singhbhum"]],
  ["Karnataka", "KA", ["Bagalkote","Ballari","Belagavi","Bengaluru Rural","Bengaluru South","Bengaluru Urban","Bidar","Chamarajanagar","Chikkaballapura","Chikkamagaluru","Chitradurga","Dakshina Kannada","Davanagere","Dharwad","Gadag","Hassan","Haveri","Kalaburagi","Kodagu","Kolar","Koppal","Mandya","Mysuru","Raichur","Shivamogga","Tumakuru","Udupi","Uttara Kannada","Vijayanagara","Vijayapura","Yadgir"]],
  ["Kerala", "KL", ["Alappuzha","Ernakulam","Idukki","Kannur","Kasaragod","Kollam","Kottayam","Kozhikode","Malappuram","Palakkad","Pathanamthitta","Thiruvananthapuram","Thrissur","Wayanad"]],
  ["Ladakh", "LA", ["Kargil","Leh Ladakh"]],
  ["Lakshadweep", "LD", ["Lakshadweep District"]],
  ["Madhya Pradesh", "MP", ["Agar-Malwa","Alirajpur","Anuppur","Ashoknagar","Balaghat","Barwani","Betul","Bhind","Bhopal","Burhanpur","Chhatarpur","Chhindwara","Damoh","Datia","Dewas","Dhar","Dindori","Guna","Gwalior","Harda","Indore","Jabalpur","Jhabua","Katni","Khandwa (East Nimar)","Khargone (West Nimar)","Maihar","Mandla","Mandsaur","Mauganj","Morena","Narmadapuram","Narsimhapur","Neemuch","Niwari","Pandhurna","Panna","Raisen","Rajgarh","Ratlam","Rewa","Sagar","Satna","Sehore","Seoni","Shahdol","Shajapur","Sheopur","Shivpuri","Sidhi","Singrauli","Tikamgarh","Ujjain","Umaria","Vidisha"]],
  ["Maharashtra", "MH", ["Ahilyanagar","Akola","Amravati","Beed","Bhandara","Buldhana","Chandrapur","Chhatrapati Sambhajinagar","Dharashiv","Dhule","Gadchiroli","Gondia","Hingoli","Jalgaon","Jalna","Kolhapur","Latur","Mumbai","Mumbai Suburban","Nagpur","Nanded","Nandurbar","Nashik","Palghar","Parbhani","Pune","Raigad","Ratnagiri","Sangli","Satara","Sindhudurg","Solapur","Thane","Wardha","Washim","Yavatmal"]],
  ["Manipur", "MN", ["Bishnupur","Chandel","Churachandpur","Imphal East","Imphal West","Jiribam","Kakching","Kamjong","Kangpokpi","Noney","Pherzawl","Senapati","Tamenglong","Tengnoupal","Thoubal","Ukhrul"]],
  ["Meghalaya", "ML", ["East Garo Hills","East Jaintia Hills","East Khasi Hills","Eastern West Khasi Hills","North Garo Hills","Ri Bhoi","South Garo Hills","South West Garo Hills","South West Khasi Hills","West Garo Hills","West Jaintia Hills","West Khasi Hills"]],
  ["Mizoram", "MZ", ["Aizawl","Champhai","Hnahthial","Khawzawl","Kolasib","Lawngtlai","Lunglei","Mamit","Saitual","Serchhip","Siaha"]],
  ["Nagaland", "NL", ["Chumoukedima","Dimapur","Kiphire","Kohima","Longleng","Meluri","Mokokchung","Mon","Niuland","Noklak","Peren","Phek","Shamator","Tseminyu","Tuensang","Wokha","Zunheboto"]],
  ["Odisha", "OR", ["Angul","Balangir","Balasore","Bargarh","Bhadrak","Boudh","Cuttack","Deogarh","Dhenkanal","Gajapati","Ganjam","Jagatsinghapur","Jajpur","Jharsuguda","Kalahandi","Kandhamal","Kendrapara","Keonjhar","Khordha","Koraput","Malkangiri","Mayurbhanj","Nabarangpur","Nayagarh","Nuapada","Puri","Rayagada","Sambalpur","Sonepur","Sundargarh"]],
  ["Puducherry", "PY", ["Karaikal","Puducherry"]],
  ["Punjab", "PB", ["Amritsar","Barnala","Bathinda","Faridkot","Fatehgarh Sahib","Fazilka","Ferozepur","Gurdaspur","Hoshiarpur","Jalandhar","Kapurthala","Ludhiana","Malerkotla","Mansa","Moga","Pathankot","Patiala","Rupnagar","S.A.S Nagar","Sangrur","Shahid Bhagat Singh Nagar","Sri Muktsar Sahib","Tarn Taran"]],
  ["Rajasthan", "RJ", ["Ajmer","Alwar","Balotra","Banswara","Baran","Barmer","Beawar","Bharatpur","Bhilwara","Bikaner","Bundi","Chittorgarh","Churu","Dausa","Deeg","Dholpur","Didwana-Kuchaman","Dungarpur","Ganganagar","Hanumangarh","Jaipur","Jaisalmer","Jalore","Jhalawar","Jhunjhunu","Jodhpur","Karauli","Khairthal-Tijara","Kota","Kotputli-Behror","Nagaur","Pali","Phalodi","Pratapgarh","Rajsamand","Salumbar","Sawai Madhopur","Sikar","Sirohi","Tonk","Udaipur"]],
  ["Sikkim", "SK", ["Gangtok","Gyalshing","Mangan","Namchi","Pakyong","Soreng"]],
  ["Tamil Nadu", "TN", ["Ariyalur","Chengalpattu","Chennai","Coimbatore","Cuddalore","Dharmapuri","Dindigul","Erode","Kallakurichi","Kancheepuram","Kanniyakumari","Karur","Krishnagiri","Madurai","Mayiladuthurai","Nagapattinam","Namakkal","Perambalur","Pudukkottai","Ramanathapuram","Ranipet","Salem","Sivaganga","Tenkasi","Thanjavur","The Nilgiris","Theni","Thiruvallur","Thiruvarur","Thoothukkudi","Tiruchirappalli","Tirunelveli","Tirupathur","Tiruppur","Tiruvannamalai","Vellore","Viluppuram","Virudhunagar"]],
  ["Telangana", "TS", ["Adilabad","Bhadradri Kothagudem","Hanumakonda","Hyderabad","Jagtial","Jangaon","Jayashankar Bhupalpally","Jogulamba Gadwal","Kamareddy","Karimnagar","Khammam","Kumuram Bheem Asifabad","Mahabubabad","Mahabubnagar","Mancherial","Medak","Medchal-Malkajgiri","Mulugu","Nagarkurnool","Nalgonda","Narayanpet","Nirmal","Nizamabad","Peddapalli","Rajanna Sircilla","Ranga Reddy","Sangareddy","Siddipet","Suryapet","Vikarabad","Wanaparthy","Warangal","Yadadri Bhuvanagiri"]],
  ["Tripura", "TR", ["Dhalai","Gomati","Khowai","North Tripura","Sepahijala","South Tripura","Unakoti","West Tripura"]],
  ["Uttar Pradesh", "UP", ["Agra","Aligarh","Ambedkar Nagar","Amethi","Amroha","Auraiya","Ayodhya","Azamgarh","Baghpat","Bahraich","Ballia","Balrampur","Banda","Bara Banki","Bareilly","Basti","Bhadohi","Bijnor","Budaun","Bulandshahr","Chandauli","Chitrakoot","Deoria","Etah","Etawah","Farrukhabad","Fatehpur","Firozabad","Gautam Buddha Nagar","Ghaziabad","Ghazipur","Gonda","Gorakhpur","Hamirpur","Hapur","Hardoi","Hathras","Jalaun","Jaunpur","Jhansi","Kannauj","Kanpur Dehat","Kanpur Nagar","Kasganj","Kaushambi","Kheri","Kushinagar","Lalitpur","Lucknow","Mahoba","Mahrajganj","Mainpuri","Mathura","Mau","Meerut","Mirzapur","Moradabad","Muzaffarnagar","Pilibhit","Pratapgarh","Prayagraj","Rae Bareli","Rampur","Saharanpur","Sambhal","Sant Kabir Nagar","Shahjahanpur","Shamli","Shrawasti","Siddharthnagar","Sitapur","Sonbhadra","Sultanpur","Unnao","Varanasi"]],
  ["Uttarakhand", "UT", ["Almora","Bageshwar","Chamoli","Champawat","Dehradun","Haridwar","Nainital","Pauri Garhwal","Pithoragarh","Rudraprayag","Tehri Garhwal","Udham Singh Nagar","Uttarkashi"]],
  ["West Bengal", "WB", ["Alipurduar","Bankura","Birbhum","Cooch Behar","Dakshin Dinajpur","Darjeeling","Hooghly","Howrah","Jalpaiguri","Jhargram","Kalimpong","Kolkata","Malda","Murshidabad","Nadia","North 24 Parganas","Paschim Bardhaman","Paschim Medinipur","Purba Bardhaman","Purba Medinipur","Purulia","South 24 Parganas","Uttar Dinajpur"]]
];

// ---------------------------------------------------------------------------
// Derived exports + helpers (dependency-free ES module)
// ---------------------------------------------------------------------------
export const COUNTRIES = COUNTRY_ROWS.map(([name, code]) => ({ name, code }));
export const COUNTRY_NAMES = COUNTRIES.map((c) => c.name);
export const INDIA_STATES = STATE_ROWS.map(([name, code, districts]) => ({ name, code, districts }));
export const INDIA = 'India';

const STATE_ALIASES = {
  ap: 'Andhra Pradesh',
  ts: 'Telangana',
  tg: 'Telangana',
  orissa: 'Odisha',
  uttaranchal: 'Uttarakhand',
  pondicherry: 'Puducherry',
  newdelhi: 'Delhi',
  nctofdelhi: 'Delhi',
  andamanandnicobar: 'Andaman and Nicobar Islands',
  damananddiu: 'Dadra and Nagar Haveli and Daman and Diu',
  dadraandnagarhaveli: 'Dadra and Nagar Haveli and Daman and Diu',
};

// Renamed / re-spelled districts seen in older data -> current official name.
const DISTRICT_ALIASES = {
  mahbubnagar: 'Mahabubnagar',
  sircilla: 'Rajanna Sircilla',
  warangalurban: 'Hanumakonda',
  warangalrural: 'Warangal',
  rangareddy: 'Ranga Reddy',
  anantapur: 'Anantapuramu',
  ananthapuramu: 'Anantapuramu',
  kadapa: 'YSR Kadapa',
  nellore: 'Sri Potti Sriramulu Nellore',
  konaseema: 'Dr. B.R. Ambedkar Konaseema',
  jagitial: 'Jagtial',
  jangoan: 'Jangaon',
  jayashankar: 'Jayashankar Bhupalpally',
  jayashankarbhupalapally: 'Jayashankar Bhupalpally',
  medchalmalkajgiri: 'Medchal-Malkajgiri',
  medchal: 'Medchal-Malkajgiri',
  kumurambheem: 'Kumuram Bheem Asifabad',
  asifabad: 'Kumuram Bheem Asifabad',
  yadadri: 'Yadadri Bhuvanagiri',
  bhadradri: 'Bhadradri Kothagudem',
  kothagudem: 'Bhadradri Kothagudem',
  jogulamba: 'Jogulamba Gadwal',
  gadwal: 'Jogulamba Gadwal',
  sathyasai: 'Sri Sathya Sai',
  sripottisriramulunellore: 'Sri Potti Sriramulu Nellore',
  spsrnellore: 'Sri Potti Sriramulu Nellore',
  alluriseetharamaraju: 'Alluri Sitharama Raju',
  alluriseetharamarajuap: 'Alluri Sitharama Raju',
  parvathipuram: 'Parvathipuram Manyam',
  ambedkarkonaseema: 'Dr. B.R. Ambedkar Konaseema',
  brambedkarkonaseema: 'Dr. B.R. Ambedkar Konaseema',
};

const COUNTRY_ALIASES = {
  usa: 'United States',
  us: 'United States',
  unitedstatesofamerica: 'United States',
  america: 'United States',
  uk: 'United Kingdom',
  greatbritain: 'United Kingdom',
  england: 'United Kingdom',
  uae: 'United Arab Emirates',
  russianfederation: 'Russia',
  vietnam: 'Vietnam',
  vietnamsocialistrepublic: 'Vietnam',
  czechrepublic: 'Czechia',
  turkey: 'Türkiye',
  swaziland: 'Eswatini',
  burma: 'Myanmar',
  korea: 'South Korea',
  republicofkorea: 'South Korea',
  capeverde: 'Cabo Verde',
  ivorycoast: 'Côte d\'Ivoire',
  holland: 'Netherlands',
};

// Strips legacy decorations: "TS_Adilabad" -> "Adilabad", "Adilabad (TG)" -> "Adilabad".
export const normalizeLocName = (s) => {
  if (s === null || s === undefined) return '';
  let v = String(s).trim();
  v = v.replace(/^[A-Za-z]{2}_/, '');
  v = v.replace(/\s*\((TG|AP|TS)\)\s*$/i, '');
  return v.replace(/\s+/g, ' ').trim();
};

// Lowercase alphanumeric comparison key (accents folded).
export const locKey = (s) =>
  normalizeLocName(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

// "TS_Adilabad" -> state implied by the two-letter prefix (or '').
const prefixState = (s) => {
  const m = /^([A-Za-z]{2})_/.exec(String(s || '').trim());
  if (!m) return '';
  return STATE_ALIASES[m[1].toLowerCase()] || '';
};

const COUNTRY_BY_KEY = new Map(COUNTRIES.map((c) => [locKey(c.name), c.name]));
const STATE_BY_KEY = new Map(INDIA_STATES.map((s) => [locKey(s.name), s.name]));
INDIA_STATES.forEach((s) => {
  const k = s.code.toLowerCase();
  if (!STATE_BY_KEY.has(k)) STATE_BY_KEY.set(k, s.name);
});
const STATE_OBJ = new Map(INDIA_STATES.map((s) => [s.name, s]));

export const matchCountry = (v) => {
  const k = locKey(v);
  if (!k) return null;
  return COUNTRY_BY_KEY.get(k) || (COUNTRY_ALIASES[k] && COUNTRY_BY_KEY.get(locKey(COUNTRY_ALIASES[k]))) || null;
};

export const matchState = (v) => {
  const k = locKey(v);
  if (!k) return null;
  if (STATE_ALIASES[k]) return STATE_ALIASES[k];
  return STATE_BY_KEY.get(k) || null;
};

export const getDistricts = (stateName) => {
  const s = STATE_OBJ.get(stateName);
  return s ? s.districts : [];
};

export const matchDistrict = (stateName, v) => {
  const k = locKey(v);
  if (!k) return null;
  const list = getDistricts(stateName);
  const hit = list.find((d) => locKey(d) === k);
  if (hit) return hit;
  const alias = DISTRICT_ALIASES[k];
  if (alias && list.includes(alias)) return alias;
  return null;
};

const findDistrictStates = (v) => INDIA_STATES.filter((s) => matchDistrict(s.name, v)).map((s) => s.name);

const clean100 = (s) => String(s == null ? '' : s).replace(/,/g, ' ').replace(/\s+/g, ' ').trim();

// True when every non-empty part is a value the cascade can show.
export const isCanonicalLocation = ({ country, state, district } = {}) => {
  const c = String(country || '').trim();
  const s = String(state || '').trim();
  const d = String(district || '').trim();
  if (!c && !s && !d) return true;
  if (!c) return false;
  if (!COUNTRY_NAMES.includes(c)) return false;
  if (c === INDIA) {
    if (!s) return !d;
    if (!STATE_OBJ.has(s)) return false;
    return !d || getDistricts(s).includes(d);
  }
  return true;
};

// Maps any legacy shape to the canonical triple when possible; otherwise returns the input
// (as strings) untouched so nothing is silently erased.
export const normalizeLegacyLocation = ({ country, state, district } = {}) => {
  const raw = {
    country: String(country == null ? '' : country).trim(),
    state: String(state == null ? '' : state).trim(),
    district: String(district == null ? '' : district).trim(),
  };
  if (!raw.country && !raw.state && !raw.district) return raw;

  let c = '';
  if (raw.country) {
    c = matchCountry(raw.country);
    if (!c) return raw;
  }
  if (c && c !== INDIA) {
    // Abroad: state / city are free text.
    return { country: c, state: clean100(normalizeLocName(raw.state)), district: clean100(normalizeLocName(raw.district)) };
  }

  // India, or country not stored (older rows): resolve state and district.
  let st = '';
  if (raw.state) {
    st = matchState(raw.state);
    if (!st) return raw;
  }
  let d = '';
  if (raw.district) {
    if (!st) {
      const hint = prefixState(raw.district);
      const states = hint ? [hint] : findDistrictStates(raw.district);
      if (states.length !== 1) return raw;
      st = states[0];
    }
    d = matchDistrict(st, raw.district);
    if (!d) return raw;
  }
  if (!st && !c) return raw;
  return { country: INDIA, state: st, district: d || '' };
};

// "District, State, Country" (blank parts dropped, commas removed from free text).
export const formatPlace = ({ country, state, district } = {}) =>
  [district, state, country].map(clean100).filter(Boolean).join(', ');

// Inverse of formatPlace; falls back to legacy single-name mapping.
export const parsePlace = (str) => {
  const s = String(str == null ? '' : str).trim();
  const blank = { country: '', state: '', district: '' };
  if (!s) return { ...blank, ok: true };
  const parts = s.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2 && parts.length <= 3) {
    const c = matchCountry(parts[parts.length - 1]);
    if (c === INDIA) {
      const st = matchState(parts[parts.length - 2]);
      if (st) {
        if (parts.length === 3) {
          const d = matchDistrict(st, parts[0]);
          if (d) return { country: INDIA, state: st, district: d, ok: true };
        } else {
          return { country: INDIA, state: st, district: '', ok: true };
        }
      }
    } else if (c) {
      if (parts.length === 3) return { country: c, state: parts[1], district: parts[0], ok: true };
      return { country: c, state: '', district: parts[0], ok: true };
    }
  }
  if (parts.length === 1) {
    const c = matchCountry(s);
    if (c) return { country: c, state: '', district: '', ok: true };
  }
  const n = normalizeLegacyLocation({ district: s });
  return { ...n, ok: isCanonicalLocation(n) && !!n.country };
};

// Old Job Location values were a short list of work cities / countries. Well known multi-name cities
// map to one state + district of the dataset (e.g. Bengaluru -> Karnataka / Bengaluru Urban).
const JOB_CITY_ALIASES = {
  bangalore: ['Karnataka', 'Bengaluru Urban'],
  bengaluru: ['Karnataka', 'Bengaluru Urban'],
  mumbai: ['Maharashtra', 'Mumbai'],
  delhi: ['Delhi', 'New Delhi'],
  newdelhi: ['Delhi', 'New Delhi'],
  mangaluru: ['Karnataka', 'Dakshina Kannada'],
  mangalore: ['Karnataka', 'Dakshina Kannada'],
  kochi: ['Kerala', 'Ernakulam'],
  cochin: ['Kerala', 'Ernakulam'],
  trivandrum: ['Kerala', 'Thiruvananthapuram'],
  vizag: ['Andhra Pradesh', 'Visakhapatnam'],
  mysore: ['Karnataka', 'Mysuru'],
  vijayawada: ['Andhra Pradesh', 'NTR'],
  bhubaneswar: ['Odisha', 'Khordha'],
  guwahati: ['Assam', 'Kamrup Metro'],
};

// Maps a legacy userdetails.jobcity value to { country, state, district, ok }.
// Countries (USA, UK, Canada ...) -> that country only; known cities -> India / state / district.
// "Other", multi-city entries and anything unknown -> ok false (the caller keeps the stored text).
export const mapLegacyJobLocation = (v) => {
  const raw = String(v == null ? '' : v).trim();
  const blank = { country: '', state: '', district: '' };
  if (!raw) return { ...blank, ok: true };
  const text = raw.replace(/\s*\([^)]*\)\s*$/, '').trim();
  const k = locKey(text);
  if (!k || k === 'other') return { ...blank, ok: false };
  const c = matchCountry(text);
  if (c) return { country: c, state: '', district: '', ok: true };
  const alias = JOB_CITY_ALIASES[k];
  if (alias) return { country: INDIA, state: alias[0], district: alias[1], ok: true };
  const states = findDistrictStates(text);
  if (states.length === 1) {
    return { country: INDIA, state: states[0], district: matchDistrict(states[0], text), ok: true };
  }
  const st = matchState(text);
  if (st && !states.length) return { country: INDIA, state: st, district: '', ok: true };
  return { ...blank, ok: false };
};

// Display helper: hides the "TS_" prefix and " (TG)" / " (AP)" suffix on stored values.
export const displayLocation = (v) => {
  if (v === null || v === undefined) return '';
  return String(v)
    .split(',')
    .map((p) => normalizeLocName(p))
    .filter(Boolean)
    .join(', ');
};
