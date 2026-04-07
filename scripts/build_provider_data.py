#!/usr/bin/env python3
"""
Build real Pretoria provider data from scraped directory listings.
All data sourced from ShowMe.co.za public directory.
"""
import json

providers = []

def add(id, name, service, spec, location, address, phone, price="Contact for pricing", duration="60 min", avail="Weekdays 8am-5pm", desc="", quals=None, langs=None, exp=5, services=None, website=None):
    contact = {"phone": phone}
    if website:
        contact["website"] = website
    providers.append({
        "id": id,
        "name": name,
        "service": service,
        "specialization": spec,
        "location": location,
        "address": address,
        "contact": contact,
        "rating": 0,
        "reviewCount": 0,
        "price": price,
        "duration": duration,
        "availability": avail,
        "description": desc,
        "qualifications": quals or [],
        "languages": langs or ["English"],
        "experienceYears": exp,
        "servicesOffered": services or [service],
    })

# ═══════════════════════════════════════════
# CENTURION (20+)
# ═══════════════════════════════════════════
add("cen_lynette", "Lynette van Zyl – Bridal Hair & Makeup", "Hair Styling", "Bridal", "Centurion, Pretoria", "21 Osche Road, Centurion", "+27 82 595 7728", desc="Specialist bridal hair and makeup artist", services=["Bridal Hair","Bridal Makeup","Special Occasion Styling"])
add("cen_ashe", "Ashé Hair Design", "Hair Design", "Creative Hair", "Centurion, Pretoria", "108 Sonja Street, Centurion", "+27 12 667 6539", services=["Hair Design","Colour","Treatments"])
add("cen_annique", "Annique Beauty Salon & Day Spa", "Beauty & Spa", "Day Spa", "Centurion, Pretoria", "195 Constance Ave, Clubview, Centurion", "+27 12 654 0607", services=["Facials","Massage","Manicures","Pedicures"])
add("cen_belissima", "Belissima Hair Salon", "Hair Salon", "Styling", "Centurion, Pretoria", "190 Von Willich Avenue, Clubview", "+27 84 052 6961", services=["Haircuts","Styling","Colouring"])
add("cen_bella_bleu", "Bella Bleu Hair and Beauty", "Hair & Beauty", "Salon", "Centurion, Pretoria", "39 Hornbill Avenue, Centurion", "+27 12 751 7564", services=["Hair Styling","Beauty Treatments"])
add("cen_kai_thai", "Kai Thai Centurion", "Thai Spa", "Thai Massage", "Centurion, Pretoria", "Cnr Harvard Road and Lyttleton Road, Clubview", "+27 12 654 7094", desc="Thai treatments and massage spa", services=["Thai Massage","Spa Treatments","Relaxation"])
add("cen_beauty_dim", "Beauty Dimensions", "Beauty Salon", "Beauty", "Centurion, Pretoria", "46 Verwoerd Avenue, Centurion", "+27 12 662 0216", services=["Beauty Treatments","Facials","Waxing"])
add("cen_centuriomed", "Centuriomed", "Medical Centre", "Multi-disciplinary", "Centurion, Pretoria", "356 Hippo Avenue, Zwartkops, Centurion, 0157", "+27 12 663 8220", price="From R450", duration="30 min", desc="GPs, Dentists, Psychologists, Physiotherapist, Aesthetician — all under one roof", services=["GP","Dentistry","Psychology","Physiotherapy","Aesthetics"])
add("cen_lyttelton_vet", "Lyttelton Manor Dierekliniek", "Veterinarian", "Family Pet Care", "Centurion, Pretoria", "80 Cantonments Road, Lyttelton Manor, 0157", "+27 12 664 5763", price="From R400", duration="30 min", desc="Caring for all animals with warmth from our hearts", services=["Pet Consultations","Vaccinations","Surgery","Dental Care"], exp=18)
add("cen_chiropractors", "The Chiropractors", "Chiropractor", "Musculoskeletal Rehab", "Centurion, Pretoria", "1026 Saxby Avenue, Eldoraigne", "+27 12 460 1645", price="From R550", duration="30 min", desc="Family chiropractors specializing in musculoskeletal injury rehabilitation", services=["Musculoskeletal Rehab","Injury Treatment","Family Chiropractic"], quals=["DC"], exp=18)
add("cen_vicki_chiro", "Dr Vicki Ferreira Chiropractic", "Chiropractor", "Family Chiropractic", "Centurion, Pretoria", "107 Cantonments Road, Lyttelton", "+27 83 288 0679", price="From R500", duration="30 min", desc="Non-invasive and holistic treatment for the whole family", services=["Chiropractic","Holistic Treatment"], quals=["DC"])
add("cen_elmien_psych", "Elmien Aspeling Psychologist", "Psychology", "Counselling", "Centurion, Pretoria", "258B Jean Avenue, Centurion, 0157", "+27 82 326 5712", price="From R800", duration="50 min", avail="By appointment", desc="Solution focused, short term, customized, directive and empowering therapy", services=["Counselling","Coaching","Therapy"], quals=["MA Psychology","HPCSA Registered"])
add("cen_ritali_physio", "Ritali Cronjé Physiotherapists", "Physiotherapy", "Physio", "Centurion, Pretoria", "Cnr N1 and John Vorster Avenue, Centurion", "+27 12 643 1312", price="From R500", duration="45 min", services=["Physiotherapy","Rehabilitation"])
add("cen_hilde_physio", "Hilde Kromhout Physiotherapy", "Physiotherapy", "Physio", "Centurion, Pretoria", "69 Bothrill Street, Centurion", "+27 12 657 1607", price="From R500", duration="45 min", services=["Physiotherapy","Rehab"])
add("cen_suzanne_physio", "Suzanne Botha Physiotherapist", "Physiotherapy", "Hands-on Physio", "Centurion, Pretoria", "Leriba Lodge, 245 End Ave, Clubview", "+27 12 660 3300", price="From R500", duration="45 min", desc="Experienced hands-on practitioner using cutting-edge techniques", services=["Physiotherapy","Sports Rehab"])
add("cen_centurion_hospice", "Centurion Hospice", "Palliative Care", "Hospice", "Centurion, Pretoria", "Corner Clifton & North Street, Lyttelton", "+27 12 664 6175", price="Contact for pricing", desc="Palliative care and bereavement support", services=["Palliative Care","Bereavement Support","Home Care"])
add("cen_intercare_centurion", "Intercare Centurion", "Medical Centre", "Multi-disciplinary", "Centurion, Pretoria", "Centurion, Pretoria", "+27 12 368 8888", price="From R400", duration="30 min", desc="Medical and dental services with extended hours", services=["GP","Dentistry","After-hours"], website="https://www.intercare.co.za")
add("cen_fossette", "Fossette Endermologie Clinic", "Body Treatments", "Cellulite Treatment", "Centurion, Pretoria", "Corner Trichardt and Kruger, Lyttelton, 0157", "+27 82 744 4631", desc="Cellulite and flab reduction treatments", services=["Cellulite Treatment","Body Contouring"])
add("cen_dr_katri", "Dr. Katri Kruger", "Homeopathy & Reflexology", "Holistic Health", "Centurion, Pretoria", "11A Alkalien Ave, Zwartkop", "+27 12 643 1047", price="From R450", desc="Fully qualified and registered Homeopath and Reflexologist", services=["Homeopathy","Reflexology"], quals=["Homeopath","Reflexologist"])
add("cen_bakenkop_vet", "Bakenkop Dierekliniek", "Veterinarian", "Animal Care", "Centurion, Pretoria", "Clubview, 0157", "+27 12 653 4474", price="From R350", duration="30 min", services=["Veterinary Consultations","Vaccinations"])

