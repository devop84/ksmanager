-- ============================================
-- SEED DATA FOR KSMANAGER
-- ============================================
-- This file contains seed data for development/testing
-- Run this after running schema.sql
-- ============================================

-- Enable UUID extension if needed
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS
-- ============================================

-- NOTE: Admin user is NOT created here because password hashing requires JavaScript.
-- To create the admin user (email: admin@ksmanager.com, password: password):
-- Run: npm run create-admin
-- 
-- This will create/update the admin user with the proper password hash.

-- ============================================
-- PAYMENT METHODS
-- ============================================

INSERT INTO payment_methods (name, description) VALUES
('Cash', 'Cash payments'),
('Credit Card', 'Credit card transactions'),
('Debit Card', 'Debit card transactions'),
('Bank Transfer', 'Wire transfer or bank transfer'),
('PayPal', 'PayPal online payments'),
('Stripe', 'Stripe payment gateway'),
('Check', 'Check payments'),
('Cryptocurrency', 'Cryptocurrency payments')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- TRANSACTION TYPES
-- ============================================

INSERT INTO transaction_types (code, label, direction, description) VALUES
('SERVICE_INCOME', 'Service Income', 'income', 'Income from services provided'),
('RENTAL_INCOME', 'Rental Income', 'income', 'Income from equipment rentals'),
('LESSON_INCOME', 'Lesson Income', 'income', 'Income from lessons'),
('STORAGE_INCOME', 'Storage Income', 'income', 'Income from storage services'),
('COMMISSION_INCOME', 'Commission Income', 'income', 'Income from commissions'),
('RENT_EXPENSE', 'Rent Expense', 'expense', 'Rent payments'),
('SALARY_EXPENSE', 'Salary Expense', 'expense', 'Employee salaries'),
('UTILITY_EXPENSE', 'Utility Expense', 'expense', 'Utility bills'),
('EQUIPMENT_EXPENSE', 'Equipment Expense', 'expense', 'Equipment purchases and maintenance'),
('MARKETING_EXPENSE', 'Marketing Expense', 'expense', 'Marketing and advertising costs'),
('INSURANCE_EXPENSE', 'Insurance Expense', 'expense', 'Insurance payments'),
('TAX_EXPENSE', 'Tax Expense', 'expense', 'Tax payments'),
('BANK_TRANSFER', 'Bank Transfer', 'transfer', 'Internal bank transfers'),
('ACCOUNT_TRANSFER', 'Account Transfer', 'transfer', 'Account to account transfers')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- HOTELS
-- ============================================

INSERT INTO hotels (name, phone, address, note) VALUES
('Beach Paradise Resort', '+1 555-0101', '123 Ocean Drive, Miami Beach, FL 33139', 'Premium beachfront resort'),
('Tropical Breeze Hotel', '+1 555-0102', '456 Palm Avenue, Key West, FL 33040', 'Boutique hotel'),
('Surfside Inn', '+1 555-0103', '789 Beach Road, San Diego, CA 92109', 'Budget-friendly oceanfront hotel'),
('Coastal Dreams Resort', '+1 555-0104', '321 Coastal Highway, Myrtle Beach, SC 29572', 'Family-friendly resort'),
('Oceanview Lodge', '+1 555-0105', '654 Marina Way, Newport, RI 02840', 'Luxury waterfront hotel'),
('Sunset Harbor Hotel', '+1 555-0106', '987 Harbor Drive, Cape Cod, MA 02601', 'Historic harbor hotel'),
('Windward Beach Resort', '+1 555-0107', '147 Oceanfront Avenue, Outer Banks, NC 27954', 'Beachside resort'),
('Aqua Blue Hotel', '+1 555-0108', '258 Water Street, Charleston, SC 29401', 'Downtown hotel'),
('Tidewater Inn', '+1 555-0109', '369 Bay Boulevard, Virginia Beach, VA 23451', 'Beachfront inn'),
('Seaside Suites', '+1 555-0110', '741 Beach Walk, Clearwater, FL 33767', 'All-suite hotel'),
('Marina Bay Resort', '+1 555-0111', '852 Dock Street, Fort Lauderdale, FL 33316', 'Marina resort'),
('Coastline Hotel', '+1 555-0112', '963 Shore Drive, Galveston, TX 77550', 'Gulf coast hotel'),
('Island Paradise Resort', '+1 555-0113', '159 Island Road, Hawaii, HI 96734', 'Tropical resort'),
('Beachcomber Inn', '+1 555-0114', '357 Sand Dune Lane, Nags Head, NC 27959', 'Oceanfront inn'),
('Sandy Shores Hotel', '+1 555-0115', '468 Beachcomber Avenue, Daytona Beach, FL 32118', 'Family hotel'),
('Pacific View Resort', '+1 555-0116', '579 Pacific Highway, Santa Monica, CA 90401', 'Pacific coast resort'),
('Harbor Lights Hotel', '+1 555-0117', '680 Harbor Lane, Seattle, WA 98101', 'Downtown harbor hotel'),
('Bayfront Lodge', '+1 555-0118', '791 Bayfront Drive, Monterey, CA 93940', 'Monterey Bay hotel'),
('Tropical Haven Resort', '+1 555-0119', '802 Palm Tree Boulevard, Cancun, Mexico', 'International resort'),
('Beachside Bungalows', '+1 555-0120', '913 Beach Path, Tulum, Mexico', 'Eco-friendly bungalows'),
('Azure Waters Resort', '+1 555-0121', '124 Ocean Vista, Puerto Vallarta, Mexico', 'Luxury resort'),
('Coral Reef Hotel', '+1 555-0122', '235 Reef Road, Key Largo, FL 33037', 'Dive resort'),
('Sunrise Beach Resort', '+1 555-0123', '346 Sunrise Avenue, Miami, FL 33139', 'Miami Beach resort'),
('Ocean Breeze Hotel', '+1 555-0124', '457 Breeze Street, Malibu, CA 90265', 'Malibu beach hotel'),
('Coastal Retreat', '+1 555-0125', '568 Retreat Way, Big Sur, CA 93920', 'Clifftop retreat')
ON CONFLICT DO NOTHING;

