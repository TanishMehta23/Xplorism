// Comprehensive database of major railway stations (Indian Railways and major global rail hubs)
export const STATIONS = [
  // Delhi NCR
  { code: 'NDLS', name: 'New Delhi Railway Station', city: 'New Delhi', state: 'Delhi', country: 'India', lat: 28.6427, lon: 77.2205 },
  { code: 'DLI', name: 'Old Delhi Railway Station', city: 'Delhi', state: 'Delhi', country: 'India', lat: 28.6606, lon: 77.2274 },
  { code: 'NZM', name: 'Hazrat Nizamuddin Railway Station', city: 'Delhi', state: 'Delhi', country: 'India', lat: 28.5888, lon: 77.2534 },
  { code: 'ANVT', name: 'Anand Vihar Terminal', city: 'Delhi', state: 'Delhi', country: 'India', lat: 28.6508, lon: 77.3153 },
  { code: 'DEC', name: 'Delhi Cantt Railway Station', city: 'Delhi', state: 'Delhi', country: 'India', lat: 28.5916, lon: 77.1265 },
  { code: 'DEE', name: 'Delhi Sarai Rohilla Railway Station', city: 'Delhi', state: 'Delhi', country: 'India', lat: 28.6622, lon: 77.1852 },

  // Mumbai & Maharashtra
  { code: 'CSMT', name: 'Chhatrapati Shivaji Maharaj Terminus', city: 'Mumbai', state: 'Maharashtra', country: 'India', lat: 18.9401, lon: 72.8354 },
  { code: 'BCT', name: 'Mumbai Central', city: 'Mumbai', state: 'Maharashtra', country: 'India', lat: 18.9696, lon: 72.8194 },
  { code: 'BDTS', name: 'Bandra Terminus', city: 'Mumbai', state: 'Maharashtra', country: 'India', lat: 19.0626, lon: 72.8407 },
  { code: 'LTT', name: 'Lokmanya Tilak Terminus', city: 'Mumbai', state: 'Maharashtra', country: 'India', lat: 19.0694, lon: 72.8914 },
  { code: 'DR', name: 'Dadar Railway Station', city: 'Mumbai', state: 'Maharashtra', country: 'India', lat: 19.0178, lon: 72.8437 },
  { code: 'PUNE', name: 'Pune Junction', city: 'Pune', state: 'Maharashtra', country: 'India', lat: 18.5284, lon: 73.8744 },
  { code: 'NGP', name: 'Nagpur Junction', city: 'Nagpur', state: 'Maharashtra', country: 'India', lat: 21.1524, lon: 79.0888 },
  { code: 'BSL', name: 'Bhusaval Junction', city: 'Bhusaval', state: 'Maharashtra', country: 'India', lat: 21.0478, lon: 75.7876 },
  { code: 'NK', name: 'Nashik Road', city: 'Nashik', state: 'Maharashtra', country: 'India', lat: 19.9547, lon: 73.8427 },
  { code: 'CSN', name: 'Chhatrapati Sambhajinagar (Aurangabad)', city: 'Chhatrapati Sambhajinagar', state: 'Maharashtra', country: 'India', lat: 19.8647, lon: 75.3204 },

  // Uttar Pradesh
  { code: 'AGC', name: 'Agra Cantt', city: 'Agra', state: 'Uttar Pradesh', country: 'India', lat: 27.1578, lon: 77.9892 },
  { code: 'AF', name: 'Agra Fort Railway Station', city: 'Agra', state: 'Uttar Pradesh', country: 'India', lat: 27.1824, lon: 78.0163 },
  { code: 'LKO', name: 'Lucknow Charbagh Railway Station', city: 'Lucknow', state: 'Uttar Pradesh', country: 'India', lat: 26.8315, lon: 80.9221 },
  { code: 'LJN', name: 'Lucknow Junction', city: 'Lucknow', state: 'Uttar Pradesh', country: 'India', lat: 26.8322, lon: 80.9215 },
  { code: 'BSB', name: 'Varanasi Junction (Cantt)', city: 'Varanasi', state: 'Uttar Pradesh', country: 'India', lat: 25.3283, lon: 82.9863 },
  { code: 'DDU', name: 'Pt. Deen Dayal Upadhyaya Junction (Mughalsarai)', city: 'Mughalsarai / Varanasi', state: 'Uttar Pradesh', country: 'India', lat: 25.2818, lon: 83.1186 },
  { code: 'PRYJ', name: 'Prayagraj Junction (Allahabad)', city: 'Prayagraj', state: 'Uttar Pradesh', country: 'India', lat: 25.4439, lon: 81.8282 },
  { code: 'CNB', name: 'Kanpur Central', city: 'Kanpur', state: 'Uttar Pradesh', country: 'India', lat: 26.4542, lon: 80.3507 },
  { code: 'GKP', name: 'Gorakhpur Junction', city: 'Gorakhpur', state: 'Uttar Pradesh', country: 'India', lat: 26.7588, lon: 83.3824 },
  { code: 'AY', name: 'Ayodhya Dham Junction', city: 'Ayodhya', state: 'Uttar Pradesh', country: 'India', lat: 26.7922, lon: 82.1998 },
  { code: 'AYC', name: 'Ayodhya Cantt', city: 'Ayodhya', state: 'Uttar Pradesh', country: 'India', lat: 26.7725, lon: 82.1408 },
  { code: 'MTJ', name: 'Mathura Junction', city: 'Mathura', state: 'Uttar Pradesh', country: 'India', lat: 27.4789, lon: 77.6744 },
  { code: 'JHS', name: 'Virangana Lakshmibai Jhansi Junction', city: 'Jhansi', state: 'Uttar Pradesh', country: 'India', lat: 25.4484, lon: 78.5583 },

  // West Bengal & East India
  { code: 'HWH', name: 'Howrah Junction', city: 'Kolkata / Howrah', state: 'West Bengal', country: 'India', lat: 22.5839, lon: 88.3426 },
  { code: 'SDAH', name: 'Sealdah Railway Station', city: 'Kolkata', state: 'West Bengal', country: 'India', lat: 22.5672, lon: 88.3712 },
  { code: 'KOAA', name: 'Kolkata Railway Station (Chitpur)', city: 'Kolkata', state: 'West Bengal', country: 'India', lat: 22.6022, lon: 88.3778 },
  { code: 'SHM', name: 'Shalimar Railway Station', city: 'Kolkata / Howrah', state: 'West Bengal', country: 'India', lat: 22.5567, lon: 88.3242 },
  { code: 'NJP', name: 'New Jalpaiguri Junction', city: 'Siliguri / Darjeeling', state: 'West Bengal', country: 'India', lat: 26.6853, lon: 88.4419 },
  { code: 'KGP', name: 'Kharagpur Junction', city: 'Kharagpur', state: 'West Bengal', country: 'India', lat: 22.3392, lon: 87.3256 },
  { code: 'PNBE', name: 'Patna Junction', city: 'Patna', state: 'Bihar', country: 'India', lat: 25.6026, lon: 85.1376 },
  { code: 'GAYA', name: 'Gaya Junction', city: 'Gaya', state: 'Bihar', country: 'India', lat: 24.8016, lon: 84.9984 },
  { code: 'RNC', name: 'Ranchi Junction', city: 'Ranchi', state: 'Jharkhand', country: 'India', lat: 23.3516, lon: 85.3344 },
  { code: 'BBS', name: 'Bhubaneswar Railway Station', city: 'Bhubaneswar', state: 'Odisha', country: 'India', lat: 20.2666, lon: 85.8436 },
  { code: 'PURI', name: 'Puri Railway Station', city: 'Puri', state: 'Odisha', country: 'India', lat: 19.8144, lon: 85.8344 },
  { code: 'GHY', name: 'Guwahati Railway Station', city: 'Guwahati', state: 'Assam', country: 'India', lat: 26.1833, lon: 91.7525 },

  // South India
  { code: 'SBC', name: 'KSR Bengaluru City Junction', city: 'Bengaluru', state: 'Karnataka', country: 'India', lat: 12.9784, lon: 77.5694 },
  { code: 'YPR', name: 'Yesvantpur Junction', city: 'Bengaluru', state: 'Karnataka', country: 'India', lat: 13.0238, lon: 77.5501 },
  { code: 'SMVB', name: 'Sir M. Visvesvaraya Terminal', city: 'Bengaluru', state: 'Karnataka', country: 'India', lat: 13.0039, lon: 77.6536 },
  { code: 'MAS', name: 'Mgr Chennai Central', city: 'Chennai', state: 'Tamil Nadu', country: 'India', lat: 13.0827, lon: 80.2755 },
  { code: 'MS', name: 'Chennai Egmore', city: 'Chennai', state: 'Tamil Nadu', country: 'India', lat: 13.0792, lon: 80.2608 },
  { code: 'HYB', name: 'Hyderabad Deccan (Nampally)', city: 'Hyderabad', state: 'Telangana', country: 'India', lat: 17.3916, lon: 78.4678 },
  { code: 'SC', name: 'Secunderabad Junction', city: 'Secunderabad / Hyderabad', state: 'Telangana', country: 'India', lat: 17.4344, lon: 78.5014 },
  { code: 'BZA', name: 'Vijayawada Junction', city: 'Vijayawada', state: 'Andhra Pradesh', country: 'India', lat: 16.5186, lon: 80.6197 },
  { code: 'VSKP', name: 'Visakhapatnam Junction', city: 'Visakhapatnam', state: 'Andhra Pradesh', country: 'India', lat: 17.7214, lon: 83.2878 },
  { code: 'TPTY', name: 'Tirupati Main', city: 'Tirupati', state: 'Andhra Pradesh', country: 'India', lat: 13.6288, lon: 79.4192 },
  { code: 'ERS', name: 'Ernakulam Junction (South)', city: 'Kochi / Ernakulam', state: 'Kerala', country: 'India', lat: 9.9675, lon: 76.2917 },
  { code: 'ERN', name: 'Ernakulam Town (North)', city: 'Kochi / Ernakulam', state: 'Kerala', country: 'India', lat: 9.9922, lon: 76.2894 },
  { code: 'TVC', name: 'Thiruvananthapuram Central', city: 'Thiruvananthapuram', state: 'Kerala', country: 'India', lat: 8.4871, lon: 76.9530 },
  { code: 'CLT', name: 'Kozhikode Main', city: 'Kozhikode', state: 'Kerala', country: 'India', lat: 11.2467, lon: 75.7836 },
  { code: 'CBE', name: 'Coimbatore Main Junction', city: 'Coimbatore', state: 'Tamil Nadu', country: 'India', lat: 10.9972, lon: 76.9636 },
  { code: 'MDU', name: 'Madurai Junction', city: 'Madurai', state: 'Tamil Nadu', country: 'India', lat: 9.9252, lon: 78.1118 },
  { code: 'TPJ', name: 'Tiruchchirappalli Junction', city: 'Tiruchirappalli', state: 'Tamil Nadu', country: 'India', lat: 10.7936, lon: 78.6833 },
  { code: 'MAQ', name: 'Mangaluru Central', city: 'Mangalore', state: 'Karnataka', country: 'India', lat: 12.8647, lon: 74.8428 },
  { code: 'MYS', name: 'Mysuru Junction', city: 'Mysuru', state: 'Karnataka', country: 'India', lat: 12.3162, lon: 76.6447 },

  // Rajasthan & Gujarat
  { code: 'JP', name: 'Jaipur Junction', city: 'Jaipur', state: 'Rajasthan', country: 'India', lat: 26.9196, lon: 75.7878 },
  { code: 'JU', name: 'Jodhpur Junction', city: 'Jodhpur', state: 'Rajasthan', country: 'India', lat: 26.2847, lon: 73.0189 },
  { code: 'UDZ', name: 'Udaipur City', city: 'Udaipur', state: 'Rajasthan', country: 'India', lat: 24.5714, lon: 73.6983 },
  { code: 'AII', name: 'Ajmer Junction', city: 'Ajmer', state: 'Rajasthan', country: 'India', lat: 26.4561, lon: 74.6394 },
  { code: 'BKN', name: 'Bikaner Junction', city: 'Bikaner', state: 'Rajasthan', country: 'India', lat: 28.0167, lon: 73.3119 },
  { code: 'KOTA', name: 'Kota Junction', city: 'Kota', state: 'Rajasthan', country: 'India', lat: 25.2197, lon: 75.8647 },
  { code: 'ADI', name: 'Ahmedabad Junction (Kalupur)', city: 'Ahmedabad', state: 'Gujarat', country: 'India', lat: 23.0238, lon: 72.6006 },
  { code: 'BRC', name: 'Vadodara Junction', city: 'Vadodara', state: 'Gujarat', country: 'India', lat: 22.3106, lon: 73.1812 },
  { code: 'ST', name: 'Surat Railway Station', city: 'Surat', state: 'Gujarat', country: 'India', lat: 21.2048, lon: 72.8406 },
  { code: 'RJT', name: 'Rajkot Junction', city: 'Rajkot', state: 'Gujarat', country: 'India', lat: 22.3128, lon: 70.7986 },

  // Goa, Madhya Pradesh & Punjab / Haryana / North
  { code: 'MAO', name: 'Madgaon Junction', city: 'Madgaon / Goa', state: 'Goa', country: 'India', lat: 15.2747, lon: 73.9786 },
  { code: 'KRMI', name: 'Karmali Railway Station', city: 'Panaji / Goa', state: 'Goa', country: 'India', lat: 15.4981, lon: 73.9214 },
  { code: 'THVM', name: 'Thivim Railway Station', city: 'North Goa', state: 'Goa', country: 'India', lat: 15.6322, lon: 73.8644 },
  { code: 'BPL', name: 'Bhopal Junction', city: 'Bhopal', state: 'Madhya Pradesh', country: 'India', lat: 23.2678, lon: 77.4144 },
  { code: 'RKMP', name: 'Rani Kamlapati Railway Station (Habibganj)', city: 'Bhopal', state: 'Madhya Pradesh', country: 'India', lat: 23.2189, lon: 77.4428 },
  { code: 'INDB', name: 'Indore Junction', city: 'Indore', state: 'Madhya Pradesh', country: 'India', lat: 22.7178, lon: 75.8686 },
  { code: 'GWL', name: 'Gwalior Junction', city: 'Gwalior', state: 'Madhya Pradesh', country: 'India', lat: 26.2167, lon: 78.1833 },
  { code: 'JBP', name: 'Jabalpur Junction', city: 'Jabalpur', state: 'Madhya Pradesh', country: 'India', lat: 23.1633, lon: 79.9536 },
  { code: 'UJN', name: 'Ujjain Junction', city: 'Ujjain', state: 'Madhya Pradesh', country: 'India', lat: 23.1778, lon: 75.7856 },
  // Punjab, Haryana & Himachal
  { code: 'PTA', name: 'Patiala Railway Station', city: 'Patiala', state: 'Punjab', country: 'India', lat: 30.3400, lon: 76.3869 },
  { code: 'UMB', name: 'Ambala Cantt Junction', city: 'Ambala', state: 'Haryana', country: 'India', lat: 30.3344, lon: 76.8378 },
  { code: 'ASR', name: 'Amritsar Junction', city: 'Amritsar', state: 'Punjab', country: 'India', lat: 31.6339, lon: 74.8656 },
  { code: 'CDG', name: 'Chandigarh Junction', city: 'Chandigarh', state: 'Punjab/Haryana', country: 'India', lat: 30.7056, lon: 76.8222 },
  { code: 'LDH', name: 'Ludhiana Junction', city: 'Ludhiana', state: 'Punjab', country: 'India', lat: 30.9083, lon: 75.8611 },
  { code: 'JUC', name: 'Jalandhar City Junction', city: 'Jalandhar', state: 'Punjab', country: 'India', lat: 31.3325, lon: 75.5900 },
  { code: 'BTI', name: 'Bathinda Junction', city: 'Bathinda', state: 'Punjab', country: 'India', lat: 30.2110, lon: 74.9455 },
  { code: 'KLK', name: 'Kalka Railway Station', city: 'Kalka / Shimla', state: 'Haryana', country: 'India', lat: 30.8356, lon: 76.9367 },

  // Jammu & Kashmir and Uttarakhand
  { code: 'JAT', name: 'Jammu Tawi', city: 'Jammu', state: 'Jammu and Kashmir', country: 'India', lat: 32.7056, lon: 74.8722 },
  { code: 'SVDK', name: 'Shri Mata Vaishno Devi Katra', city: 'Katra', state: 'Jammu and Kashmir', country: 'India', lat: 32.9917, lon: 74.9317 },
  { code: 'HW', name: 'Haridwar Junction', city: 'Haridwar', state: 'Uttarakhand', country: 'India', lat: 29.9456, lon: 78.1506 },
  { code: 'DDN', name: 'Dehradun Railway Station', city: 'Dehradun', state: 'Uttarakhand', country: 'India', lat: 30.3156, lon: 78.0336 },
  { code: 'KGM', name: 'Kathgodam Railway Station', city: 'Nainital / Kathgodam', state: 'Uttarakhand', country: 'India', lat: 29.2711, lon: 79.5444 }
];