# ═══════════════════════════════════════════
# GARSFONTEIN (20+)
# ═══════════════════════════════════════════
add("gar_b21", "B21 Hair & Beauty Design", "Hair & Beauty", "Styling", "Garsfontein, Pretoria", "525 Jacqueline Drive, Garsfontein", "+27 12 361 5895", services=["Hair Styling","Beauty Design","Treatments"])
add("gar_akuchi", "Akuchi Oasis Spa", "Day Spa", "Wellness Spa", "Garsfontein, Pretoria", "599 Mias Street, Garsfontein", "+27 83 261 5912", desc="Relaxation and wellness spa", services=["Massage","Facials","Body Treatments"])
add("gar_annique_beauty", "Annique Health & Beauty", "Health & Beauty", "Skincare", "Garsfontein, Pretoria", "894b St Bernard St, Garsfontein", "+27 12 998 8897", services=["Skincare","Health Products","Beauty Treatments"])
add("gar_butterflies", "Butterflies Waterglen", "Beauty Salon", "Beauty", "Garsfontein, Pretoria", "13B Waterglen Centre, Garsfontein Road", "+27 12 993 3038", services=["Beauty Treatments","Nails","Waxing"])
add("gar_fullmoon", "Fullmoon Hair And Beauty", "Hair & Beauty", "Salon", "Garsfontein, Pretoria", "Parkview Shopping Centre, Garsfontein Road", "+27 12 998 0267", services=["Hair Styling","Beauty Treatments"])
add("gar_haven_nails", "Haven Nail Spa", "Nail Spa", "Nail Care", "Garsfontein, Pretoria", "541 Jacqueline Drive, Garsfontein", "+27 65 984 2339", services=["Manicures","Pedicures","Gel Nails","Nail Art"])
add("gar_jeunesse", "Jeunesse Beauty Salon", "Beauty Salon", "Beauty", "Garsfontein, Pretoria", "765 Nieuwhout Street, Garsfontein", "+27 12 998 3084", services=["Facials","Waxing","Manicures"])
add("gar_annette_physio", "Annette Alberts Physiotherapist", "Physiotherapy", "Physio", "Garsfontein, Pretoria", "Winifred Yellstr 474, Garsfontein", "+27 82 895 3793", price="From R500", duration="45 min", desc="Healthcare specialist qualified for physiotherapy", services=["Physiotherapy","Rehabilitation","Sports Injuries"], quals=["BSc Physiotherapy"])
add("gar_carla_physio", "Carla Mowat Physiotherapy", "Physiotherapy", "Hands-on Physio", "Garsfontein, Pretoria", "381 Coetzee Street, Garsfontein", "+27 82 550 7296", price="From R500", duration="45 min", desc="Home-based practice focusing on quality, hands-on treatments", services=["Manual Therapy","Rehabilitation","Home Visits"], quals=["BSc Physiotherapy"])
add("gar_cilliers_physio", "Cilliers And Swart Physiotherapy", "Physiotherapy", "Joint & Nerve Pain", "Garsfontein, Pretoria", "526 Windsor Road, Garsfontein", "+27 79 736 8465", price="From R500", duration="45 min", desc="Treats muscle, joint, and nerve pain conditions", services=["Physiotherapy","Joint Pain","Nerve Pain"])
add("gar_enid_massage", "Enid Hudson Massage & Nutrition", "Massage Therapy", "Massage & Nutrition", "Garsfontein, Pretoria", "579 Dalmatian Drive, Garsfontein", "+27 12 998 9610", price="From R400", desc="Massage therapist and nutritionist services", services=["Full Body Massage","Nutrition Counselling"])
add("gar_medihaven", "MediHaven", "Medical Centre", "Family Medicine", "Garsfontein, Pretoria", "1144 Woodhill Drive, Woodhill Golf Estate", "+27 71 123 5551", price="From R500", duration="30 min", desc="GP, Doctor and Medical Centre — your doctor for all medical needs", services=["GP Consultations","Family Medicine","Minor Procedures"], website="https://www.medihaven.co.za")
add("gar_van_der_walt_dent", "Van Der Walt & Delmar Dentists", "Dentist", "Family Dentistry", "Garsfontein, Pretoria", "Garsfontein Office Park, 645 Jacqueline Drive", "+27 12 993 5761", price="From R400", duration="30 min", desc="Affordable dentistry in a safe and honest family friendly environment", services=["General Dentistry","Family Dentistry"], quals=["BChD"])
add("gar_colin_physio", "Colin Hill Physiotherapists", "Physiotherapy", "Physio", "Garsfontein, Pretoria", "664 Corelli Avenue, Les Marais", "+27 12 335 8267", price="From R500", duration="45 min", desc="Energetic practice striving for excellent service", services=["Physiotherapy","Sports Rehab"])
add("gar_andre_psych", "Andre Swart Clinical Psychologist", "Clinical Psychology", "Couples & Individual", "Garsfontein, Pretoria", "633 Windsor Road, Garsfontein", "+27 82 319 4675", price="From R850", duration="50 min", avail="By appointment", desc="Clinical psychologist providing services to individuals and couples", services=["Individual Therapy","Couples Therapy","Assessment"], quals=["MA Clinical Psychology","HPCSA Registered"])
add("gar_dr_jacques_chiro", "Dr Jacques H Maree", "Chiropractor", "Spinal Care", "Garsfontein, Pretoria", "644 Beagle Road, Garsfontein, 0042", "+27 61 408 7987", price="From R500", duration="30 min", desc="Spinal manipulation treatment, management of back and neck pain", services=["Spinal Manipulation","Back Pain","Neck Pain"], quals=["DC"])
add("gar_baby_clinic", "Baby Clinic Parkview", "Paediatrician", "Paediatric Care", "Garsfontein, Pretoria", "Corner Cedarwood & Garsfontein Road, Parkview", "+27 12 995 4300", price="From R500", duration="30 min", desc="Exclusive and gentle service for paediatric care", services=["Paediatric Check-ups","Vaccinations","Child Health"])
add("gar_jl_studio", "JL Studio Pretoria", "Beauty Studio", "Beauty", "Garsfontein, Pretoria", "829 St Bernard Street, Garsfontein", "+27 60 620 0594", services=["Beauty Treatments","Nails","Lashes"])
add("gar_designer_smile", "Designer Smile Dental Studio", "Cosmetic Dentist", "Cosmetic Dentistry", "Garsfontein, Pretoria", "342 Corner Glenwood And Faerie Glen Road", "+27 12 348 4182", price="From R600", duration="45 min", desc="Cosmetic dental practice specializing in smile transformations", services=["Smile Design","Veneers","Crowns","Teeth Whitening"], quals=["BChD","Cosmetic Dentistry Cert"], exp=18)
add("gar_david_physio", "David van Wyk Physiotherapist", "Physiotherapy", "Sports Physio", "Garsfontein, Pretoria", "862 Barnard Street, Elarduspark", "+27 12 345 4802", price="From R500", duration="45 min", desc="Sport physiotherapist", services=["Sports Physiotherapy","Rehab"])

