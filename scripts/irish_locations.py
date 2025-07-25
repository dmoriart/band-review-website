#!/usr/bin/env python3
"""
Irish Locations Reference
Complete list of all counties and major cities in Ireland for consistent use across scrapers
"""

def get_all_irish_counties():
    """Get complete list of all 32 counties in Ireland (Republic + Northern Ireland)"""
    return [
        # Republic of Ireland (26 counties)
        "Antrim", "Armagh", "Carlow", "Cavan", "Clare", "Cork", 
        "Derry", "Donegal", "Down", "Dublin", "Fermanagh", "Galway",
        "Kerry", "Kildare", "Kilkenny", "Laois", "Leitrim", "Limerick",
        "Longford", "Louth", "Mayo", "Meath", "Monaghan", "Offaly",
        "Roscommon", "Sligo", "Tipperary", "Tyrone", "Waterford", 
        "Westmeath", "Wexford", "Wicklow"
    ]

def get_all_irish_cities_and_towns():
    """Get comprehensive list of major cities and towns across Ireland"""
    return [
        # Major Cities
        "Dublin", "Cork", "Belfast", "Galway", "Limerick", "Waterford",
        
        # Large Towns (County Towns and Major Centers)
        "Drogheda", "Kilkenny", "Wexford", "Sligo", "Dundalk", "Bray",
        "Navan", "Ennis", "Tralee", "Carlow", "Naas", "Athlone",
        "Portlaoise", "Mullingar", "Clonakilty", "Moate", "Derry",
        "Newry", "Armagh", "Omagh", "Enniskillen", "Ballymena",
        "Coleraine", "Lisburn", "Bangor", "Newtownabbey",
        
        # Additional Major Towns
        "Letterkenny", "Monaghan", "Cavan", "Roscommon", "Longford",
        "Tullamore", "Birr", "Nenagh", "Thurles", "Clonmel", "Dungarvan",
        "New Ross", "Gorey", "Arklow", "Wicklow", "Greystones", "Leixlip",
        "Celbridge", "Maynooth", "Athy", "Newbridge", "Kildare", "Trim",
        "Kells", "Ashbourne", "Laytown", "Bettystown", "Ardee", "Carrickmacross",
        "Castleblayney", "Ballybay", "Clones", "Granard", "Edgeworthstown",
        "Ballymahon", "Lanesborough", "Strokestown", "Boyle", "Tubbercurry",
        "Enniscrone", "Ballina", "Westport", "Castlebar", "Claremorris",
        "Ballinrobe", "Swinford", "Charlestown", "Kiltimagh", "Ballyhaunis",
        "Foxford", "Crossmolina", "Belmullet", "Achill", "Newport",
        "Louisburgh", "Leenane", "Clifden", "Ballinasloe", "Tuam",
        "Gort", "Loughrea", "Portumna", "Mountbellew", "Headford",
        "Oughterard", "Spiddal", "Kinvara", "Clarinbridge", "Oranmore",
        "Salthill", "Moycullen", "Kilronan", "Milltown Malbay", "Lahinch",
        "Ennistymon", "Lisdoonvarna", "Ballyvaughan", "Corofin", "Tulla",
        "Sixmilebridge", "Shannon", "Newmarket-on-Fergus", "Quin", "Kilrush",
        "Kilkee", "Listowel", "Ballybunion", "Tarbert", "Abbeyfeale",
        "Newcastle West", "Rathkeale", "Askeaton", "Adare", "Kilmallock",
        "Charleville", "Bruff", "Croom", "Pallasgreen", "Murroe", "Cappamore",
        "Doon", "Oola", "Hospital", "Knocklong", "Galbally", "Emly",
        "Tipperary", "Cashel", "Fethard", "Mullinahone", "Callan", "Thomastown",
        "Graiguenamanagh", "Inistioge", "Bennettsbridge", "Freshford", "Urlingford",
        "Johnstown", "Windgap", "Mooncoin", "Piltown", "Fiddown", "Ballyhale",
        "Knocktopher", "Kells", "Stoneyford", "Gowran", "Paulstown", "Bagenalstown",
        "Muine Bheag", "Borris", "Myshall", "Rathvilly", "Tullow", "Hacketstown",
        "Tinahely", "Shillelagh", "Carnew", "Avoca", "Rathdrum", "Laragh",
        "Glendalough", "Roundwood", "Ashford", "Kilcoole", "Newcastle",
        "Delgany", "Kilpedder", "Newtownmountkennedy", "Rathnew", "Avondale",
        "Dunlavin", "Baltinglass", "Blessington", "Saggart", "Rathcoole",
        "Clondalkin", "Lucan", "Palmerstown", "Chapelizod", "Blanchardstown",
        "Castleknock", "Mulhuddart", "Swords", "Malahide", "Portmarnock",
        "Howth", "Sutton", "Baldoyle", "Clontarf", "Raheny", "Kilbarrack",
        "Coolock", "Artane", "Beaumont", "Drumcondra", "Glasnevin", "Finglas",
        "Ballymun", "Santry", "Whitehall", "Phibsborough", "Cabra", "Stoneybatter",
        "Smithfield", "Oxmantown", "Grangegorman", "Broadstone", "Parnell",
        "Summerhill", "Mountjoy", "Dorset", "Gardiner", "Buckingham", "Fitzwilliam",
        "Merrion", "Ballsbridge", "Donnybrook", "Ranelagh", "Rathmines", "Rathgar",
        "Terenure", "Rathfarnham", "Templeogue", "Knocklyon", "Firhouse", "Tallaght",
        "Jobstown", "Clondalkin", "Ronanstown", "Lucan", "Adamstown", "Celbridge",
        "Straffan", "Kilcock", "Prosperous", "Allenwood", "Derrinturn", "Carbury",
        "Edenderry", "Daingean", "Walsh Island", "Ferbane", "Banagher", "Cloghan",
        "Shannonbridge", "Clonmacnoise", "Leabeg", "Ballycumber", "Mucklagh",
        "Clara", "Horseleap", "Moate", "Streamstown", "Fardrum", "Glasson",
        "Tang", "Ballymore", "Rochfortbridge", "Tyrellspass", "Kilbeggan",
        "Milltownpass", "Delvin", "Castletown-Geoghegan", "Crookedwood", "Collinstown",
        "Fore", "Castlepollard", "Oldcastle", "Ballinagh", "Killeshandra",
        "Belturbet", "Ballyconnell", "Blacklion", "Dowra", "Glangevlin",
        "Swanlinbar", "Bawnboy", "Butlersbridge", "Ballyjamesduff", "Virginia",
        "Cootehill", "Shercock", "Kingscourt", "Carrickmacross", "Inniskeen",
        "Oram", "Emyvale", "Glaslough", "Scotshouse", "Newbliss", "Smithborough",
        "Threemilehouse", "Tyholland", "Tydavnet", "Ballybay", "Rockcorry",
        "Aughnacloy", "Ballygawley", "Clogher", "Fivemiletown", "Lisnaskea",
        "Brookeborough", "Maguiresbridge", "Derrygonnelly", "Kesh", "Belleek",
        "Garrison", "Belcoo", "Blacklion", "Swanlinbar", "Ballyshannon",
        "Bundoran", "Kinlough", "Tullaghan", "Cliffony", "Grange", "Drumcliff",
        "Rathcormack", "Ballysadare", "Collooney", "Ballymote", "Gurteen",
        "Swinford", "Charlestown", "Knock", "Claremorris", "Ballindine",
        "Milltown", "Kilmaine", "Ballinrobe", "Partry", "Tourmakeady",
        "Leenane", "Louisburgh", "Murrisk", "Westport", "Newport", "Mulranny",
        "Achill Sound", "Keel", "Dugort", "Pollagh", "Belmullet", "Blacksod",
        "Ballina", "Killala", "Ballycastle", "Belderrig", "Porturlin", "Carrowteige",
        "Crossmolina", "Lahardane", "Pontoon", "Foxford", "Swinford", "Kiltimagh",
        "Knock", "Charlestown", "Ballyhaunis", "Bekan", "Ballaghaderreen",
        "Frenchpark", "Tulsk", "Strokestown", "Elphin", "Boyle", "Carrick-on-Shannon",
        "Drumshanbo", "Leitrim", "Manorhamilton", "Kinlough", "Dromahair",
        "Drumkeerin", "Dowra", "Glencar", "Glenade", "Rossinver", "Tullaghan"
    ]