-- ============================================
-- AGENCIES (150 agencies)
-- ============================================

INSERT INTO agencies (name, phone, email, commission, note) VALUES
('Adventure Travel Co.', '+1 555-1001', 'info@adventuretravel.com', 15.00, 'Adventure travel specialist'),
('Beach Tours Agency', '+1 555-1002', 'contact@beachtours.com', 12.50, 'Beach vacation packages'),
('Ocean Explorers', '+1 555-1003', 'hello@oceanexplorers.com', 18.00, 'Ocean activities and tours'),
('Sunset Travel', '+1 555-1004', 'info@sunsettravel.com', 10.00, 'Affordable travel packages'),
('Tropical Getaways', '+1 555-1005', 'sales@tropicalgetaways.com', 20.00, 'Luxury tropical vacations'),
('Wave Riders Tours', '+1 555-1006', 'book@waveriders.com', 15.50, 'Surf and water sports'),
('Coastal Adventures', '+1 555-1007', 'info@coastaladventures.com', 14.00, 'Coastal activity tours'),
('Island Hopper Travel', '+1 555-1008', 'contact@islandhopper.com', 16.00, 'Island vacation specialist'),
('Aqua Sports Agency', '+1 555-1009', 'info@aquasports.com', 17.50, 'Water sports equipment and tours'),
('Beach Life Tours', '+1 555-1010', 'hello@beachlife.com', 11.00, 'Beach lifestyle experiences'),
('Paradise Travel', '+1 555-1011', 'sales@paradisetravel.com', 19.00, 'Premium travel experiences'),
('Surf and Turf Agency', '+1 555-1012', 'info@surfandturf.com', 13.00, 'Mixed activity packages'),
('Ocean Dreams Travel', '+1 555-1013', 'contact@oceandreams.com', 15.00, 'Ocean-focused vacations'),
('Sandy Shores Tours', '+1 555-1014', 'info@sandyshores.com', 12.00, 'Beach destination tours'),
('Tide Pool Adventures', '+1 555-1015', 'book@tidepool.com', 14.50, 'Marine life tours'),
('Bay View Travel', '+1 555-1016', 'info@bayview.com', 16.50, 'Bay area travel services'),
('Harbor Tours Co.', '+1 555-1017', 'contact@harbortours.com', 10.50, 'Harbor and marina tours'),
('Beach Bum Travel', '+1 555-1018', 'hello@beachbum.com', 11.50, 'Casual beach vacations'),
('Coral Travel Agency', '+1 555-1019', 'info@coraltravel.com', 18.50, 'Dive and snorkel tours'),
('Pacific Wave Tours', '+1 555-1020', 'sales@pacificwave.com', 17.00, 'Pacific coast tours'),
('Seashell Travel', '+1 555-1021', 'info@seashell.com', 13.50, 'Family beach vacations'),
('Marina Bay Tours', '+1 555-1022', 'contact@marinabay.com', 15.00, 'Marina and yacht tours'),
('Sun & Sea Agency', '+1 555-1023', 'info@sunandsea.com', 14.00, 'Beach resort packages'),
('Oceanic Travel', '+1 555-1024', 'book@oceanic.com', 16.00, 'Ocean travel specialist'),
('Beachcomber Tours', '+1 555-1025', 'info@beachcomber.com', 12.50, 'Beach exploration tours'),
('Tropical Winds Travel', '+1 555-1026', 'hello@tropicalwinds.com', 19.50, 'Tropical destination expert'),
('Coastal Cruise Agency', '+1 555-1027', 'sales@coastalcruise.com', 18.00, 'Coastal cruise packages'),
('Sandy Path Travel', '+1 555-1028', 'info@sandypath.com', 11.00, 'Budget beach travel'),
('Aqua Blue Tours', '+1 555-1029', 'contact@aquablue.com', 17.00, 'Water activity tours'),
('Beach Vista Travel', '+1 555-1030', 'info@beachvista.com', 15.50, 'Scenic beach tours'),
('Wave Chaser Agency', '+1 555-1031', 'book@wavechaser.com', 13.00, 'Surf tours and lessons'),
('Ocean Path Travel', '+1 555-1032', 'info@oceanpath.com', 14.50, 'Ocean route packages'),
('Harbor Light Tours', '+1 555-1033', 'hello@harborlight.com', 16.50, 'Evening harbor tours'),
('Beachfront Travel Co.', '+1 555-1034', 'sales@beachfront.com', 20.00, 'Beachfront resort packages'),
('Island Breeze Agency', '+1 555-1035', 'info@islandbreeze.com', 18.50, 'Island vacation packages'),
('Surfside Travel', '+1 555-1036', 'contact@surfside.com', 12.00, 'Surf destination specialist'),
('Marine Life Tours', '+1 555-1037', 'info@marinelife.com', 17.50, 'Marine wildlife tours'),
('Coast Explorer Travel', '+1 555-1038', 'book@coastexplorer.com', 15.00, 'Coastal exploration'),
('Beach Paradise Tours', '+1 555-1039', 'info@beachparadise.com', 19.00, 'Premium beach experiences'),
('Tidal Wave Agency', '+1 555-1040', 'hello@tidalwave.com', 11.50, 'Water sports packages'),
('Ocean Vista Travel', '+1 555-1041', 'sales@oceanvista.com', 16.00, 'Ocean view accommodations'),
('Sandy Beach Tours', '+1 555-1042', 'info@sandybeach.com', 14.00, 'Beach destination tours'),
('Coral Reef Travel', '+1 555-1043', 'contact@coralreef.com', 18.00, 'Coral reef tours'),
('Beach Haven Agency', '+1 555-1044', 'info@beachhaven.com', 13.50, 'Beach resort bookings'),
('Pacific Shore Tours', '+1 555-1045', 'book@pacificshore.com', 17.00, 'Pacific shore experiences'),
('Island View Travel', '+1 555-1046', 'info@islandview.com', 15.50, 'Island view packages'),
('Wave Break Agency', '+1 555-1047', 'hello@wavebreak.com', 12.50, 'Surf break tours'),
('Marina View Travel', '+1 555-1048', 'sales@marinaview.com', 20.00, 'Marina view accommodations'),
('Beach Escape Tours', '+1 555-1049', 'info@beachescape.com', 14.50, 'Beach getaway packages'),
('Ocean Current Agency', '+1 555-1050', 'contact@oceancurrent.com', 16.50, 'Ocean activity tours'),
('Sunset Beach Travel', '+1 555-1051', 'info@sunsetbeach.com', 11.00, 'Sunset beach tours'),
('Harbor View Tours', '+1 555-1052', 'book@harborview.com', 19.50, 'Harbor view experiences'),
('Beachside Agency', '+1 555-1053', 'info@beachside.com', 17.50, 'Beachside accommodations'),
('Tropical Coast Travel', '+1 555-1054', 'hello@tropicalcoast.com', 13.00, 'Tropical coast tours'),
('Aqua Vista Tours', '+1 555-1055', 'sales@aquavista.com', 18.50, 'Water view packages'),
('Coastal Breeze Agency', '+1 555-1056', 'info@coastalbreeze.com', 15.00, 'Coastal breeze tours'),
('Beach Bliss Travel', '+1 555-1057', 'contact@beachbliss.com', 12.00, 'Beach vacation bliss'),
('Ocean Breeze Tours', '+1 555-1058', 'info@oceanbreeze.com', 14.00, 'Ocean breeze experiences'),
('Surf Paradise Agency', '+1 555-1059', 'book@surfparadise.com', 16.00, 'Surf paradise tours'),
('Marina Breeze Travel', '+1 555-1060', 'info@marinabreeze.com', 20.00, 'Marina breeze packages'),
('Island Paradise Tours', '+1 555-1061', 'hello@islandparadise.com', 18.00, 'Island paradise packages'),
('Beach Dream Agency', '+1 555-1062', 'sales@beachdream.com', 11.50, 'Beach dream vacations'),
('Ocean Path Tours', '+1 555-1063', 'info@oceanpath.com', 17.00, 'Ocean path experiences'),
('Sandy Dreams Travel', '+1 555-1064', 'contact@sandydreams.com', 13.50, 'Sandy beach dreams'),
('Coral Coast Agency', '+1 555-1065', 'info@coralcoast.com', 19.00, 'Coral coast tours'),
('Beach Wave Tours', '+1 555-1066', 'book@beachwave.com', 15.50, 'Beach wave packages'),
('Pacific Paradise Travel', '+1 555-1067', 'info@pacificparadise.com', 12.50, 'Pacific paradise tours'),
('Harbor Dreams Agency', '+1 555-1068', 'hello@harbordreams.com', 18.50, 'Harbor dream packages'),
('Beach Star Tours', '+1 555-1069', 'sales@beachstar.com', 14.50, 'Star beach experiences'),
('Ocean Star Travel', '+1 555-1070', 'info@oceanstar.com', 16.50, 'Ocean star packages'),
('Tropical Star Agency', '+1 555-1071', 'contact@tropicalstar.com', 10.00, 'Tropical star tours'),
('Beach Sunset Tours', '+1 555-1072', 'info@beachsunset.com', 17.50, 'Beach sunset experiences'),
('Marina Star Travel', '+1 555-1073', 'book@marinastar.com', 13.00, 'Marina star packages'),
('Island Star Agency', '+1 555-1074', 'info@islandstar.com', 19.50, 'Island star tours'),
('Coastal Star Tours', '+1 555-1075', 'hello@coastalstar.com', 11.00, 'Coastal star experiences'),
('Beach Moon Travel', '+1 555-1076', 'sales@beachmoon.com', 18.00, 'Beach moon packages'),
('Ocean Moon Agency', '+1 555-1077', 'info@oceanmoon.com', 15.00, 'Ocean moon tours'),
('Tropical Moon Tours', '+1 555-1078', 'contact@tropicalmoon.com', 12.00, 'Tropical moon experiences'),
('Beach Sun Travel', '+1 555-1079', 'info@beachsun.com', 14.00, 'Beach sun packages'),
('Ocean Sun Agency', '+1 555-1080', 'book@oceansun.com', 16.00, 'Ocean sun tours'),
('Marina Sun Tours', '+1 555-1081', 'info@marinasun.com', 20.00, 'Marina sun experiences'),
('Island Sun Travel', '+1 555-1082', 'hello@islandsun.com', 17.00, 'Island sun packages'),
('Beach Sky Agency', '+1 555-1083', 'sales@beachsky.com', 13.50, 'Beach sky tours'),
('Ocean Sky Tours', '+1 555-1084', 'info@oceansky.com', 19.00, 'Ocean sky experiences'),
('Tropical Sky Travel', '+1 555-1085', 'contact@tropicalsky.com', 11.50, 'Tropical sky packages'),
('Coastal Sky Agency', '+1 555-1086', 'info@coastalsky.com', 18.50, 'Coastal sky tours'),
('Beach Cloud Tours', '+1 555-1087', 'book@beachcloud.com', 15.50, 'Beach cloud experiences'),
('Ocean Cloud Travel', '+1 555-1088', 'info@oceancloud.com', 12.50, 'Ocean cloud packages'),
('Marina Cloud Agency', '+1 555-1089', 'hello@marinacloud.com', 14.50, 'Marina cloud tours'),
('Island Cloud Tours', '+1 555-1090', 'sales@islandcloud.com', 16.50, 'Island cloud experiences'),
('Beach Wind Travel', '+1 555-1091', 'info@beachwind.com', 10.00, 'Beach wind packages'),
('Ocean Wind Agency', '+1 555-1092', 'contact@oceanwind.com', 17.50, 'Ocean wind tours'),
('Tropical Wind Tours', '+1 555-1093', 'info@tropicalwind.com', 13.00, 'Tropical wind experiences'),
('Coastal Wind Travel', '+1 555-1094', 'book@coastalwind.com', 19.50, 'Coastal wind packages'),
('Beach Rain Agency', '+1 555-1095', 'info@beachrain.com', 11.00, 'Beach rain tours'),
('Ocean Rain Tours', '+1 555-1096', 'hello@oceanrain.com', 18.00, 'Ocean rain experiences'),
('Marina Rain Travel', '+1 555-1097', 'sales@marinarain.com', 15.00, 'Marina rain packages'),
('Island Rain Agency', '+1 555-1098', 'info@islandrain.com', 12.00, 'Island rain tours'),
('Beach Storm Tours', '+1 555-1099', 'contact@beachstorm.com', 14.00, 'Beach storm experiences'),
('Ocean Storm Travel', '+1 555-1100', 'info@oceanstorm.com', 16.00, 'Ocean storm packages'),
('Tropical Storm Agency', '+1 555-1101', 'book@tropicalstorm.com', 20.00, 'Tropical storm tours'),
('Coastal Storm Tours', '+1 555-1102', 'info@coastalstorm.com', 17.00, 'Coastal storm experiences'),
('Beach Calm Travel', '+1 555-1103', 'hello@beachcalm.com', 13.50, 'Beach calm packages'),
('Ocean Calm Agency', '+1 555-1104', 'sales@oceancalm.com', 19.00, 'Ocean calm tours'),
('Marina Calm Tours', '+1 555-1105', 'info@marinacalm.com', 11.50, 'Marina calm experiences'),
('Island Calm Travel', '+1 555-1106', 'contact@islandcalm.com', 18.50, 'Island calm packages'),
('Beach Peace Agency', '+1 555-1107', 'info@beachpeace.com', 15.50, 'Beach peace tours'),
('Ocean Peace Tours', '+1 555-1108', 'book@oceanpeace.com', 12.50, 'Ocean peace experiences'),
('Tropical Peace Travel', '+1 555-1109', 'info@tropicalpeace.com', 14.50, 'Tropical peace packages'),
('Coastal Peace Agency', '+1 555-1110', 'hello@coastalpeace.com', 16.50, 'Coastal peace tours'),
('Beach Joy Tours', '+1 555-1111', 'sales@beachjoy.com', 10.00, 'Beach joy experiences'),
('Ocean Joy Travel', '+1 555-1112', 'info@oceanjoy.com', 17.50, 'Ocean joy packages'),
('Marina Joy Agency', '+1 555-1113', 'contact@marinajoy.com', 13.00, 'Marina joy tours'),
('Island Joy Tours', '+1 555-1114', 'info@islandjoy.com', 19.50, 'Island joy experiences'),
('Beach Fun Travel', '+1 555-1115', 'book@beachfun.com', 11.00, 'Beach fun packages'),
('Ocean Fun Agency', '+1 555-1116', 'info@oceanfun.com', 18.00, 'Ocean fun tours'),
('Tropical Fun Tours', '+1 555-1117', 'hello@tropicalfun.com', 15.00, 'Tropical fun experiences'),
('Coastal Fun Travel', '+1 555-1118', 'sales@coastalfun.com', 12.00, 'Coastal fun packages'),
('Beach Love Agency', '+1 555-1119', 'info@beachlove.com', 14.00, 'Beach love tours'),
('Ocean Love Tours', '+1 555-1120', 'contact@oceanlove.com', 16.00, 'Ocean love experiences'),
('Marina Love Travel', '+1 555-1121', 'info@marinalove.com', 20.00, 'Marina love packages'),
('Island Love Agency', '+1 555-1122', 'book@islandlove.com', 17.00, 'Island love tours'),
('Beach Hope Tours', '+1 555-1123', 'info@beachhope.com', 13.50, 'Beach hope experiences'),
('Ocean Hope Travel', '+1 555-1124', 'hello@oceanhope.com', 19.00, 'Ocean hope packages'),
('Tropical Hope Agency', '+1 555-1125', 'sales@tropicalhope.com', 11.50, 'Tropical hope tours'),
('Coastal Hope Tours', '+1 555-1126', 'info@coastalhope.com', 18.50, 'Coastal hope experiences'),
('Beach Faith Travel', '+1 555-1127', 'contact@beachfaith.com', 15.50, 'Beach faith packages'),
('Ocean Faith Agency', '+1 555-1128', 'info@oceanfaith.com', 12.50, 'Ocean faith tours'),
('Marina Faith Tours', '+1 555-1129', 'book@marinafaith.com', 14.50, 'Marina faith experiences'),
('Island Faith Travel', '+1 555-1130', 'info@islandfaith.com', 16.50, 'Island faith packages'),
('Beach Grace Agency', '+1 555-1131', 'hello@beachgrace.com', 10.00, 'Beach grace tours'),
('Ocean Grace Tours', '+1 555-1132', 'sales@oceangrace.com', 17.50, 'Ocean grace experiences'),
('Tropical Grace Travel', '+1 555-1133', 'info@tropicalgrace.com', 13.00, 'Tropical grace packages'),
('Coastal Grace Agency', '+1 555-1134', 'contact@coastalgrace.com', 19.50, 'Coastal grace tours'),
('Beach Light Tours', '+1 555-1135', 'info@beachlight.com', 11.00, 'Beach light experiences'),
('Ocean Light Travel', '+1 555-1136', 'book@oceanlight.com', 18.00, 'Ocean light packages'),
('Marina Light Agency', '+1 555-1137', 'info@marinalight.com', 15.00, 'Marina light tours'),
('Island Light Tours', '+1 555-1138', 'hello@islandlight.com', 12.00, 'Island light experiences'),
('Beach Bright Travel', '+1 555-1139', 'sales@beachbright.com', 14.00, 'Beach bright packages'),
('Ocean Bright Agency', '+1 555-1140', 'info@oceanbright.com', 16.00, 'Ocean bright tours'),
('Tropical Bright Tours', '+1 555-1141', 'contact@tropicalbright.com', 20.00, 'Tropical bright experiences'),
('Coastal Bright Travel', '+1 555-1142', 'info@coastalbright.com', 17.00, 'Coastal bright packages'),
('Beach Shine Agency', '+1 555-1143', 'book@beachshine.com', 13.50, 'Beach shine tours'),
('Ocean Shine Tours', '+1 555-1144', 'info@oceanshine.com', 19.00, 'Ocean shine experiences'),
('Marina Shine Travel', '+1 555-1145', 'hello@marinashine.com', 11.50, 'Marina shine packages'),
('Island Shine Agency', '+1 555-1146', 'sales@islandshine.com', 18.50, 'Island shine tours'),
('Beach Glow Tours', '+1 555-1147', 'info@beachglow.com', 15.50, 'Beach glow experiences'),
('Ocean Glow Travel', '+1 555-1148', 'contact@oceanglow.com', 12.50, 'Ocean glow packages'),
('Tropical Glow Agency', '+1 555-1149', 'info@tropicalglow.com', 14.50, 'Tropical glow tours'),
('Coastal Glow Tours', '+1 555-1150', 'book@coastalglow.com', 16.50, 'Coastal glow experiences')
ON CONFLICT DO NOTHING;