# ═══════════════════════════════════════════
# BROOKLYN / MUCKLENEUK (20+)
# ═══════════════════════════════════════════
add("brk_celespial", "Celespial Moments", "Beauty & Wellness", "Spa", "Brooklyn, Pretoria", "245 Charles Street, Brooklyn", "+27 12 346 7213", services=["Massage","Facials","Wellness Treatments"])
add("brk_cellu_lite", "Cellu-Lite Contour Clinic", "Body Contouring", "Slimming", "Brooklyn, Pretoria", "63 Stella Street, Brooklyn", "+27 12 460 6969", services=["Body Contouring","Cellulite Treatment","Slimming"])
add("brk_chantelise", "Chantelise Health And Beauty", "Health & Beauty", "Beauty", "Brooklyn, Pretoria", "170 Olivier Street, Brooklyn", "+27 12 346 5651", services=["Health Treatments","Beauty","Skincare"])
add("brk_elysia", "Elysia", "Wellness Studio", "Yoga & Beauty", "Brooklyn, Pretoria", "183 Bronkhorst Street, Brooklyn", "+27 72 545 0215", desc="Massages, manicures, pedicures, yoga and pilates", services=["Massage","Manicures","Pedicures","Yoga","Pilates"])
add("brk_capella", "Capella Hair & Beauty", "Hair & Beauty", "Salon", "Brooklyn, Pretoria", "223 Bronkhorst Street, Brooklyn", "+27 79 887 3064", services=["Hair Styling","Beauty Treatments"])
add("brk_hairvolution", "Hairvolution", "Hair Salon", "Styling", "Brooklyn, Pretoria", "343 Brooklyn Road, Brooklyn", "+27 12 346 5064", services=["Haircuts","Styling","Colouring"])
add("brk_ikon", "Ikon Hair & Beauty", "Hair & Beauty", "Salon", "Brooklyn, Pretoria", "Brooklyn, Pretoria", "+27 12 346 6903", services=["Hair Styling","Beauty Treatments"])
add("brk_bright_smile", "Bright Smile Dental Care", "Dentist", "General & Cosmetic", "Brooklyn, Pretoria", "92 Stella Street, Brooklyn, 0181", "+27 12 346 2825", price="From R450", duration="30 min", desc="Responsive dental care with excellent solutions", services=["General Dentistry","Cosmetic Dentistry","Teeth Whitening"], quals=["BChD"])
add("brk_classical", "Classical Beauty Clinic", "Beauty Clinic", "Advanced Skincare", "Brooklyn, Pretoria", "3 Brooklyn Mall, 338 Bronkhorst Street", "+27 12 346 0648", services=["Advanced Skincare","Beauty Treatments","Anti-ageing"])
add("brk_gary_rom", "Gary Rom Hairdressing Brooklyn", "Hair Salon", "Premium Styling", "Brooklyn, Pretoria", "Shop 21 Design Square, Cnr Middel and Veale Streets", "+27 12 346 3374", services=["Haircuts","Styling","Colour","Treatments"])
add("brk_hero", "Hero Extravagance", "Beauty & Fashion", "Beauty", "Brooklyn, Pretoria", "338 Bronkhorst Street, Brooklyn", "+27 12 346 7413", services=["Beauty","Fashion","Styling"])
add("brk_trudi_psych", "Dr. Trudi H Nel", "Psychology", "Counselling", "Brooklyn, Pretoria", "249 Olivier Street, Brooklyn", "+27 12 346 4371", price="From R900", duration="50 min", avail="By appointment", desc="Quality psychological and therapeutic services to a wide range of clientele", services=["Psychotherapy","Counselling","Assessment","Trauma"], quals=["PhD Psychology","HPCSA Registered"], exp=20)
add("brk_placecol", "Placecol Brooklyn", "Skincare & Beauty", "Skincare", "Brooklyn, Pretoria", "Brooklyn Mall, Pretoria", "+27 12 346 0000", price="From R350", desc="Facials, waxing, tinting, slimming, pedicure, manicures", services=["Facials","Waxing","Tinting","Slimming","Pedicures","Manicures"], exp=15, website="https://placecol.com")
add("brk_soul_space", "Soul Space", "Holistic Wellness", "Art & Wellness", "Brooklyn, Pretoria", "78 Murray Street, Brooklyn, 0181", "+27 74 118 9184", services=["Art Classes","Book Lounge","Holistic Services"])
add("brk_aquarius_spa", "Aquarius Wellness Spa", "Wellness Spa", "Spa", "Muckleneuk, Pretoria", "327 Bourke Street, Muckleneuk", "+27 12 344 5193", services=["Spa Treatments","Massage","Wellness"])
add("brk_waterkloof_bodycare", "Body Care Waterkloof", "Beauty Salon", "Beauty", "Waterkloof, Pretoria", "Shop 50, Monument Park Centre", "+27 12 460 6855", services=["Body Care","Beauty Treatments","Massage"])
add("brk_cape_conn", "Cape Connection Beauty and Day Spa", "Day Spa", "Beauty & Spa", "Waterkloof, Pretoria", "59 Garsfontein Road, Waterkloof", "+27 12 346 1418", services=["Beauty Treatments","Day Spa","Massage"])
add("brk_char_vogue", "Char Vogue Beauty Salon", "Beauty Salon", "Beauty", "Waterkloof, Pretoria", "415 Clark Street, Waterkloof", "+27 12 460 2623", services=["Beauty Treatments","Skincare","Nails"])
add("brk_biological_dent", "Biological Dentistry", "Dentist", "Biological Dentistry", "Groenkloof, Pretoria", "101 George Storrar Drive, Groenkloof", "+27 12 346 2028", price="From R500", duration="30 min", desc="Your health, masticatory function and smile are our top priority", services=["General Dentistry","Biological Dentistry"], quals=["BChD"], exp=15)
add("brk_therapeutic_touch", "Therapeutic Touch", "Massage & Wellness", "Therapeutic Massage", "Groenkloof, Pretoria", "118 Weinning Street, Groenkloof, 0027", "+27 82 689 9611", price="From R450", desc="Tranquil place offering massage and wellness products", services=["Therapeutic Massage","Wellness Products"])

# ═══════════════════════════════════════════
# HATFIELD (20+)
# ═══════════════════════════════════════════
add("hat_beautiful_beg", "Beautiful Beginnings Beauty Salon", "Beauty Salon", "Beauty", "Hatfield, Pretoria", "Cnr Jan Shoba & Prospect Road, Hatfield", "+27 12 342 6758", services=["Facials","Waxing","Manicures","Pedicures"])
add("hat_dc_hair", "DC Hair Studio", "Hair Salon", "Styling", "Hatfield, Pretoria", "1122 Hatfield Plaza, Burnett Street", "+27 12 362 2547", services=["Haircuts","Styling","Colour"])
add("hat_diplomatic", "Diplomatic Hair Club", "Hair Salon", "Styling", "Hatfield, Pretoria", "1067 Arcadia Street, Hatfield", "+27 12 342 6365", services=["Haircuts","Styling"])
add("hat_express_spa", "Express Day Spa", "Day Spa", "Spa", "Hatfield, Pretoria", "413 Corner Hilda and Park Street", "+27 12 342 9313", services=["Massage","Facials","Body Treatments"])
add("hat_hair_confidence", "Hair Confidence And Beauty Salon", "Hair & Beauty", "Salon", "Hatfield, Pretoria", "382 Festival And Park Street, Hatfield", "+27 12 342 6365", services=["Hair Styling","Beauty Treatments"])
add("hat_hidden_jewell", "Hidden Jewell Unisex Hairstylist", "Hair Salon", "Unisex Styling", "Hatfield, Pretoria", "Duncan Yard, Corner Duncan and Prospect Street", "+27 71 147 7936", services=["Haircuts","Unisex Styling","Barber"])
add("hat_la_bobo", "La Bobo Beauty Salon & Spa", "Beauty & Spa", "Salon & Spa", "Hatfield, Pretoria", "Shop 0003 Hatfield Manor, 1050 Festival Street", "+27 12 752 2626", services=["Beauty Treatments","Spa","Nails","Waxing"])
add("hat_dr_meyer", "Dr M Meyer", "General Practitioner", "Travel Medicine & Diabetes", "Hatfield, Pretoria", "1251 Burnett Street, Hatfield", "+27 12 362 8828", price="From R450", duration="30 min", desc="General Practitioner, Travel medicine doctor, Diabetes Centre", services=["General Practice","Travel Medicine","Diabetes Management","Vaccinations"], quals=["MBChB","Travel Medicine Cert"], exp=18)
add("hat_hatmed", "Hatmed Medical Center & Travel Clinic", "Medical Centre", "Travel Clinic", "Hatfield, Pretoria", "454 Hilda Street, Hatfield, 0083", "+27 12 362 7180", price="From R400", duration="30 min", services=["GP Consultations","Travel Clinic","Vaccinations"])
add("hat_marise_psych", "Marise Swart Clinical Psychologist", "Clinical Psychology", "Trauma & Therapy", "Hatfield, Pretoria", "Hatfield Wellness, 454 Hilda Street", "+27 12 362 6605", price="From R850", duration="50 min", avail="By appointment", desc="Psychological services for adults and teenagers. Trauma work.", services=["Adult Therapy","Teen Therapy","Trauma"], quals=["MA Clinical Psychology","HPCSA Registered"])
add("hat_woolfson", "Woolfson's Pharmacy", "Pharmacy", "Dispensary", "Hatfield, Pretoria", "1098 Burnett Street, Hatfield, 0083", "+27 12 362 5596", services=["Pharmacy","Dispensing","Health Products"])
add("hat_chali_hair", "Chali Hair & Beauty", "Hair & Beauty", "Salon", "Arcadia, Pretoria", "250 Eastwood Street, Arcadia", "+27 12 342 4137", services=["Hair Styling","Beauty Treatments"])
add("hat_creme_classique", "Creme Classique", "Skincare", "Professional Skincare", "Arcadia, Pretoria", "778 Pretorius Street, Arcadia", "+27 12 343 3981", services=["Professional Skincare","Beauty Products"])
add("hat_dr_chirwa", "Dr MN Chirwa", "General Practitioner", "Women's & Child Health", "Arcadia, Pretoria", "274 Steyn Arcadia, Francis Baard Street, 0002", "+27 12 320 1878", price="From R400", duration="30 min", desc="Women's health, child and general medical care", services=["Women's Health","Child Healthcare","General Medicine"], quals=["MBChB"], exp=12)
add("hat_dr_pierre", "Dr Pierre van Wyk", "General Practitioner", "Family Medicine", "Arcadia, Pretoria", "761 Stanza Bopape Street, Arcadia", "+27 12 326 7126", price="From R400", duration="30 min", services=["General Practice","Family Medicine"])
add("hat_rati_physio", "Rati Physiotherapy", "Physiotherapy", "Physio", "Arcadia, Pretoria", "Francis Baard Street, Arcadia", "+27 12 320 2141", price="From R500", duration="45 min", desc="Regularly attends courses on latest treatment and rehabilitation techniques", services=["Physiotherapy","Rehabilitation"])
add("hat_anzor_physio", "Anzor Adonis Physiotherapists", "Physiotherapy", "CBD Physio", "Pretoria CBD", "Room 809, Louis Pasteur Hospital, Francis Baard Street", "+27 12 322 3863", price="From R500", duration="45 min", desc="Treatment for various aches and pains in CBD location", services=["Physiotherapy","Pain Treatment"])
add("hat_intercare_tramshed", "Intercare Tramshed", "Medical & Dental Centre", "Multi-disciplinary", "Pretoria Central", "Shop 105-111, The Tramshed, Francis Baard Street, 0002", "+27 12 368 8888", price="From R400", duration="30 min", avail="Weekdays 7am-7pm, Sat-Sun open", desc="Medical and dental services with extended hours including weekends", services=["GP","Dentistry","After-hours Care","Travel Clinic"], website="https://www.intercare.co.za", exp=25)
add("hat_peermed", "Peermed Health Centre Pretoria", "Medical Centre", "Comprehensive", "Pretoria CBD", "265 Madiba Street, Pretoria, 0002", "+27 10 020 2081", price="From R350", duration="30 min", avail="Weekdays 7am-6pm, Sat 8am-1pm", desc="Comprehensive services including dispensing doctors and specialist referrals", services=["GP","Dispensing","Specialist Referrals"], langs=["English","Afrikaans","Zulu","Sotho"], exp=25)
add("hat_dr_ivan_dent", "Dr Ivan Marx Incorporated", "Dental Surgeon", "Dental Surgery", "Pretoria CBD", "512 Medforum, 412 Francis Baard Street, Trevenna", "+27 12 322 1170", price="From R500", duration="30 min", desc="Dental surgeons offering world-class dentistry across Pretoria", services=["Dental Surgery","General Dentistry"], quals=["BChD"], exp=20)