def get_search_areas_with_coordinates():
    """Get search areas with coordinates for Google Places API"""
    return [
        # Major cities with larger radius
        {"name": "Dublin", "lat": 53.3498, "lng": -6.2603, "radius": 25000},
        {"name": "Cork", "lat": 51.8979, "lng": -8.4769, "radius": 20000},
        {"name": "Belfast", "lat": 54.5973, "lng": -5.9301, "radius": 20000},
        {"name": "Galway", "lat": 53.2707, "lng": -9.0568, "radius": 15000},
        {"name": "Limerick", "lat": 52.6638, "lng": -8.6267, "radius": 15000},
        {"name": "Waterford", "lat": 52.2593, "lng": -7.1101, "radius": 15000},
        
        # County towns and major centers
        {"name": "Kilkenny", "lat": 52.6541, "lng": -7.2448, "radius": 10000},
        {"name": "Wexford", "lat": 52.3369, "lng": -6.4633, "radius": 10000},
        {"name": "Sligo", "lat": 54.2698, "lng": -8.4694, "radius": 10000},
        {"name": "Dundalk", "lat": 54.0019, "lng": -6.4052, "radius": 10000},
        {"name": "Drogheda", "lat": 53.7189, "lng": -6.3478, "radius": 10000},
        {"name": "Tralee", "lat": 52.2713, "lng": -9.7016, "radius": 10000},
        {"name": "Athlone", "lat": 53.4222, "lng": -7.9372, "radius": 10000},
        {"name": "Ennis", "lat": 52.8438, "lng": -8.9864, "radius": 10000},
        {"name": "Letterkenny", "lat": 54.9503, "lng": -7.7353, "radius": 10000},
        {"name": "Carlow", "lat": 52.8417, "lng": -6.9264, "radius": 8000},
        {"name": "Naas", "lat": 53.2158, "lng": -6.6686, "radius": 8000},
        {"name": "Portlaoise", "lat": 53.0344, "lng": -7.2985, "radius": 8000},
        {"name": "Mullingar", "lat": 53.5239, "lng": -7.3398, "radius": 8000},
        {"name": "Tullamore", "lat": 53.2736, "lng": -7.4881, "radius": 8000},
        {"name": "Navan", "lat": 53.6538, "lng": -6.6802, "radius": 8000},
        {"name": "Bray", "lat": 53.2026, "lng": -6.1114, "radius": 8000},
        {"name": "Wicklow", "lat": 52.9808, "lng": -6.0431, "radius": 8000},
        {"name": "Arklow", "lat": 52.7919, "lng": -6.1536, "radius": 8000},
        
        # Northern Ireland centers
        {"name": "Derry", "lat": 54.9966, "lng": -7.3086, "radius": 12000},
        {"name": "Newry", "lat": 54.1751, "lng": -6.3402, "radius": 10000},
        {"name": "Armagh", "lat": 54.3503, "lng": -6.6528, "radius": 8000},
        {"name": "Omagh", "lat": 54.6017, "lng": -7.3073, "radius": 8000},
        {"name": "Enniskillen", "lat": 54.3445, "lng": -7.6362, "radius": 8000},
        {"name": "Ballymena", "lat": 54.8642, "lng": -6.2736, "radius": 8000},
        {"name": "Coleraine", "lat": 55.1344, "lng": -6.6681, "radius": 8000},
        {"name": "Lisburn", "lat": 54.5162, "lng": -6.0581, "radius": 8000},
        {"name": "Bangor", "lat": 54.6536, "lng": -5.6683, "radius": 8000},
        
        # Western coastal areas
        {"name": "Westport", "lat": 53.8008, "lng": -9.5182, "radius": 8000},
        {"name": "Castlebar", "lat": 53.8561, "lng": -9.2985, "radius": 8000},
        {"name": "Ballina", "lat": 54.1133, "lng": -9.1561, "radius": 8000},
        {"name": "Clifden", "lat": 53.4889, "lng": -10.0206, "radius": 6000},
        {"name": "Killarney", "lat": 52.0599, "lng": -9.5044, "radius": 8000},
        {"name": "Kenmare", "lat": 51.8831, "lng": -9.5844, "radius": 6000},
        {"name": "Dingle", "lat": 52.1406, "lng": -10.2681, "radius": 6000},
        
        # Midlands and other regional centers
        {"name": "Roscommon", "lat": 53.6278, "lng": -8.1861, "radius": 6000},
        {"name": "Longford", "lat": 53.7278, "lng": -7.7933, "radius": 6000},
        {"name": "Cavan", "lat": 53.9906, "lng": -7.3606, "radius": 8000},
        {"name": "Monaghan", "lat": 54.2489, "lng": -6.9683, "radius": 8000},
        {"name": "Carrick-on-Shannon", "lat": 53.9472, "lng": -8.0958, "radius": 6000},
        {"name": "Manorhamilton", "lat": 54.3006, "lng": -8.1764, "radius": 6000},
        
        # Southern coastal and inland areas
        {"name": "Clonmel", "lat": 52.3553, "lng": -7.7044, "radius": 8000},
        {"name": "Thurles", "lat": 52.6811, "lng": -7.8119, "radius": 6000},
        {"name": "Tipperary", "lat": 52.4733, "lng": -8.1567, "radius": 6000},
        {"name": "Cahir", "lat": 52.3775, "lng": -7.9194, "radius": 6000},
        {"name": "Cashel", "lat": 52.5158, "lng": -7.8858, "radius": 6000},
        {"name": "Dungarvan", "lat": 52.0883, "lng": -7.6264, "radius": 8000},
        {"name": "Lismore", "lat": 52.1358, "lng": -7.9364, "radius": 6000},
        {"name": "New Ross", "lat": 52.3967, "lng": -6.9419, "radius": 6000},
        {"name": "Enniscorthy", "lat": 52.5019, "lng": -6.5581, "radius": 6000},
        {"name": "Gorey", "lat": 52.6756, "lng": -6.2947, "radius": 6000}
    ]

def get_irish_locations_list():
    """Get lowercase list of Irish locations for filtering"""
    counties = [county.lower() for county in get_all_irish_counties()]
    cities = [city.lower() for city in get_all_irish_cities_and_towns()]
    return counties + cities + ['ireland', 'éire', 'northern ireland']