-- ============================================
-- CUSTOMERS (50 customers)
-- ============================================

INSERT INTO customers (fullname, phone, email, doctype, doc, country, birthdate, hotel_id, agency_id, note) VALUES
('John Smith', '+1 555-2001', 'john.smith@email.com', 'passport', 'US123456789', 'USA', '1985-03-15', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), 'Regular customer'),
('Maria Garcia', '+1 555-2002', 'maria.garcia@email.com', 'passport', 'ES987654321', 'Spain', '1990-07-22', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), 'Prefers morning lessons'),
('David Johnson', '+1 555-2003', 'david.johnson@email.com', 'drivers_license', 'DL123456', 'USA', '1988-11-05', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), 'VIP customer'),
('Emma Wilson', '+1 555-2004', 'emma.wilson@email.com', 'passport', 'GB456789123', 'UK', '1992-01-30', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Michael Brown', '+1 555-2005', 'michael.brown@email.com', 'passport', 'CA789123456', 'Canada', '1987-09-12', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), 'First-time visitor'),
('Sophia Martinez', '+1 555-2006', 'sophia.martinez@email.com', 'passport', 'MX321654987', 'Mexico', '1995-05-18', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('James Taylor', '+1 555-2007', 'james.taylor@email.com', 'drivers_license', 'DL789456', 'USA', '1983-12-25', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), 'Repeat customer'),
('Olivia Anderson', '+1 555-2008', 'olivia.anderson@email.com', 'passport', 'AU147258369', 'Australia', '1991-08-03', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('William Thomas', '+1 555-2009', 'william.thomas@email.com', 'passport', 'FR369258147', 'France', '1989-04-20', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), 'Allergic to shellfish'),
('Isabella Jackson', '+1 555-2010', 'isabella.jackson@email.com', 'passport', 'IT741852963', 'Italy', '1994-10-07', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Benjamin White', '+1 555-2011', 'benjamin.white@email.com', 'drivers_license', 'DL456789', 'USA', '1986-06-14', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), 'Preferred instructor: Mike'),
('Charlotte Harris', '+1 555-2012', 'charlotte.harris@email.com', 'passport', 'DE852741963', 'Germany', '1993-02-28', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Daniel Martin', '+1 555-2013', 'daniel.martin@email.com', 'passport', 'BR963741852', 'Brazil', '1984-11-11', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), 'Speaks Portuguese'),
('Amelia Thompson', '+1 555-2014', 'amelia.thompson@email.com', 'passport', 'NZ159753468', 'New Zealand', '1996-09-23', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Matthew Garcia', '+1 555-2015', 'matthew.garcia@email.com', 'drivers_license', 'DL741852', 'USA', '1990-01-17', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), 'Intermediate level'),
('Mia Martinez', '+1 555-2016', 'mia.martinez@email.com', 'passport', 'AR468135792', 'Argentina', '1997-07-09', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Ethan Robinson', '+1 555-2017', 'ethan.robinson@email.com', 'passport', 'CH258147369', 'Switzerland', '1988-03-04', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), 'Family with 2 children'),
('Harper Clark', '+1 555-2018', 'harper.clark@email.com', 'passport', 'NL147369258', 'Netherlands', '1992-12-21', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Alexander Rodriguez', '+1 555-2019', 'alexander.rodriguez@email.com', 'drivers_license', 'DL369147', 'USA', '1985-08-30', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), 'Group booking'),
('Evelyn Lewis', '+1 555-2020', 'evelyn.lewis@email.com', 'passport', 'SE741963852', 'Sweden', '1994-05-16', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Lucas Lee', '+1 555-2021', 'lucas.lee@email.com', 'passport', 'KR852741963', 'South Korea', '1991-10-02', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), 'Advanced surfer'),
('Aria Walker', '+1 555-2022', 'aria.walker@email.com', 'passport', 'JP963852741', 'Japan', '1996-04-19', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Mason Hall', '+1 555-2023', 'mason.hall@email.com', 'drivers_license', 'DL963852', 'USA', '1987-12-08', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), 'Corporate booking'),
('Scarlett Allen', '+1 555-2024', 'scarlett.allen@email.com', 'passport', 'NO258963741', 'Norway', '1993-06-26', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Logan Young', '+1 555-2025', 'logan.young@email.com', 'passport', 'DK741258963', 'Denmark', '1989-02-13', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), 'Honeymoon couple'),
('Luna King', '+1 555-2026', 'luna.king@email.com', 'passport', 'FI852963741', 'Finland', '1995-11-29', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Jackson Wright', '+1 555-2027', 'jackson.wright@email.com', 'drivers_license', 'DL258741', 'USA', '1986-07-31', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), 'Special requests'),
('Ava Lopez', '+1 555-2028', 'ava.lopez@email.com', 'passport', 'PL963741258', 'Poland', '1994-03-21', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Sebastian Hill', '+1 555-2029', 'sebastian.hill@email.com', 'passport', 'CZ741963258', 'Czech Republic', '1992-09-06', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), 'Photography enthusiast'),
('Grace Scott', '+1 555-2030', 'grace.scott@email.com', 'passport', 'IE852147963', 'Ireland', '1997-01-24', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Carter Green', '+1 555-2031', 'carter.green@email.com', 'drivers_license', 'DL741369', 'USA', '1988-05-11', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), 'Beginner lessons'),
('Chloe Adams', '+1 555-2032', 'chloe.adams@email.com', 'passport', 'PT963852147', 'Portugal', '1993-08-27', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Wyatt Baker', '+1 555-2033', 'wyatt.baker@email.com', 'passport', 'GR741258369', 'Greece', '1991-12-15', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), 'Sailing experience'),
('Victoria Nelson', '+1 555-2034', 'victoria.nelson@email.com', 'passport', 'TR852963741', 'Turkey', '1996-04-02', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Owen Carter', '+1 555-2035', 'owen.carter@email.com', 'drivers_license', 'DL369852', 'USA', '1984-10-18', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), 'Long-term rental'),
('Penelope Mitchell', '+1 555-2036', 'penelope.mitchell@email.com', 'passport', 'RU963741852', 'Russia', '1990-06-05', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Julian Perez', '+1 555-2037', 'julian.perez@email.com', 'passport', 'CO741963258', 'Colombia', '1995-02-22', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), 'Group of 4'),
('Layla Roberts', '+1 555-2038', 'layla.roberts@email.com', 'passport', 'VE852147963', 'Venezuela', '1992-11-09', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Grayson Turner', '+1 555-2039', 'grayson.turner@email.com', 'drivers_license', 'DL147963', 'USA', '1987-07-28', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), 'Equipment rental'),
('Zoe Phillips', '+1 555-2040', 'zoe.phillips@email.com', 'passport', 'CL963852741', 'Chile', '1994-03-14', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Jack Campbell', '+1 555-2041', 'jack.campbell@email.com', 'passport', 'PE741258963', 'Peru', '1989-09-01', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), 'Adventure seeker'),
('Lily Parker', '+1 555-2042', 'lily.parker@email.com', 'passport', 'EC852963741', 'Ecuador', '1996-12-19', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Levi Evans', '+1 555-2043', 'levi.evans@email.com', 'drivers_license', 'DL852741', 'USA', '1985-08-06', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), 'Weekend warrior'),
('Nora Edwards', '+1 555-2044', 'nora.edwards@email.com', 'passport', 'UY963741852', 'Uruguay', '1991-05-23', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Landon Collins', '+1 555-2045', 'landon.collins@email.com', 'passport', 'PY741963258', 'Paraguay', '1993-01-10', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), 'Frequent visitor'),
('Hannah Stewart', '+1 555-2046', 'hannah.stewart@email.com', 'passport', 'BO852147963', 'Bolivia', '1997-10-04', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Nolan Sanchez', '+1 555-2047', 'nolan.sanchez@email.com', 'drivers_license', 'DL963147', 'USA', '1986-04-16', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), 'Professional photographer'),
('Aubrey Morris', '+1 555-2048', 'aubrey.morris@email.com', 'passport', 'GY963852741', 'Guyana', '1992-11-30', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL),
('Eli Rogers', '+1 555-2049', 'eli.rogers@email.com', 'passport', 'SR741258963', 'Suriname', '1988-06-13', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), 'Multi-sport enthusiast'),
('Addison Reed', '+1 555-2050', 'addison.reed@email.com', 'passport', 'FG852963741', 'French Guiana', '1995-02-26', (SELECT id FROM hotels ORDER BY RANDOM() LIMIT 1), (SELECT id FROM agencies ORDER BY RANDOM() LIMIT 1), NULL)
ON CONFLICT DO NOTHING;

-- ============================================
-- INSTRUCTORS (10 instructors)
-- ============================================

INSERT INTO instructors (fullname, phone, email, bankdetail, hourlyrate, commission, monthlyfix, note) VALUES
('Mike Johnson', '+1 555-3001', 'mike.johnson@ksmanager.com', 'Bank: Chase, Account: 1234567890', 45.00, 20.00, 2000.00, 'Senior instructor, 10+ years experience'),
('Sarah Williams', '+1 555-3002', 'sarah.williams@ksmanager.com', 'Bank: Bank of America, Account: 9876543210', 42.00, 18.00, 1800.00, 'Advanced lessons specialist'),
('Tom Rodriguez', '+1 555-3003', 'tom.rodriguez@ksmanager.com', 'Bank: Wells Fargo, Account: 5555555555', 40.00, 20.00, 1500.00, 'Beginner-friendly instructor'),
('Emma Davis', '+1 555-3004', 'emma.davis@ksmanager.com', 'Bank: Capital One, Account: 1111222233', 38.00, 15.00, 1600.00, 'Youth programs coordinator'),
('Alex Martinez', '+1 555-3005', 'alex.martinez@ksmanager.com', 'Bank: Chase, Account: 4444555566', 43.00, 22.00, 1900.00, 'Competition training'),
('Jessica Brown', '+1 555-3006', 'jessica.brown@ksmanager.com', 'Bank: TD Bank, Account: 7777888899', 41.00, 19.00, 1700.00, 'Women''s program specialist'),
('Chris Anderson', '+1 555-3007', 'chris.anderson@ksmanager.com', 'Bank: US Bank, Account: 1212121212', 39.00, 17.00, 1650.00, 'Equipment maintenance expert'),
('Laura Taylor', '+1 555-3008', 'laura.taylor@ksmanager.com', 'Bank: PNC, Account: 3434343434', 44.00, 21.00, 1850.00, 'Advanced windsurfing'),
('Ryan Moore', '+1 555-3009', 'ryan.moore@ksmanager.com', 'Bank: KeyBank, Account: 5656565656', 37.00, 16.00, 1550.00, 'Group lesson coordinator'),
('Nicole Garcia', '+1 555-3010', 'nicole.garcia@ksmanager.com', 'Bank: Regions, Account: 7878787878', 46.00, 23.00, 2100.00, 'Certified instructor, IKO certified')
ON CONFLICT DO NOTHING;

-- ============================================
-- STAFF (5 staff members)
-- ============================================

INSERT INTO staff (fullname, role, phone, email, bankdetail, hourlyrate, commission, monthlyfix, note) VALUES
('Robert Miller', 'Manager', '+1 555-4001', 'robert.miller@ksmanager.com', 'Bank: Chase, Account: 1000100010', 35.00, 10.00, 3500.00, 'Operations manager'),
('Jennifer Lee', 'Receptionist', '+1 555-4002', 'jennifer.lee@ksmanager.com', 'Bank: Bank of America, Account: 2000200020', 18.00, 5.00, 2800.00, 'Front desk coordinator'),
('Mark Thompson', 'Beach Boy', '+1 555-4003', 'mark.thompson@ksmanager.com', 'Bank: Wells Fargo, Account: 3000300030', 15.00, 3.00, 2400.00, 'Equipment handler and beach setup'),
('Lisa White', 'Receptionist', '+1 555-4004', 'lisa.white@ksmanager.com', 'Bank: Capital One, Account: 4000400040', 17.00, 4.00, 2700.00, 'Customer service specialist'),
('Kevin Harris', 'Beach Boy', '+1 555-4005', 'kevin.harris@ksmanager.com', 'Bank: TD Bank, Account: 5000500050', 16.00, 3.50, 2500.00, 'Safety coordinator')
ON CONFLICT DO NOTHING;

-- ============================================
-- THIRD PARTY CATEGORIES (5 categories)
-- ============================================

INSERT INTO third_parties_categories (name, description) VALUES
('Equipment Suppliers', 'Companies that supply equipment and gear'),
('Insurance Providers', 'Insurance companies for equipment and liability'),
('Marketing Partners', 'Marketing and advertising partners'),
('Maintenance Services', 'Equipment maintenance and repair services'),
('Food & Beverage', 'Food and beverage suppliers for events')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- THIRD PARTIES (15 third parties)
-- ============================================

INSERT INTO third_parties (name, category_id, phone, email, note) VALUES
('Ocean Gear Supply Co.', (SELECT id FROM third_parties_categories WHERE name = 'Equipment Suppliers'), '+1 555-5001', 'orders@oceangear.com', 'Main equipment supplier'),
('Beach Equipment Direct', (SELECT id FROM third_parties_categories WHERE name = 'Equipment Suppliers'), '+1 555-5002', 'sales@beachequipment.com', 'Secondary supplier'),
('Maritime Insurance Group', (SELECT id FROM third_parties_categories WHERE name = 'Insurance Providers'), '+1 555-5003', 'info@maritimeinsurance.com', 'Equipment insurance'),
('Coastal Coverage Inc.', (SELECT id FROM third_parties_categories WHERE name = 'Insurance Providers'), '+1 555-5004', 'contact@coastalcoverage.com', 'Liability insurance'),
('Surf Marketing Agency', (SELECT id FROM third_parties_categories WHERE name = 'Marketing Partners'), '+1 555-5005', 'hello@surfmarketing.com', 'Digital marketing partner'),
('Beach Promotions LLC', (SELECT id FROM third_parties_categories WHERE name = 'Marketing Partners'), '+1 555-5006', 'info@beachpromotions.com', 'Event marketing'),
('Gear Repair Services', (SELECT id FROM third_parties_categories WHERE name = 'Maintenance Services'), '+1 555-5007', 'repair@gearservices.com', 'Equipment repair'),
('Ocean Maintenance Co.', (SELECT id FROM third_parties_categories WHERE name = 'Maintenance Services'), '+1 555-5008', 'service@oceanmaintenance.com', 'Regular maintenance'),
('Beachside Catering', (SELECT id FROM third_parties_categories WHERE name = 'Food & Beverage'), '+1 555-5009', 'catering@beachside.com', 'Event catering'),
('Tropical Bar Services', (SELECT id FROM third_parties_categories WHERE name = 'Food & Beverage'), '+1 555-5010', 'barservice@tropical.com', 'Beverage services'),
('Water Sports Gear Pro', (SELECT id FROM third_parties_categories WHERE name = 'Equipment Suppliers'), '+1 555-5011', 'pro@watersportsgear.com', 'Premium equipment'),
('Safe Water Insurance', (SELECT id FROM third_parties_categories WHERE name = 'Insurance Providers'), '+1 555-5012', 'info@safewater.com', 'Water sports insurance'),
('Coastal Marketing Solutions', (SELECT id FROM third_parties_categories WHERE name = 'Marketing Partners'), '+1 555-5013', 'solutions@coastalmarketing.com', 'Marketing solutions'),
('Rapid Repair Services', (SELECT id FROM third_parties_categories WHERE name = 'Maintenance Services'), '+1 555-5014', 'rapid@repair.com', 'Fast repair service'),
('Island Catering Co.', (SELECT id FROM third_parties_categories WHERE name = 'Food & Beverage'), '+1 555-5015', 'island@catering.com', 'Island-style catering')
ON CONFLICT DO NOTHING;

-- ============================================
-- COMPANY ACCOUNTS (3 accounts)
-- ============================================

INSERT INTO company_accounts (name, details, note) VALUES
('Main Operating Account', 'Bank: Chase, Account: 1234567890, Routing: 021000021', 'Primary business account'),
('Equipment Reserve Fund', 'Bank: Bank of America, Account: 0987654321, Routing: 026009593', 'Reserve for equipment purchases'),
('Payroll Account', 'Bank: Wells Fargo, Account: 5555666677, Routing: 121042882', 'Dedicated payroll account')
ON CONFLICT DO NOTHING;

-- ============================================
-- TRANSACTIONS (40 transactions)
-- ============================================

-- Generate 20 income transactions with varied amounts, dates, and types
WITH income_transactions AS (
    SELECT 
        row_number() OVER () as rn,
        CURRENT_TIMESTAMP - (random() * INTERVAL '90 days') as occurred_at,
        (random() * 5000 + 50)::NUMERIC(12,2) as amount,
        'USD' as currency,
        (SELECT id FROM transaction_types WHERE direction = 'income' ORDER BY RANDOM() LIMIT 1) as type_id,
        (SELECT id FROM payment_methods ORDER BY RANDOM() LIMIT 1) as payment_method_id,
        'customer' as source_entity_type,
        (SELECT id FROM customers ORDER BY RANDOM() LIMIT 1) as source_entity_id,
        'company_account' as destination_entity_type,
        (SELECT id FROM company_accounts ORDER BY RANDOM() LIMIT 1) as destination_entity_id,
        CASE 
            WHEN random() < 0.3 THEN 'Service payment'
            WHEN random() < 0.6 THEN 'Lesson payment'
            ELSE 'General transaction'
        END as note,
        (SELECT id FROM users WHERE role = 'admin' LIMIT 1) as created_by
    FROM generate_series(1, 20)
)
INSERT INTO transactions (occurred_at, amount, currency, type_id, payment_method_id, source_entity_type, source_entity_id, destination_entity_type, destination_entity_id, reference, note, created_by)
SELECT 
    occurred_at,
    amount,
    currency,
    type_id,
    payment_method_id,
    source_entity_type,
    source_entity_id,
    destination_entity_type,
    destination_entity_id,
    'REF-' || LPAD(rn::TEXT, 6, '0') as reference,
    note,
    created_by
FROM income_transactions;

-- Add 20 expense transactions
WITH expense_transactions AS (
    SELECT 
        row_number() OVER () as rn,
        CURRENT_TIMESTAMP - (random() * INTERVAL '90 days') as occurred_at,
        -(random() * 3000 + 100)::NUMERIC(12,2) as amount,
        'USD' as currency,
        (SELECT id FROM transaction_types WHERE direction = 'expense' ORDER BY RANDOM() LIMIT 1) as type_id,
        (SELECT id FROM payment_methods ORDER BY RANDOM() LIMIT 1) as payment_method_id,
        'company_account' as source_entity_type,
        (SELECT id FROM company_accounts ORDER BY RANDOM() LIMIT 1) as source_entity_id,
        CASE 
            WHEN random() < 0.3 THEN 'third_party'
            WHEN random() < 0.6 THEN 'instructor'
            ELSE 'staff'
        END as destination_entity_type,
        CASE 
            WHEN random() < 0.3 THEN (SELECT id FROM third_parties ORDER BY RANDOM() LIMIT 1)
            WHEN random() < 0.6 THEN (SELECT id FROM instructors ORDER BY RANDOM() LIMIT 1)
            ELSE (SELECT id FROM staff ORDER BY RANDOM() LIMIT 1)
        END as destination_entity_id,
        CASE 
            WHEN random() < 0.25 THEN 'Salary payment'
            WHEN random() < 0.5 THEN 'Equipment purchase'
            WHEN random() < 0.75 THEN 'Maintenance cost'
            ELSE 'Operating expense'
        END as note,
        (SELECT id FROM users WHERE role = 'admin' LIMIT 1) as created_by
    FROM generate_series(1, 20)
)
INSERT INTO transactions (occurred_at, amount, currency, type_id, payment_method_id, source_entity_type, source_entity_id, destination_entity_type, destination_entity_id, reference, note, created_by)
SELECT 
    occurred_at,
    amount,
    currency,
    type_id,
    payment_method_id,
    source_entity_type,
    source_entity_id,
    destination_entity_type,
    destination_entity_id,
    'EXP-' || LPAD(rn::TEXT, 6, '0') as reference,
    note,
    created_by
FROM expense_transactions;

-- ============================================
-- SEED COMPLETE
-- ============================================