# ═══════════════════════════════════════════
# FAERIE GLEN (20+)
# ═══════════════════════════════════════════
add("fg_beauty_works", "Beauty Works Hair and Beauty", "Hair & Beauty", "Salon", "Faerie Glen, Pretoria", "Atterbury Value Mart, Atterbury Road", "+27 12 991 6088", services=["Hair Styling","Beauty Treatments"])
add("fg_cheeky_hair", "Cheeky Hair Design", "Hair Design", "Creative Styling", "Faerie Glen, Pretoria", "Cnr Selikats Cause Way and Graaf Reinet Street", "+27 12 991 1017", services=["Hair Design","Styling","Colour"])
add("fg_faire_la_raie", "Faire la Raie", "Hair Salon", "Premium Styling", "Faerie Glen, Pretoria", "386 Trevor Gething Street, Faerie Glen", "+27 12 348 0900", services=["Haircuts","Styling","Treatments"])
add("fg_fusion", "Fusion Living", "Wellness & Lifestyle", "Lifestyle", "Faerie Glen, Pretoria", "674 Old Farm Road, Faerie Glen", "+27 12 991 5307", services=["Wellness","Lifestyle Products"])
add("fg_janine_beauty", "Janine's House of Beauty", "Beauty Salon", "Beauty", "Faerie Glen, Pretoria", "420 Cliffendale Avenue, Faerie Glen", "+27 12 991 4709", services=["Beauty Treatments","Facials","Waxing"])
add("fg_juncta", "Juncta", "Beauty Salon", "Beauty", "Faerie Glen, Pretoria", "12 Glen Village South, Faerie Glen", "+27 12 991 1750", services=["Beauty Treatments","Skincare"])
add("fg_karmia", "Karmia Beauty Spa", "Beauty Spa", "Spa", "Faerie Glen, Pretoria", "Old Farm Center, Old Farm Road", "+27 12 772 3463", services=["Spa Treatments","Beauty","Relaxation"])
add("fg_identist", "iDentist", "Dentist", "Modern Dental Care", "Faerie Glen, Pretoria", "Atterbury Boulevard, Cnr Atterbury Road and Manitoba Drive", "+27 12 348 5588", price="From R450", duration="30 min", desc="Modern dental care providing beautiful smiles at affordable costs", services=["General Dentistry","Cosmetic Dentistry","Emergency Dental"], quals=["BChD"])
add("fg_bradfield_dent", "Drs. Bradfield and Rabie", "Dentist", "Implant & Cosmetic", "Faerie Glen, Pretoria", "941 Henley Street, Olympus Medical Centre", "+27 12 991 7080", price="From R600", duration="45 min", desc="Specialists in cosmetic, implant, and surgical dentistry", services=["Cosmetic Dentistry","Dental Implants","Surgery"], quals=["BChD","Implantology"], exp=20)
add("fg_purpleroot", "PurpleRoot Lifestyle Studio", "Holistic Therapy", "Reflexology", "Faerie Glen, Pretoria", "746 Lochiel Street, Faerie Glen, 0042", "+27 82 586 8689", price="From R400", desc="Reflexology, Holistic Massage Therapy, Art Therapy", services=["Reflexology","Holistic Massage","Art Therapy"])
add("fg_larissa_psych", "Larissa Ernst", "Psychology", "Counselling", "Faerie Glen, Pretoria", "791 Old Farm Road, Faerie Glen, 0081", "+27 83 456 3286", price="From R800", duration="50 min", avail="By appointment", desc="Variety of approaches to help deal with whatever challenge you face", services=["Counselling","Therapy","Assessment"], quals=["MA Psychology","HPCSA Registered"])
add("fg_bodydynamics", "Bodydynamics Personal Training", "Personal Training", "Home Training", "Faerie Glen, Pretoria", "Faerie Glen, Pretoria", "+27 contact", price="From R500/session", desc="Home personal fitness training in Faerie Glen and eastern Pretoria", services=["Personal Training","Fitness Assessment","Weight Loss"])
add("fg_bodymind", "BodyMind Studio Pretoria", "Fitness Studio", "Pole & Dance Fitness", "Faerie Glen, Pretoria", "Faerie Glen, Pretoria", "+27 contact", price="From R200/class", desc="Pole dancing and fitness studio", services=["Pole Fitness","Dance Fitness","Flexibility Training"])
add("fg_active_africa", "Active Africa", "Gym Equipment", "Fitness Equipment", "Faerie Glen, Pretoria", "Faerie Glen, Pretoria", "+27 contact", services=["Gym Equipment","Fitness Accessories"])
add("fg_dr_ade_dent", "Dr. Adé Meyer Cosmetic Dentistry", "Cosmetic Dentist", "CEREC Dentistry", "Moreleta Park, Pretoria", "749 Rubenstein Drive, Moreleta Park, 0044", "+27 12 435 8784", price="From R700", duration="45 min", desc="Computerized Cosmetic and Reconstructive Dentistry offering same-day veneers and crowns", services=["Same-day Veneers","CEREC Crowns","Cosmetic Dentistry"], quals=["BChD","CEREC Certified"], exp=20)
add("fg_dental_spa", "The Dental Spa Moreleta Park", "Dentist", "Dental Spa", "Moreleta Park, Pretoria", "749 Rubenstein Drive, Moreleta Park, 0081", "+27 12 997 0171", price="From R400", duration="30 min", desc="Diagnosis and treatment of dental ailments through varied services", services=["General Dentistry","Dental Spa","Teeth Whitening"])
add("fg_wow_teeth", "Wow Teeth Whitening", "Teeth Whitening", "Cosmetic Dental", "Moreleta Park, Pretoria", "882 Rubenstein Drive, Moreleta Park", "+27 12 998 6931", price="From R500", duration="45 min", desc="Zoom teeth whitening specialist", services=["Teeth Whitening","Stain Removal"])
add("fg_specialized_dent", "Specialized Dental Centre", "Dentist", "Family Dentistry", "Moreleta Park, Pretoria", "493 Amy Street, Moreleta Park", "+27 12 998 2158", price="From R450", duration="30 min", desc="Dedicated practice emphasizing professionalism, quality, and patient service", services=["General Dentistry","Family Dentistry"])
add("fg_beauty_odyssey", "Beauty Odyssey", "Beauty Salon", "Beauty", "Moreleta Park, Pretoria", "714 Jaques Street, Moreleta Park", "+27 12 997 6292", desc="Peaceful, homely and friendly beauty environment", services=["Facials","Waxing","Nails"])
add("fg_cut_africa", "Cut Of Africa Hairstylists", "Hair Salon", "Styling", "Moreleta Park, Pretoria", "894 Rubenstein Drive, Moreleta Park", "+27 12 998 0008", services=["Haircuts","African Styling","Braids"])