/**
 * Search stations by code, city, name, or state
 */
export function searchStations(query, limit = 8) {
  if (!query || typeof query !== 'string') return [];
  const q = query.trim().toLowerCase();
  if (q.length === 0) return [];

  const exactCodeMatches = [];
  const prefixCodeMatches = [];
  const nameCityMatches = [];

  const codeRegex = /\b([A-Z]{2,5})\b/i;
  const match = query.match(codeRegex);
  const explicitCode = match ? match[1].toUpperCase() : null;

  for (const s of STATIONS) {
    const code = s.code.toLowerCase();
    const city = s.city.toLowerCase();
    const name = s.name.toLowerCase();
    const country = s.country.toLowerCase();
    const state = (s.state || '').toLowerCase();

    if (code === explicitCode?.toLowerCase() || code === q) {
      exactCodeMatches.push(s);
    } else if (code.startsWith(q) || (explicitCode && code.startsWith(explicitCode.toLowerCase()))) {
      prefixCodeMatches.push(s);
    } else if (
      city.includes(q) ||
      q.includes(city) ||
      name.includes(q) ||
      country.includes(q) ||
      state.includes(q)
    ) {
      nameCityMatches.push(s);
    }
  }

  // Sort name/city matches so that startsWith matches appear before contains
  nameCityMatches.sort((a, b) => {
    const aCityStart = a.city.toLowerCase().startsWith(q) ? 1 : 0;
    const bCityStart = b.city.toLowerCase().startsWith(q) ? 1 : 0;
    return bCityStart - aCityStart;
  });

  const combined = [...exactCodeMatches, ...prefixCodeMatches, ...nameCityMatches];
  const seen = new Set();
  const results = [];

  for (const item of combined) {
    if (!seen.has(item.code)) {
      seen.add(item.code);
      results.push({
        place_id: `station-${item.code}`,
        code: item.code,
        name: item.name,
        city: item.city,
        state: item.state || '',
        country: item.country,
        lat: String(item.lat),
        lon: String(item.lon),
        display_name: `${item.name} (${item.code}), ${item.city}, ${item.country}`,
        short_name: `${item.city} (${item.code})`,
        type: 'station'
      });
      if (results.length >= limit) break;
    }
  }

  return results;
}
