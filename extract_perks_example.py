import os
import json

def extract_perk_info(file_path):
    """
    Extracts perk information from a single JSON file.
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    perk_name = "N/A"
    perk_description = "N/A"
    perk_ability = "N/A"
    perk_points_cost = "N/A"

    # Assuming the relevant information is in the second object of the JSON array
    if isinstance(data, list) and len(data) > 1 and "Properties" in data[1]:
        properties = data[1]["Properties"]
        if "Name" in properties and "LocalizedString" in properties["Name"]:
            perk_name = properties["Name"]["LocalizedString"].strip()
            if not perk_name: # If LocalizedString is empty, try SourceString
                perk_name = properties["Name"]["SourceString"].strip()
        if "Description" in properties and "LocalizedString" in properties["Description"]:
            perk_description = properties["Description"]["LocalizedString"].strip()
            if not perk_description: # If LocalizedString is empty, try SourceString
                perk_description = properties["Description"]["SourceString"].strip()
        if "Perk" in properties and "Ability" in properties["Perk"]:
            perk_ability = properties["Perk"]["Ability"].replace("EMistPerkAbility::", "")
        if "PointsCost" in properties:
            perk_points_cost = str(properties["PointsCost"])
            
    # Fallback for root perks where name and description might be in the first object
    if perk_name == "N/A" and isinstance(data, list) and len(data) > 0 and "Properties" in data[0]:
        properties = data[0]["Properties"]
        if "Name" in properties and "LocalizedString" in properties["Name"]:
            perk_name = properties["Name"]["LocalizedString"].strip()
            if not perk_name:
                perk_name = properties["Name"]["SourceString"].strip()
        if "Description" in properties and "LocalizedString" in properties["Description"]:
            perk_description = properties["Description"]["LocalizedString"].strip()
            if not perk_description:
                perk_description = properties["Description"]["SourceString"].strip()

    return {
        "name": perk_name,
        "description": perk_description,
        "ability": perk_ability,
        "points_cost": perk_points_cost
    }

def main():
    base_path = "Mist\Content\Mist\Data\Perks"
    output_file = "Perks_Information.md"

    perk_data = []
    for root, _, files in os.walk(base_path):
        for file in files:
            if file.endswith(".json"):
                file_path = os.path.join(root, file)
                info = extract_perk_info(file_path)
                # Only add if a meaningful name is found
                if info["name"] and info["name"] != "N/A" and info["name"] != " ":
                    perk_data.append(info)

    with open(output_file, 'w', encoding='utf-8') as md_file:
        md_file.write("# Perk Information\n\n")
        for perk in perk_data:
            md_file.write(f"## {perk['name']}\n")
            md_file.write(f"**Description:** {perk['description']}\n")
            if perk['ability'] != "N/A":
                md_file.write(f"**Ability:** {perk['ability']}\n")
            if perk['points_cost'] != "N/A":
                md_file.write(f"**Points Cost:** {perk['points_cost']}\n")
            md_file.write("\n")

    print(f"Perk information extracted and saved to {output_file}")

if __name__ == "__main__":
    main()