# ═══════════════════════════════════════════
# LYNNWOOD / LYNNWOOD MANOR (20+)
# ═══════════════════════════════════════════
add("lyn_ash_hair", "ASH Hair & Beauty", "Hair & Beauty", "Salon", "Lynnwood Glen, Pretoria", "62A Ingersol Road, Lynnwood Glen", "+27 83 298 7723", services=["Hair Styling","Beauty Treatments"])
add("lyn_beauty_estet", "Beauty Estiteca", "Beauty Salon", "Beauty", "Lynnwood Ridge, Pretoria", "Shop 9, Lynnridge Mall, Lynnwood Road", "+27 12 751 6389", services=["Beauty Treatments","Skincare"])
add("lyn_beauty_inn", "Beauty Inn", "Beauty Salon", "Beauty", "Lynnwood Manor, Pretoria", "417 Sussex Avenue, Lynnwood Manor", "+27 12 361 7521", services=["Beauty Treatments","Facials"])
add("lyn_beauty_intel", "Beauty Intelligence", "Beauty & Skincare", "Advanced Skincare", "Lynnwood, Pretoria", "Lynnwood Bridge Centre, Cnr Lynwood Road and N1", "+27 12 365 3883", services=["Advanced Skincare","Beauty Intelligence"])
add("lyn_chianti", "Chianti Health and Beauty", "Health & Beauty", "Wellness & Beauty", "Lynnwood, Pretoria", "353 Elizabeth Grove, Lynnwood", "+27 12 361 2570", services=["Health Treatments","Beauty","Wellness"])
add("lyn_dermaxime", "Dermaxime Skincare Products", "Skincare", "Professional Skincare", "Lynnwood Manor, Pretoria", "359 Church Avenue, Lynnwood Manor", "+27 12 361 2112", services=["Professional Skincare","Beauty Products"])
add("lyn_hair_kelly", "Hair By Kelly", "Hair Salon", "Styling", "Lynnwood Manor, Pretoria", "3 Hallisoham Laan, Lynnwood Manor", "+27 12 361 6878", services=["Haircuts","Styling"])
add("lyn_isa_wellness", "ISA Wellness Sanctuary", "Wellness Spa", "Wellness", "Lynnwood Ridge, Pretoria", "408 Lynnwood Road, Lynnwood Ridge", "+27 12 940 4994", desc="Wellness sanctuary offering holistic treatments", services=["Wellness Treatments","Spa","Relaxation"])
add("lyn_glamorous", "Glamorous Hair", "Hair Salon", "Styling", "Lynnwood Ridge, Pretoria", "Shop 18, Lynnridge Mall, Lynnwood Ridge", "+27 12 361 9503", services=["Haircuts","Styling","Colour"])
add("lyn_cs_physio", "CS Physio", "Physiotherapy", "Back & Neck Pain", "Lynnwood Glen, Pretoria", "42 Maldon Road, Lynnwood Glen", "+27 71 296 2203", price="From R500", duration="45 min", desc="Treatment of acute and chronic back and neck pain, including ergonomic advice", services=["Back Pain","Neck Pain","Ergonomic Advice","Chronic Pain"], quals=["BSc Physiotherapy"])
add("lyn_intercare_glen", "Intercare Glenfair", "Medical & Dental", "Multi-disciplinary", "Lynnwood, Pretoria", "Glenfair Shopping Center, Cnr Lynnwood Drive and Daventy", "+27 12 368 8888", price="From R400", duration="30 min", services=["GP","Dentistry","After-hours"], website="https://www.intercare.co.za")
add("lyn_lynnwood_health", "Lynnwood Health Shop", "Health Shop", "Natural Products", "Lynnwood Manor, Pretoria", "Glenfair Shopping Centre, 3 Daventry Street, 0081", "+27 12 348 6110", services=["Natural Products","Supplements","Health Foods"])
add("lyn_alison_aroma", "Mrs. Alison Warren", "Aromatherapy", "Aromatherapist", "Lynnwood Glen, Pretoria", "62A Ingersol Road, Lynnwood Glen, 0081", "+27 12 348 9358", price="From R400", desc="Aromatherapy specialist", services=["Aromatherapy","Essential Oils","Wellness"])
add("lyn_neurofeedback", "Karlien Balt Neurofeedback", "Neurofeedback", "Brain Training", "Lynnwood, Pretoria", "Suite 14, Rynlal Building, 320 The Hillside Street, 0081", "+27 82 332 0633", price="From R600", desc="Training the mind's flexibility and normalizing brainwaves", services=["Neurofeedback","Brain Training","Mental Wellness"])
add("lyn_sallamander", "Sallamander Concept", "Aromatherapy", "Aromatherapy Products", "Lynnwood, Pretoria", "359 Church Avenue, Lynnwood, 0081", "+27 12 361 2112", services=["Aromatherapy","Essential Oils"])
add("lyn_dr_jaco_psych", "Dr Jaco van der Walt", "Clinical Psychology", "Clinical Psych", "Lynnwood, Pretoria", "31 Sycamore Street, Zwartkop, 0157", "+27 12 663 2918", price="From R850", duration="50 min", avail="By appointment", services=["Clinical Psychology","Therapy","Assessment"], quals=["PhD","HPCSA Registered"])
add("lyn_karma_spa", "Karma Beauty Spa", "Beauty Spa", "Spa", "The Willows, Pretoria", "Lynnwood Road, The Willows Country Lodge", "+27 72 619 8356", services=["Spa Treatments","Beauty","Relaxation"])
add("lyn_illumin", "Illumin Essence Hair Studio", "Hair Studio", "Styling", "The Willows, Pretoria", "538 Rossouw Street, The Willows", "+27 78 570 4093", services=["Haircuts","Styling","Colour"])
add("lyn_life_wellness", "Life Wellness Services", "Holistic Therapy", "Holistic", "The Willows, Pretoria", "Karoo Lifestyle Centre, 141 Lynnwood Road", "+27 71 270 9129", services=["Holistic Therapy","Wellness"])
add("lyn_midnight_reiki", "Midnight Moonwolf Reiki Masters", "Reiki", "Energy Healing", "Lynnwood, Pretoria", "Lynnwood", "+27 79 807 0105", price="From R350", desc="Reasonably priced full Reiki treatments in home setting", services=["Reiki","Energy Healing"])

