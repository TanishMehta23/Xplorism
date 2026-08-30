export const AIRPORTS = [
  // India (Major Hubs & Regional Airports)
  { code: 'DEL', name: 'Indira Gandhi International Airport', city: 'Delhi', state: 'Delhi', country: 'India', lat: 28.5562, lon: 77.1000 },
  { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj International Airport', city: 'Mumbai', state: 'Maharashtra', country: 'India', lat: 19.0896, lon: 72.8656 },
  { code: 'BLR', name: 'Kempegowda International Airport', city: 'Bengaluru', state: 'Karnataka', country: 'India', lat: 13.1986, lon: 77.7066 },
  { code: 'HYD', name: 'Rajiv Gandhi International Airport', city: 'Hyderabad', state: 'Telangana', country: 'India', lat: 17.2403, lon: 78.4294 },
  { code: 'MAA', name: 'Chennai International Airport', city: 'Chennai', state: 'Tamil Nadu', country: 'India', lat: 12.9941, lon: 80.1709 },
  { code: 'CCU', name: 'Netaji Subhash Chandra Bose International Airport', city: 'Kolkata', state: 'West Bengal', country: 'India', lat: 22.6547, lon: 88.4467 },
  { code: 'COK', name: 'Cochin International Airport', city: 'Kochi', state: 'Kerala', country: 'India', lat: 10.1556, lon: 76.3910 },
  { code: 'GOI', name: 'Dabolim Airport', city: 'Goa', state: 'Goa', country: 'India', lat: 15.3808, lon: 73.8314 },
  { code: 'GOX', name: 'Manohar International Airport (Mopa)', city: 'Goa', state: 'Goa', country: 'India', lat: 15.7667, lon: 73.8667 },
  { code: 'AMD', name: 'Sardar Vallabhbhai Patel International Airport', city: 'Ahmedabad', state: 'Gujarat', country: 'India', lat: 23.0772, lon: 72.6347 },
  { code: 'PNQ', name: 'Pune Airport', city: 'Pune', state: 'Maharashtra', country: 'India', lat: 18.5822, lon: 73.9197 },
  { code: 'JAI', name: 'Jaipur International Airport', city: 'Jaipur', state: 'Rajasthan', country: 'India', lat: 26.8242, lon: 75.8122 },
  { code: 'LKO', name: 'Chaudhary Charan Singh International Airport', city: 'Lucknow', state: 'Uttar Pradesh', country: 'India', lat: 26.7606, lon: 80.8893 },
  { code: 'VNS', name: 'Lal Bahadur Shastri International Airport', city: 'Varanasi', state: 'Uttar Pradesh', country: 'India', lat: 25.4496, lon: 82.8596 },
  { code: 'ATQ', name: 'Sri Guru Ram Dass Jee International Airport', city: 'Amritsar', state: 'Punjab', country: 'India', lat: 31.7096, lon: 74.7973 },
  { code: 'IXC', name: 'Shaheed Bhagat Singh International Airport', city: 'Chandigarh', state: 'Punjab/Haryana', country: 'India', lat: 30.6735, lon: 76.7885 },
  { code: 'SXR', name: 'Sheikh ul-Alam International Airport', city: 'Srinagar', state: 'Jammu and Kashmir', country: 'India', lat: 33.9871, lon: 74.7744 },
  { code: 'IXJ', name: 'Jammu Airport', city: 'Jammu', state: 'Jammu and Kashmir', country: 'India', lat: 32.6891, lon: 74.8374 },
  { code: 'DED', name: 'Jolly Grant Airport', city: 'Dehradun', state: 'Uttarakhand', country: 'India', lat: 30.1897, lon: 78.1803 },
  { code: 'IXB', name: 'Bagdogra Airport', city: 'Siliguri / Darjeeling', state: 'West Bengal', country: 'India', lat: 26.6812, lon: 88.3286 },
  { code: 'GAU', name: 'Lokpriya Gopinath Bordoloi International Airport', city: 'Guwahati', state: 'Assam', country: 'India', lat: 26.1061, lon: 91.5859 },
  { code: 'PAT', name: 'Jay Prakash Narayan Airport', city: 'Patna', state: 'Bihar', country: 'India', lat: 25.5913, lon: 85.0880 },
  { code: 'BBI', name: 'Biju Patnaik International Airport', city: 'Bhubaneswar', state: 'Odisha', country: 'India', lat: 20.2444, lon: 85.8178 },
  { code: 'IXR', name: 'Birsa Munda Airport', city: 'Ranchi', state: 'Jharkhand', country: 'India', lat: 23.3143, lon: 85.3217 },
  { code: 'IDR', name: 'Devi Ahilyabai Holkar Airport', city: 'Indore', state: 'Madhya Pradesh', country: 'India', lat: 22.7217, lon: 75.8011 },
  { code: 'BHO', name: 'Raja Bhoj Airport', city: 'Bhopal', state: 'Madhya Pradesh', country: 'India', lat: 23.2875, lon: 77.3378 },
  { code: 'UDR', name: 'Maharana Pratap Airport', city: 'Udaipur', state: 'Rajasthan', country: 'India', lat: 24.6177, lon: 73.8961 },
  { code: 'JDH', name: 'Jodhpur Airport', city: 'Jodhpur', state: 'Rajasthan', country: 'India', lat: 26.2511, lon: 73.0489 },
  { code: 'BDQ', name: 'Vadodara Airport', city: 'Vadodara', state: 'Gujarat', country: 'India', lat: 22.3362, lon: 73.2263 },
  { code: 'STV', name: 'Surat International Airport', city: 'Surat', state: 'Gujarat', country: 'India', lat: 21.1139, lon: 72.7419 },
  { code: 'NAG', name: 'Dr. Babasaheb Ambedkar International Airport', city: 'Nagpur', state: 'Maharashtra', country: 'India', lat: 21.0922, lon: 79.0472 },
  { code: 'TRV', name: 'Trivandrum International Airport', city: 'Thiruvananthapuram', state: 'Kerala', country: 'India', lat: 8.4821, lon: 76.9200 },
  { code: 'CCJ', name: 'Calicut International Airport', city: 'Kozhikode', state: 'Kerala', country: 'India', lat: 11.1368, lon: 75.9553 },
  { code: 'CNN', name: 'Kannur International Airport', city: 'Kannur', state: 'Kerala', country: 'India', lat: 11.9174, lon: 75.5484 },
  { code: 'CJB', name: 'Coimbatore International Airport', city: 'Coimbatore', state: 'Tamil Nadu', country: 'India', lat: 11.0299, lon: 77.0434 },
  { code: 'TRZ', name: 'Tiruchirappalli International Airport', city: 'Tiruchirappalli', state: 'Tamil Nadu', country: 'India', lat: 10.7654, lon: 78.7097 },
  { code: 'IXM', name: 'Madurai Airport', city: 'Madurai', state: 'Tamil Nadu', country: 'India', lat: 9.8345, lon: 78.0934 },
  { code: 'VTZ', name: 'Visakhapatnam Airport', city: 'Visakhapatnam', state: 'Andhra Pradesh', country: 'India', lat: 17.7212, lon: 83.2245 },
  { code: 'VGA', name: 'Vijayawada International Airport', city: 'Vijayawada', state: 'Andhra Pradesh', country: 'India', lat: 16.5304, lon: 80.7968 },
  { code: 'TIR', name: 'Tirupati Airport', city: 'Tirupati', state: 'Andhra Pradesh', country: 'India', lat: 13.6325, lon: 79.5433 },
  { code: 'IXE', name: 'Mangalore International Airport', city: 'Mangalore', state: 'Karnataka', country: 'India', lat: 12.9613, lon: 74.8900 },
  { code: 'IXA', name: 'Maharaja Bir Bikram Airport', city: 'Agartala', state: 'Tripura', country: 'India', lat: 23.8869, lon: 91.2404 },
  { code: 'IMF', name: 'Bir Tikendrajit International Airport', city: 'Imphal', state: 'Manipur', country: 'India', lat: 24.7600, lon: 93.8967 },
  { code: 'IXS', name: 'Silchar Airport', city: 'Silchar', state: 'Assam', country: 'India', lat: 24.9125, lon: 92.9789 },
  { code: 'DIB', name: 'Dibrugarh Airport', city: 'Dibrugarh', state: 'Assam', country: 'India', lat: 27.4839, lon: 95.0178 },
  { code: 'IXZ', name: 'Veer Savarkar International Airport', city: 'Port Blair', state: 'Andaman and Nicobar', country: 'India', lat: 11.6410, lon: 92.7297 },
  { code: 'AYJ', name: 'Maharishi Valmiki International Airport', city: 'Ayodhya', state: 'Uttar Pradesh', country: 'India', lat: 26.7461, lon: 82.1528 },

  // Middle East & Gulf
  { code: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'United Arab Emirates', lat: 25.2532, lon: 55.3657 },
  { code: 'DWC', name: 'Al Maktoum International Airport', city: 'Dubai', country: 'United Arab Emirates', lat: 24.8960, lon: 55.1614 },
  { code: 'AUH', name: 'Zayed International Airport', city: 'Abu Dhabi', country: 'United Arab Emirates', lat: 24.4330, lon: 54.6511 },
  { code: 'SHJ', name: 'Sharjah International Airport', city: 'Sharjah', country: 'United Arab Emirates', lat: 25.3286, lon: 55.5172 },
  { code: 'DOH', name: 'Hamad International Airport', city: 'Doha', country: 'Qatar', lat: 25.2731, lon: 51.6081 },
  { code: 'BAH', name: 'Bahrain International Airport', city: 'Manama', country: 'Bahrain', lat: 26.2708, lon: 50.6336 },
  { code: 'KWI', name: 'Kuwait International Airport', city: 'Kuwait City', country: 'Kuwait', lat: 29.2269, lon: 47.9789 },
  { code: 'MCT', name: 'Muscat International Airport', city: 'Muscat', country: 'Oman', lat: 23.5933, lon: 58.2844 },
  { code: 'RUH', name: 'King Khalid International Airport', city: 'Riyadh', country: 'Saudi Arabia', lat: 24.9576, lon: 46.6988 },
  { code: 'JED', name: 'King Abdulaziz International Airport', city: 'Jeddah', country: 'Saudi Arabia', lat: 21.6796, lon: 39.1565 },
  { code: 'MED', name: 'Prince Mohammad Bin Abdulaziz International Airport', city: 'Medina', country: 'Saudi Arabia', lat: 24.5534, lon: 39.7051 },

  // Southeast Asia & East Asia
  { code: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore', lat: 1.3644, lon: 103.9915 },
  { code: 'BKK', name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'Thailand', lat: 13.6900, lon: 100.7501 },
  { code: 'DMK', name: 'Don Mueang International Airport', city: 'Bangkok', country: 'Thailand', lat: 13.9126, lon: 100.6067 },
  { code: 'HKT', name: 'Phuket International Airport', city: 'Phuket', country: 'Thailand', lat: 8.1132, lon: 98.3169 },
  { code: 'CNX', name: 'Chiang Mai International Airport', city: 'Chiang Mai', country: 'Thailand', lat: 18.7668, lon: 98.9626 },
  { code: 'KUL', name: 'Kuala Lumpur International Airport', city: 'Kuala Lumpur', country: 'Malaysia', lat: 2.7456, lon: 101.7072 },
  { code: 'PEN', name: 'Penang International Airport', city: 'George Town', country: 'Malaysia', lat: 5.2971, lon: 100.2769 },
  { code: 'DPS', name: 'Ngurah Rai International Airport', city: 'Denpasar / Bali', country: 'Indonesia', lat: -8.7482, lon: 115.1672 },
  { code: 'CGK', name: 'Soekarno-Hatta International Airport', city: 'Jakarta', country: 'Indonesia', lat: -6.1256, lon: 106.6559 },
  { code: 'HAN', name: 'Noi Bai International Airport', city: 'Hanoi', country: 'Vietnam', lat: 21.2212, lon: 105.8072 },
  { code: 'SGN', name: 'Tan Son Nhat International Airport', city: 'Ho Chi Minh City', country: 'Vietnam', lat: 10.8188, lon: 106.6519 },
  { code: 'DAD', name: 'Da Nang International Airport', city: 'Da Nang', country: 'Vietnam', lat: 16.0439, lon: 108.1994 },
  { code: 'MNL', name: 'Ninoy Aquino International Airport', city: 'Manila', country: 'Philippines', lat: 14.5086, lon: 121.0194 },
  { code: 'HKG', name: 'Hong Kong International Airport', city: 'Hong Kong', country: 'Hong Kong', lat: 22.3080, lon: 113.9185 },
  { code: 'TPE', name: 'Taiwan Taoyuan International Airport', city: 'Taipei', country: 'Taiwan', lat: 25.0797, lon: 121.2342 },
  { code: 'HND', name: 'Haneda Airport (Tokyo International)', city: 'Tokyo', country: 'Japan', lat: 35.5494, lon: 139.7798 },
  { code: 'NRT', name: 'Narita International Airport', city: 'Tokyo', country: 'Japan', lat: 35.7720, lon: 140.3929 },
  { code: 'KIX', name: 'Kansai International Airport', city: 'Osaka', country: 'Japan', lat: 34.4347, lon: 135.2441 },
  { code: 'ITM', name: 'Itami Airport (Osaka International)', city: 'Osaka', country: 'Japan', lat: 34.7855, lon: 135.4382 },
  { code: 'CTS', name: 'New Chitose Airport', city: 'Sapporo', country: 'Japan', lat: 42.7752, lon: 141.6923 },
  { code: 'ICN', name: 'Incheon International Airport', city: 'Seoul', country: 'South Korea', lat: 37.4602, lon: 126.4407 },
  { code: 'GMP', name: 'Gimpo International Airport', city: 'Seoul', country: 'South Korea', lat: 37.5583, lon: 126.7906 },
  { code: 'PEK', name: 'Beijing Capital International Airport', city: 'Beijing', country: 'China', lat: 40.0799, lon: 116.6031 },
  { code: 'PKX', name: 'Beijing Daxing International Airport', city: 'Beijing', country: 'China', lat: 39.5098, lon: 116.4105 },
  { code: 'PVG', name: 'Shanghai Pudong International Airport', city: 'Shanghai', country: 'China', lat: 31.1443, lon: 121.8083 },
  { code: 'CAN', name: 'Guangzhou Baiyun International Airport', city: 'Guangzhou', country: 'China', lat: 23.3924, lon: 113.2988 },

  // Europe
  { code: 'LHR', name: 'Heathrow Airport', city: 'London', country: 'United Kingdom', lat: 51.4700, lon: -0.4543 },
  { code: 'LGW', name: 'Gatwick Airport', city: 'London', country: 'United Kingdom', lat: 51.1537, lon: -0.1821 },
  { code: 'STN', name: 'London Stansted Airport', city: 'London', country: 'United Kingdom', lat: 51.8860, lon: 0.2389 },
  { code: 'MAN', name: 'Manchester Airport', city: 'Manchester', country: 'United Kingdom', lat: 53.3537, lon: -2.2750 },
  { code: 'EDI', name: 'Edinburgh Airport', city: 'Edinburgh', country: 'United Kingdom', lat: 55.9500, lon: -3.3725 },
  { code: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France', lat: 49.0097, lon: 2.5479 },
  { code: 'ORY', name: 'Orly Airport', city: 'Paris', country: 'France', lat: 48.7262, lon: 2.3652 },
  { code: 'NCE', name: 'Nice Côte d\'Azur Airport', city: 'Nice', country: 'France', lat: 43.6584, lon: 7.2159 },
  { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany', lat: 50.0379, lon: 8.5622 },
  { code: 'MUC', name: 'Munich Airport', city: 'Munich', country: 'Germany', lat: 48.3537, lon: 11.7750 },
  { code: 'BER', name: 'Berlin Brandenburg Airport', city: 'Berlin', country: 'Germany', lat: 52.3667, lon: 13.5033 },
  { code: 'AMS', name: 'Amsterdam Airport Schiphol', city: 'Amsterdam', country: 'Netherlands', lat: 52.3105, lon: 4.7683 },
  { code: 'ZRH', name: 'Zurich Airport', city: 'Zurich', country: 'Switzerland', lat: 47.4582, lon: 8.5555 },
  { code: 'GVA', name: 'Geneva Airport', city: 'Geneva', country: 'Switzerland', lat: 46.2370, lon: 6.1092 },
  { code: 'VIE', name: 'Vienna International Airport', city: 'Vienna', country: 'Austria', lat: 48.1103, lon: 16.5697 },
  { code: 'FCO', name: 'Leonardo da Vinci-Fiumicino Airport', city: 'Rome', country: 'Italy', lat: 41.8003, lon: 12.2389 },
  { code: 'MXP', name: 'Milan Malpensa Airport', city: 'Milan', country: 'Italy', lat: 45.6301, lon: 8.7255 },
  { code: 'VCE', name: 'Venice Marco Polo Airport', city: 'Venice', country: 'Italy', lat: 45.5053, lon: 12.3519 },
  { code: 'MAD', name: 'Adolfo Suárez Madrid-Barajas Airport', city: 'Madrid', country: 'Spain', lat: 40.4839, lon: -3.5680 },
  { code: 'BCN', name: 'Josep Tarradellas Barcelona-El Prat Airport', city: 'Barcelona', country: 'Spain', lat: 41.2974, lon: 2.0833 },
  { code: 'AGP', name: 'Málaga-Costa del Sol Airport', city: 'Málaga', country: 'Spain', lat: 36.6749, lon: -4.4991 },
  { code: 'LIS', name: 'Humberto Delgado Airport (Lisbon)', city: 'Lisbon', country: 'Portugal', lat: 38.7742, lon: -9.1342 },
  { code: 'OPO', name: 'Francisco Sá Carneiro Airport', city: 'Porto', country: 'Portugal', lat: 41.2421, lon: -8.6786 },
  { code: 'ATH', name: 'Athens International Airport', city: 'Athens', country: 'Greece', lat: 37.9364, lon: 23.9472 },
  { code: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'Turkey', lat: 41.2753, lon: 28.7519 },
  { code: 'SAW', name: 'Sabiha Gökçen International Airport', city: 'Istanbul', country: 'Turkey', lat: 40.8986, lon: 29.3092 },
  { code: 'DUB', name: 'Dublin Airport', city: 'Dublin', country: 'Ireland', lat: 53.4264, lon: -6.2499 },
  { code: 'CPH', name: 'Copenhagen Airport', city: 'Copenhagen', country: 'Denmark', lat: 55.6180, lon: 12.6508 },
  { code: 'ARN', name: 'Stockholm Arlanda Airport', city: 'Stockholm', country: 'Sweden', lat: 59.6498, lon: 17.9238 },
  { code: 'OSL', name: 'Oslo Airport, Gardermoen', city: 'Oslo', country: 'Norway', lat: 60.1976, lon: 11.1004 },
  { code: 'HEL', name: 'Helsinki-Vantaa Airport', city: 'Helsinki', country: 'Finland', lat: 60.3172, lon: 24.9633 },
  { code: 'BRU', name: 'Brussels Airport', city: 'Brussels', country: 'Belgium', lat: 50.9014, lon: 4.4844 },
  { code: 'PRG', name: 'Václav Havel Airport Prague', city: 'Prague', country: 'Czech Republic', lat: 50.1008, lon: 14.2600 },
  { code: 'BUD', name: 'Budapest Ferenc Liszt International Airport', city: 'Budapest', country: 'Hungary', lat: 47.4369, lon: 19.2556 },
  { code: 'WAW', name: 'Warsaw Chopin Airport', city: 'Warsaw', country: 'Poland', lat: 52.1672, lon: 20.9679 },

  // Americas (USA, Canada, Latin America)
  { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'United States', lat: 40.6413, lon: -73.7781 },
  { code: 'EWR', name: 'Newark Liberty International Airport', city: 'New York / Newark', country: 'United States', lat: 40.6895, lon: -74.1745 },
  { code: 'LGA', name: 'LaGuardia Airport', city: 'New York', country: 'United States', lat: 40.7769, lon: -73.8740 },
  { code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'United States', lat: 33.9416, lon: -118.4085 },
  { code: 'SFO', name: 'San Francisco International Airport', city: 'San Francisco', country: 'United States', lat: 37.6213, lon: -122.3790 },
  { code: 'ORD', name: 'O\'Hare International Airport', city: 'Chicago', country: 'United States', lat: 41.9742, lon: -87.9073 },
  { code: 'MIA', name: 'Miami International Airport', city: 'Miami', country: 'United States', lat: 25.7959, lon: -80.2870 },
  { code: 'DFW', name: 'Dallas/Fort Worth International Airport', city: 'Dallas / Fort Worth', country: 'United States', lat: 32.8998, lon: -97.0403 },
  { code: 'SEA', name: 'Seattle-Tacoma International Airport', city: 'Seattle', country: 'United States', lat: 47.4502, lon: -122.3088 },
  { code: 'BOS', name: 'Logan International Airport', city: 'Boston', country: 'United States', lat: 42.3656, lon: -71.0096 },
  { code: 'ATL', name: 'Hartsfield-Jackson Atlanta International Airport', city: 'Atlanta', country: 'United States', lat: 33.6407, lon: -84.4277 },
  { code: 'LAS', name: 'Harry Reid International Airport', city: 'Las Vegas', country: 'United States', lat: 36.0840, lon: -115.1537 },
  { code: 'MCO', name: 'Orlando International Airport', city: 'Orlando', country: 'United States', lat: 28.4312, lon: -81.3081 },
  { code: 'DEN', name: 'Denver International Airport', city: 'Denver', country: 'United States', lat: 39.8561, lon: -104.6737 },
  { code: 'IAH', name: 'George Bush Intercontinental Airport', city: 'Houston', country: 'United States', lat: 29.9902, lon: -95.3368 },
  { code: 'PHX', name: 'Phoenix Sky Harbor International Airport', city: 'Phoenix', country: 'United States', lat: 33.4373, lon: -112.0078 },
  { code: 'SAN', name: 'San Diego International Airport', city: 'San Diego', country: 'United States', lat: 32.7338, lon: -117.1933 },
  { code: 'IAD', name: 'Washington Dulles International Airport', city: 'Washington D.C.', country: 'United States', lat: 38.9531, lon: -77.4565 },
  { code: 'YYZ', name: 'Toronto Pearson International Airport', city: 'Toronto', country: 'Canada', lat: 43.6777, lon: -79.6248 },
  { code: 'YVR', name: 'Vancouver International Airport', city: 'Vancouver', country: 'Canada', lat: 49.1967, lon: -123.1815 },
  { code: 'YUL', name: 'Montréal-Trudeau International Airport', city: 'Montreal', country: 'Canada', lat: 45.4657, lon: -73.7455 },
  { code: 'YYC', name: 'Calgary International Airport', city: 'Calgary', country: 'Canada', lat: 51.1215, lon: -114.0076 },
  { code: 'MEX', name: 'Mexico City International Airport', city: 'Mexico City', country: 'Mexico', lat: 19.4361, lon: -99.0719 },
  { code: 'CUN', name: 'Cancún International Airport', city: 'Cancún', country: 'Mexico', lat: 21.0365, lon: -86.8771 },
  { code: 'GRU', name: 'São Paulo/Guarulhos International Airport', city: 'São Paulo', country: 'Brazil', lat: -23.4356, lon: -46.4731 },
  { code: 'GIG', name: 'Rio de Janeiro/Galeão International Airport', city: 'Rio de Janeiro', country: 'Brazil', lat: -22.8089, lon: -43.2436 },
  { code: 'EZE', name: 'Ministro Pistarini International Airport (Ezeiza)', city: 'Buenos Aires', country: 'Argentina', lat: -34.8222, lon: -58.5358 },
  { code: 'SCL', name: 'Arturo Merino Benítez International Airport', city: 'Santiago', country: 'Chile', lat: -33.3928, lon: -70.7858 },
  { code: 'BOG', name: 'El Dorado International Airport', city: 'Bogota', country: 'Colombia', lat: 4.7016, lon: -74.1469 },
  { code: 'LIM', name: 'Jorge Chávez International Airport', city: 'Lima', country: 'Peru', lat: -12.0219, lon: -77.1143 },

  // Australia & New Zealand & Africa
  { code: 'SYD', name: 'Sydney Kingsford Smith Airport', city: 'Sydney', country: 'Australia', lat: -33.9461, lon: 151.1772 },
  { code: 'MEL', name: 'Melbourne Airport', city: 'Melbourne', country: 'Australia', lat: -37.6690, lon: 144.8410 },
  { code: 'BNE', name: 'Brisbane Airport', city: 'Brisbane', country: 'Australia', lat: -27.3942, lon: 153.1218 },
  { code: 'PER', name: 'Perth Airport', city: 'Perth', country: 'Australia', lat: -31.9385, lon: 115.9672 },
  { code: 'ADL', name: 'Adelaide Airport', city: 'Adelaide', country: 'Australia', lat: -34.9450, lon: 138.5306 },
  { code: 'AKL', name: 'Auckland Airport', city: 'Auckland', country: 'New Zealand', lat: -37.0082, lon: 174.7850 },
  { code: 'CHC', name: 'Christchurch Airport', city: 'Christchurch', country: 'New Zealand', lat: -43.4876, lon: 172.5370 },
  { code: 'JNB', name: 'O. R. Tambo International Airport', city: 'Johannesburg', country: 'South Africa', lat: -26.1367, lon: 28.2411 },
  { code: 'CPT', name: 'Cape Town International Airport', city: 'Cape Town', country: 'South Africa', lat: -33.9715, lon: 18.6021 },
  { code: 'CAI', name: 'Cairo International Airport', city: 'Cairo', country: 'Egypt', lat: 30.1219, lon: 31.4056 },
  { code: 'NBO', name: 'Jomo Kenyatta International Airport', city: 'Nairobi', country: 'Kenya', lat: -1.3192, lon: 36.9278 },
  { code: 'CMN', name: 'Mohammed V International Airport', city: 'Casablanca', country: 'Morocco', lat: 33.3675, lon: -7.5898 },
  { code: 'RAK', name: 'Marrakesh Menara Airport', city: 'Marrakech', country: 'Morocco', lat: 31.6069, lon: -8.0363 }
];

/**
 * Search airports by query string (matching code, city, name, country, or state)
 */
export function searchAirports(query, limit = 8) {
  if (!query || typeof query !== 'string') return [];
  const rawQ = query.trim();
  if (rawQ.length < 1) return [];

  // Check parenthesized code e.g. "Delhi (DEL)" -> code "DEL", city "delhi"
  const parenMatch = rawQ.match(/\(([A-Za-z]{3})\)/);
  const explicitCode = parenMatch ? parenMatch[1].toLowerCase() : '';
  const cleanQ = rawQ.replace(/\s*\([A-Za-z0-9]+\)/g, '').trim().toLowerCase();
  const q = cleanQ || rawQ.toLowerCase();

  // Match exact code first, then prefix, then substrings
  const exactCodeMatches = [];
  const prefixCodeMatches = [];
  const nameCityMatches = [];

  for (const a of AIRPORTS) {
    const code = a.code.toLowerCase();
    const city = a.city.toLowerCase();
    const name = a.name.toLowerCase();
    const country = a.country.toLowerCase();
    const state = (a.state || '').toLowerCase();

    if (code === explicitCode || code === q) {
      exactCodeMatches.push(a);
    } else if (code.startsWith(q) || (explicitCode && code.startsWith(explicitCode))) {
      prefixCodeMatches.push(a);
    } else if (
      city.includes(q) || 
      q.includes(city) ||
      name.includes(q) || 
      country.includes(q) || 
      state.includes(q)
    ) {
      nameCityMatches.push(a);
    }
  }


  // Sort name/city matches so that startsWith matches appear before contains
  nameCityMatches.sort((a, b) => {
    const aCityStart = a.city.toLowerCase().startsWith(q) ? 1 : 0;
    const bCityStart = b.city.toLowerCase().startsWith(q) ? 1 : 0;
    return bCityStart - aCityStart;
  });

  const combined = [...exactCodeMatches, ...prefixCodeMatches, ...nameCityMatches];
  // Deduplicate by code
  const seen = new Set();
  const results = [];
  for (const item of combined) {
    if (!seen.has(item.code)) {
      seen.add(item.code);
      results.push({
        place_id: `airport-${item.code}`,
        code: item.code,
        name: item.name,
        city: item.city,
        state: item.state || '',
        country: item.country,
        lat: String(item.lat),
        lon: String(item.lon),
        display_name: `${item.name} (${item.code}), ${item.city}, ${item.country}`,
        short_name: `${item.city} (${item.code})`,
        type: 'airport'
      });
      if (results.length >= limit) break;
    }
  }

  return results;
}