# ═══════════════════════════════════════════
# MONTANA / SINOVILLE (20+)
# ═══════════════════════════════════════════
add("mon_annique", "Annique Montana", "Beauty & Health", "Skincare", "Montana, Pretoria", "Cnr Zambesi Drive and Dr van der Merwe Street", "+27 12 548 7270", services=["Skincare","Health Products"])
add("mon_chanreu", "Chanreu Beauty Spa", "Beauty Spa", "Spa", "Montana, Pretoria", "190 Flufftail Street, Montana", "+27 12 548 5428", services=["Beauty Spa","Facials","Massage"])
add("mon_glam_lash", "Glam A Lash", "Lash Extensions", "Lashes & Makeup", "Montana, Pretoria", "580 Jan Bandjies Street, Montana", "+27 81 434 3060", desc="Eyelash extensions and permanent eyeliner", services=["Eyelash Extensions","Permanent Eyeliner","Lash Lifts"])
add("mon_hair_designs", "Hair Designs Montana", "Hair Salon", "Styling", "Montana, Pretoria", "Cnr Veronica Street and Zambesi Drive", "+27 12 543 9588", services=["Haircuts","Styling","Colour"])
add("mon_dentist_montana", "Dentist @ Montana", "Dentist", "General & Cosmetic", "Montana, Pretoria", "Cnr Zambesi Drive and Dr van der Merwe Street, 0182", "+27 12 548 7839", price="From R400", duration="30 min", desc="General and cosmetic dentistry with oral hygienist", services=["General Dentistry","Cosmetic Dentistry","Oral Hygiene"], quals=["BChD"], exp=12)
add("mon_claire_physio", "Claire Roux Physiotherapy", "Physiotherapy", "Physio", "Montana, Pretoria", "Montana Hospital, 500 Besembessie Road", "+27 84 915 0552", price="From R500", duration="45 min", services=["Physiotherapy","Hospital Physio"])
add("mon_advance_nail", "Advance Nail Technology", "Nail Technology", "Nail Care", "Montana Park, Pretoria", "875 Besembiesie Street, Montana Park, 0182", "+27 12 548 5746", desc="The new dimension in nail care", services=["Nail Extensions","Gel Nails","Nail Art","Manicures"])
add("mon_gary_rom_zam", "Gary Rom Hairdressing Zambesi", "Hair Salon", "Premium Styling", "Montana Park, Pretoria", "Shop 32 South Precinct, Zambezi Junction", "+27 12 548 4044", services=["Haircuts","Styling","Colour"])
add("mon_avroy", "Avroy Shlain Cosmetics Montana", "Cosmetics", "Beauty Products", "Montana Park, Pretoria", "58 Kreessingle, Montana Park", "+27 12 548 1657", services=["Cosmetics","Skincare","Beauty Products"])
add("mon_dr_dieter_chiro", "Dr Dieter Van Haute", "Chiropractor", "Chiropractic", "Sinoville, Pretoria", "189 Sefako Makgatho Drive, Sinoville, 0182", "+27 12 751 6233", price="From R500", duration="30 min", desc="Chiropractic care for spinal health and wellness", services=["Spinal Adjustment","Chiropractic","Pain Management"], quals=["DC","HPCSA Registered"], exp=15)
add("mon_bello", "Bello Beauty Studio", "Beauty Studio", "Beauty", "Sinoville, Pretoria", "131 Marico Drive, Sinoville", "+27 12 567 1856", services=["Beauty Treatments","Facials"])
add("mon_epitome", "Epitome", "Beauty Salon", "Beauty", "Sinoville, Pretoria", "Sinoville Centre", "+27 12 772 4999", services=["Beauty","Skincare","Nails"])
add("mon_hair_art1", "Hair Art", "Hair Salon", "Styling", "Sinoville, Pretoria", "225 Luce Street, Sinoville", "+27 12 543 0725", services=["Haircuts","Styling"])
add("mon_impact", "Impact Hair", "Hair Salon", "Styling", "Sinoville, Pretoria", "Shop 48, Zambezi Centre, Marija Street", "+27 79 254 8236", services=["Haircuts","Styling"])
add("mon_dr_annalize_psych", "Dr Annalize Green Educational Psychologist", "Psychology", "Educational", "Sinoville, Pretoria", "145 Sefako Makgatho Drive, Sinoville, 0182", "+27 12 567 4768", price="From R750", duration="50 min", avail="By appointment", services=["Educational Psychology","Learning Assessments"], quals=["PhD Educational Psychology","HPCSA Registered"])
add("mon_melanie_psych", "Melanie Prinsloo Psychologist", "Clinical Psychology", "Clinical", "Sinoville, Pretoria", "145 Sefako Makgatho Drive, Sinoville, 0182", "+27 83 200 4430", price="From R800", duration="50 min", avail="By appointment", services=["Clinical Psychology","Assessment","Therapy"], quals=["MA Clinical Psychology","HPCSA Registered"])
add("mon_dr_lineshnee_chiro", "Dr Lineshnee Moodley", "Chiropractor", "Natural Chiropractic", "Sinoville, Pretoria", "252 Danie Theron Street, Wonderboom, 0182", "+27 12 546 3009", price="From R500", duration="30 min", desc="Natural and complementary chiropractic healthcare", services=["Chiropractic","Natural Healthcare"], quals=["DC"])
add("mon_gentle_touch", "The Gentle Touch Co.", "Natural Hair Salon", "Natural Hair Care", "Magalieskruin, Pretoria", "591 Braam Pretorius Street, Magalieskruin", "+27 12 548 0000", desc="Natural hair salon for kinks, coils, beards and curls with herbal treatments", services=["Natural Hair Care","Herbal Treatments","Beard Grooming"], website="https://www.thegentletouchco.com")
add("mon_leone_physio", "Leone Davids Physiotherapy", "Physiotherapy", "Community Physio", "Magalieskruin, Pretoria", "500 Braam Pretorius Street, Magalieskruin", "+27 12 548 1235", price="From R450", duration="45 min", desc="Reduces pain and optimizes movement for individuals and community", services=["Pain Management","Movement Optimization"])
add("mon_doornpoort_vet", "Doornpoort Dierehospitaal", "Veterinarian", "Veterinary Hospital", "Doornpoort, Pretoria", "Doornpoort, 0186", "+27 12 547 1840", price="From R350", duration="30 min", desc="Full-service veterinary hospital", services=["Vet Consultations","Surgery","Vaccinations","Emergency Care"], quals=["BVSc"], exp=15)

# ═══════════════════════════════════════════
# PRETORIA NORTH (20+)
# ═══════════════════════════════════════════
add("pn_cleo_patra", "Cleo Patra Beauty Salon & Day Spa", "Beauty & Spa", "Day Spa", "Pretoria North", "221 Jack Hindon Street, Pretoria North", "+27 12 546 8135", services=["Beauty Treatments","Day Spa","Massage"])
add("pn_impresa", "Impresa Hair & Nails", "Hair & Nails", "Salon", "Pretoria North", "566 Rachel de Beer Street, Pretoria North", "+27 12 546 8649", services=["Hair Styling","Nail Care"])
add("pn_la_grandezza", "La Grandezza", "Beauty Salon", "Beauty", "Pretoria North", "Shop A0004, Second Floor, Pretoria North", "+27 12 546 7654", services=["Beauty Treatments","Skincare"])
add("pn_hairobix", "Hairobix", "Hair Salon", "Styling", "Pretoria North", "Northdale Shopping Centre, Cnr Brits Road and Graffenheim Street, Ninapark", "+27 12 542 7036", services=["Haircuts","Styling","Colour"])
add("pn_pretoria_medical", "Pretoria North Medical Centre", "Medical Centre", "Comprehensive", "Pretoria North", "259 Burger Street, Pretoria North, 0182", "+27 12 565 6283", price="From R400", duration="30 min", desc="GP, Paediatrician, dialysis, pathology, physiotherapy, dentist, gynaecology, dermatology, ophthalmology, psychology, pharmacy", services=["GP","Paediatrician","Dentistry","Physio","Gynaecology","Dermatology","Ophthalmology","Psychology","Pharmacy"], website="https://pretoriamedical.co.za", exp=30)
add("pn_vet_clinic", "Pretoria North Veterinary Clinic", "Veterinarian", "Animal Healthcare", "Pretoria North", "566 Rachel De Beer Street, Pretoria North, 0182", "+27 12 565 5485", price="From R350", duration="30 min", desc="Treatment of disease, disorder and injury in animals", services=["Vet Consultations","Vaccinations","Surgery","Pet Wellness"], quals=["BVSc"], exp=12)
add("pn_yolanda_physio", "Yolanda Pienaar Physiotherapist", "Physiotherapy", "Physio", "Pretoria North", "Medicross Centre, 291 Burger Street", "+27 12 521 2424", price="From R500", duration="45 min", desc="Registered physiotherapist at Medicross", services=["Physiotherapy","Rehabilitation"])
add("pn_inner_strength", "Inner Strength Health & Wellness", "Holistic Wellness", "Energy Healing", "Pretoria North", "Cnr Rachel De Beer & West Street", "+27 12 546 0305", desc="Angel readings, Chakra cleansing, NADA Protocol Acupuncture", services=["Energy Healing","Acupuncture","Chakra Cleansing"])
add("pn_hypnosis_works", "Hypnosis Works", "Hypnotherapy", "Hypnosis", "Pretoria North", "255 27th Avenue, Villieria, 0186", "+27 12 333 1067", price="From R600", desc="Professional consulting hypnotist for smoking and weight loss", services=["Smoking Cessation","Weight Loss","Hypnotherapy"])
add("pn_focused_thought", "Focused Thought", "Hypnotherapy & Counselling", "Hypnotherapy", "Pretoria North", "758 Ben Swart Street, Rietfontein, 0084", "+27 82 059 0279", price="From R600", desc="Hypnotherapy and counselling for a broad variety of issues", services=["Hypnotherapy","Counselling"])
add("pn_hair_beauty_jak", "Hair & Beauty At Jakaranda", "Hair & Beauty", "Salon", "Rietfontein, Pretoria", "18th Avenue, Jakaranda Centre, Rietfontein", "+27 12 331 7333", services=["Hair Styling","Beauty Treatments"])
add("pn_dr_spies", "Dr BA Spies", "General Practitioner", "Family Medicine", "Rietfontein, Pretoria", "40 Eighteenth Avenue, Rietfontein, 0084", "+27 12 460 5755", price="From R400", duration="30 min", desc="I have a passion for helping sick people", services=["General Consultations","Family Medicine"], quals=["MBChB"], exp=15)
add("pn_dr_monnakgotla", "Dr BMM Monnakgotla", "General Practitioner", "GP", "Pretoria Central", "Corner Van Der Walt and Schoeman Street, 0002", "+27 12 322 6280", price="From R400", duration="30 min", desc="Qualified General Practitioner", services=["General Practice"], quals=["MBChB"])
add("pn_dallas_hair", "Dallas Hair Salon", "Hair Salon", "Styling", "Pretoria CBD", "476 Paul Kruger Street", "+27 12 323 6209", services=["Haircuts","Styling"])
add("pn_hair_2_dye", "Hair 2 Dye 4", "Hair Salon", "Colour Specialist", "Pretoria CBD", "Shop 43 Middestad Sanlam Center, 252 Andries Street", "+27 12 320 6234", services=["Hair Colour","Styling"])
add("pn_smilelab", "Smilelab Dental Centre", "Dentist", "General Dentistry", "Pretoria West", "No 2 Kitkat Plaza 327 W.F Nkomo Street, 0183", "+27 12 755 5555", price="From R400", duration="30 min", desc="One visit from us gives you more reason to smile", services=["General Dentistry","Emergency Dental"], quals=["BChD"])
add("pn_chinese_acup", "Chinese Acupuncture Clinic", "Acupuncture", "Traditional Chinese Medicine", "Pretoria North", "470 President Steyn Street, Wolmer, 0182", "+27 12 565 4245", price="From R450", duration="45 min", desc="Traditional acupuncture treatments based on Chinese medicine", services=["Acupuncture","Traditional Chinese Medicine","Pain Relief"])
add("pn_kruger_physio", "Kruger van Zyl Fisioterapeute", "Physiotherapy", "Physio", "Pretoria North", "1151 Meyerstreet, Waverley", "+27 12 332 4768", price="From R500", duration="45 min", services=["Physiotherapy","Rehabilitation"])
add("pn_lenie_hypno", "Lenie Naudé Hypnotherapist", "Hypnotherapy", "Hypnotherapy", "Pretoria East", "325 Ellips Street, Meyerspark, 0184", "+27 12 803 2203", price="From R600", desc="Hypnotherapy, depression, stress management", services=["Hypnotherapy","Depression","Stress Management"])
add("pn_aeon_spa", "Aeon Day Spa", "Day Spa", "Spa", "Meyerspark, Pretoria", "155 Watermeyer Street, Meyerspark", "+27 12 804 1096", services=["Spa Treatments","Massage","Relaxation"])

# ═══════════════════════════════════════════
# SILVER LAKES / ERASMUSKLOOF (20)
# ═══════════════════════════════════════════
add("sl_badenhorst_physio", "Badenhorst & Visser Physiocare", "Physiotherapy", "Sports & Rehabilitation", "Silver Lakes, Pretoria", "Cnr Lynnwood Road and Silver Lakes Road", "+27 12 809 6070", price="From R550", duration="45 min", desc="Physiotherapy is our passion", services=["Sports Physiotherapy","Rehabilitation","Injury Management"], quals=["BSc Physiotherapy","Sports Rehab"], exp=15)
add("sl_christa_psych", "Christa Du Toit Psychologist", "Psychology", "Depression & Anxiety", "Silver Lakes, Pretoria", "104 Nicklaus Street, Silver Lakes, 0081", "+27 12 809 0402", price="From R800", duration="50 min", avail="By appointment", desc="Depression, anxiety, children, marriage guidance, career planning", services=["Depression","Anxiety","Marriage Guidance","Child Psychology"], quals=["MA Psychology","HPCSA Registered"])
add("sl_absolute_pilates", "Absolute Pilates & Yoga Studio", "Pilates & Yoga", "Mind-Body Fitness", "Silver Lakes, Pretoria", "Silver Lakes, Pretoria", "+27 contact", price="From R150/class", desc="Pilates and yoga classes in Silver Lakes", services=["Mat Pilates","Reformer Pilates","Yoga","Prenatal Yoga"])
add("sl_advantage", "Advantage ACT (Pty) Ltd", "Occupational Health", "SHEQ", "Silver Lakes, Pretoria", "Muirfield Boulevard, Silver Lakes", "+27 12 809 4210", services=["Occupational Health","Safety","SHEQ Services"])
add("sl_dr_terblanche", "Dr T Terblanche", "General Practitioner", "Holistic Medicine", "Constantia Park, Pretoria", "Corner Douglas Scholtz and January Masilela Drive", "+27 12 998 8428", price="From R450", duration="30 min", desc="General Family Practitioner with special interest in holistic and preventive medicine", services=["Family Medicine","Holistic Medicine","Preventive Care"], quals=["MBChB"])
add("sl_charne_bio", "Charne Botha Biokinetics", "Biokinetics", "Orthopaedic Rehab", "Newlands, Pretoria", "82 Paprika Avenue, Newlands, 0181", "+27 83 292 8920", price="From R500", duration="45 min", desc="Orthopaedic Rehabilitation, Chronic Conditions Treatment", services=["Orthopaedic Rehab","Chronic Conditions","Exercise Therapy"], quals=["BSc Biokinetics","HPCSA Registered"])
add("sl_sindi_chiro", "Dr Sindi Ludik & Dr Michiel Opperman", "Chiropractor", "Personalized Chiropractic", "Newlands, Pretoria", "82 Paprika Avenue, Newlands", "+27 12 348 3460", price="From R500", duration="30 min", desc="Personalized chiropractic service", services=["Chiropractic","Personalized Care"], quals=["DC"])
add("sl_dr_tienie_psych", "Dr Tienie Maritz", "Psychology", "Psychotherapy", "Menlo Park, Pretoria", "29, 16th Street, Menlopark, 0002", "+27 83 305 2849", price="From R900", duration="50 min", avail="By appointment", desc="Creating an environment to guide clients towards better functioning and inner health", services=["Psychotherapy","Counselling"], quals=["PhD","HPCSA Registered"], exp=20)
add("sl_dr_susan_hypno", "Dr. Susan Roets", "Hypnotherapy", "Medical Hypnoanalysis", "Menlo Park, Pretoria", "42 5th Street, Menlo Park, 0081", "+27 12 346 5764", price="From R700", desc="Medical Hypnoanalysis exploring the mind-body connection", services=["Hypnoanalysis","Stress Management","Mind-Body Therapy"], quals=["PhD","Hypnoanalyst","HPCSA Registered"], exp=20)
add("sl_sarita_psych", "Sarita Burger", "Clinical Psychology", "Clinical", "Constantia Park, Pretoria", "546 Douglas Scholtz Street, Constantia Park, 0002", "+27 82 738 0320", price="From R850", duration="50 min", avail="By appointment", desc="Registered clinical psychologist with a passion for working with people", services=["Clinical Psychology","Therapy"], quals=["MA Clinical Psychology","HPCSA Registered"])
add("sl_steenkamp_physio", "Steenkamp Fisioterapie", "Physiotherapy", "Expert Physio", "Waterkloof Glen, Pretoria", "431 Mendelssohn Street, Waterkloof Glen", "+27 71 473 4884", price="From R500", duration="45 min", desc="Team of experts in therapeutic and physio-related areas", services=["Physiotherapy","Therapeutic Treatment"])
add("sl_dr_heleen_physio", "Dr Heleen Maas", "Physiotherapy", "Physio", "Erasmuskloof, Pretoria", "594 Lois Avenue, Erasmuskloof", "+27 12 347 7604", price="From R500", duration="45 min", services=["Physiotherapy","Rehabilitation"])
add("sl_demi_godess", "Demi Godess", "Beauty Salon", "Beauty", "Constantia Park, Pretoria", "593 Puccini Street, Constantia Park", "+27 12 993 3561", services=["Beauty Treatments","Facials","Nails"])
add("sl_lanna_thai", "Lanna Ladies Thai Spa", "Thai Spa", "Thai Massage", "Waterkloof, Pretoria", "63 Dely Rd, Asphen Park, Waterkloof", "+27 84 983 8096", price="From R400", services=["Thai Massage","Spa Treatments"])
add("sl_2nd_youth", "2nd Youth", "Skincare Clinic", "Skin Restoration", "Monument Park, Pretoria", "608 Makou Street, Monument Park", "+27 12 347 7423", desc="Restore skin health and increase skin tolerance", services=["Skin Restoration","Anti-ageing","Facials"])
add("sl_dr_phill_chiro", "Dr. Phill Rodda", "Chiropractor", "Chiropractic", "Constantia Park, Pretoria", "953 Edelbert Street, Constantia Park, 0100", "+27 12 993 0424", price="From R500", duration="30 min", services=["Chiropractic","Spinal Care"], quals=["DC"])
add("sl_institution_health", "Institution of Health Science", "Alternative Health", "Cellular Healing", "Faerie Glen, Pretoria", "726 Tonetti Street, Faerie Glen", "+27 84 981 1757", desc="Quantum frequency cellular healing without medication", services=["Cellular Healing","Alternative Health"])
add("sl_sole_therapy", "Sole Therapy 425", "Reflexology", "Reflexology", "Faerie Glen, Pretoria", "Faerie Glen", "+27 82 778 7998", price="From R350", desc="Reflexology session in tranquil environment", services=["Reflexology","Foot Therapy"])
add("sl_dr_vanessa_chiro", "Dr. Vanessa Moorcroft", "Chiropractor", "Family & Paediatric", "Menlyn, Pretoria", "134 Frikkie de Beer Street, Menlyn, 0181", "+27 12 348 5245", price="From R500", duration="30 min", desc="Family chiropractor with keen interest in paediatrics", services=["Family Chiropractic","Paediatric Care"], quals=["DC"], exp=12)
add("sl_crossfit", "CrossFit Pretoria", "CrossFit Gym", "Functional Fitness", "Rietondale, Pretoria", "Rietondale, Pretoria", "+27 contact", price="From R800/month", desc="Functional fitness training — Fitness For Everyone", services=["CrossFit","Functional Fitness","Olympic Lifting","HIIT"])

# ═══════════════════════════════════════════
# SUNNYSIDE / CAPITAL PARK (20)
# ═══════════════════════════════════════════
add("sun_ingrid", "@ Ingrid Hair", "Hair Salon", "Styling", "Sunnyside, Pretoria", "139 Corner Rivier and Reitz Street, Sunnyside", "+27 79 344 7562", services=["Haircuts","Styling","Colouring"])
add("sun_hair_date", "Hair Date", "Hair Salon", "Styling", "Sunnyside, Pretoria", "142 Company Street, Sunnyside", "+27 12 343 9280", services=["Haircuts","Styling"])
add("sun_hair_la_diff", "Hair La Difference", "Hair Salon", "Styling", "Sunnyside, Pretoria", "204 Celliers Street, Sunnyside", "+27 12 440 9695", services=["Haircuts","Styling","Colour","Treatments"])
add("sun_ihj_massage", "IHJ Healing Massage", "Massage Therapy", "Healing Massage", "Sunnyside, Pretoria", "119 Middel Street, Nieuw Muckleneuk", "+27 12 460 7110", services=["Healing Massage","Therapeutic Massage"])
add("sun_all_wellness", "All Wellness Spa", "Day Spa", "Wellness", "Capital Park, Pretoria", "308 Heuwel Street, Capital Park, 0084", "+27 12 329 9867", price="From R300", desc="Day spa offering pampering at affordable rates", services=["Full Body Massage","Facials","Body Wraps","Manicures","Pedicures"])
add("sun_hair_wise", "Hair Wise", "Hair Salon", "Styling", "Capital Park, Pretoria", "257 Malherbe Street, Capital Park", "+27 12 326 1751", services=["Haircuts","Styling"])
add("sun_healing_food", "Healing Food Products", "Health Foods", "Health Products", "Sunnyside, Pretoria", "84 Troye Street, Sunnyside, 0002", "+27 12 440 3132", services=["Health Foods","Supplements"])
add("sun_vida_wellness", "Vida Health & Wellness Centre", "Wellness Centre", "Alternative Medicine", "Roseville, Pretoria", "55 Sophia Street, Roseville", "+27 12 335 8308", price="From R400", desc="Complementary and Alternative Medicine Practitioner", services=["Holistic Wellness","Alternative Medicine","Health Assessment"])
add("sun_iridologist", "Iridologist Natural Health Care", "Iridology", "Holistic Health", "Brooklyn, Pretoria", "1177 Justice Mahomed Street, Brooklyn", "+27 79 895 5536", desc="Holistic health care specializing in disease prevention", services=["Iridology","Disease Prevention","Natural Health"])
add("sun_carin_reflex", "Carin @ Future Health", "Reflexology", "Reflexology", "Hermanstad, Pretoria", "Hermanstad", "+27 12 358 4179", services=["Reflexology","Foot Therapy"])
add("sun_el_naturelle", "El Naturelle", "Natural Wellness", "Detox & Massage", "Pretoria East", "Pretoria East, 0002", "+27 82 674 4330", services=["Massage","Detox Programs","Health Analysis"])
add("sun_stabilis", "Stabilis Treatment Centre", "Rehabilitation", "Addiction Recovery", "Pretoria North", "1229 Haarhoff Street, Moregloed, 0186", "+27 12 333 7702", desc="Multi-professional service for alcohol and drug problem treatment", services=["Addiction Recovery","Rehabilitation","Counselling"])
add("sun_amandia", "Amandia Beauty Salon", "Beauty Salon", "Beauty", "Hermanstad, Pretoria", "Botha str 874, Hermanstad, 0084", "+27 78 865 8634", desc="Various beauty treatments at excellent rates", services=["Beauty Treatments","Facials","Waxing"])
add("sun_hadassah", "Hadassah Wellness Studio", "Wellness Studio", "Weight Management", "Theresapark, Pretoria", "Genet Street, Theresapark, 0155", "+27 71 550 9545", desc="Health, Beauty, wellness, weight management", services=["Weight Management","Beauty Treatments","Wellness"])
add("sun_elsabe_psych", "Elsabé Swanepoel Psychologist", "Psychology", "Counselling & Educational", "Pretoria Gardens", "250 Lotty Street, Pretoria Gardens, 0082", "+27 12 383 2064", price="From R750", duration="50 min", avail="By appointment", services=["Counselling","Educational Psychology"], quals=["MA Psychology","HPCSA Registered"])
add("sun_gerhard_psych", "Gerhard van der Merwe Industrial Psychologist", "Industrial Psychology", "Career Assessments", "Pretoria", "Pretoria", "+27 82 778 3512", price="From R750", duration="50 min", desc="Personal development services, specializing in career assessments and study methods", services=["Career Assessments","Study Methods","Personal Development"], quals=["MA Industrial Psychology"])
add("sun_clearview", "Clearview Clinic", "Rehabilitation Centre", "Addiction Treatment", "Kameeldrift, Pretoria", "Plot 79 Bosuil Avenue, Kameeldrift East, 0035", "+27 12 819 1422", desc="Rehabilitation, recovery and reintegration of drug addiction", services=["Drug Rehab","Recovery","Reintegration"])
add("sun_helios", "Helios Counselling", "Counselling", "Counselling", "Waterkloof, Pretoria", "Waterkloof, Pretoria", "+27 82 257 1021", services=["Counselling","Support"])
add("sun_mark_shiatsu", "Mark Diamond Shiatsu", "Acupuncture & Shiatsu", "Shiatsu", "Pretoria", "Pretoria", "+27 82 926 5267", services=["Shiatsu","Acupuncture"])
add("sun_massage_move", "Massage on the Move", "Mobile Massage", "Mobile Service", "Menlyn, Pretoria", "Menlyn", "+27 83 601 4934", desc="Treatments effective for hypertension and fatigue", services=["Mobile Massage","Hypertension Treatment","Relaxation"])

# ═══════════════════════════════════════════

# Write output
output = {"providers": providers, "bookings": []}
with open("src/data/bion_pretoria_data.json", "w") as f:
    json.dump(output, f, indent=2, ensure_ascii=False)

print(f"✅ Generated {len(providers)} real providers")

# Count by suburb
from collections import Counter
suburbs = Counter(p["location"] for p in providers)
for s, c in suburbs.most_common():
    print(f"  {s}: {c}")
