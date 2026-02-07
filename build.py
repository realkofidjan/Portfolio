#!/usr/bin/env python3
"""
Build script: parses LinkedIn Profile.pdf → generates data/profile.json

Usage:
    1. Export your LinkedIn profile as PDF and save it to linkedin/Profile.pdf
    2. Run: python3 build.py
    3. The script generates data/profile.json with structured profile data

Requires: pip install pymupdf
"""

import json
import os
import re
import sys

try:
    import fitz  # PyMuPDF
except ImportError:
    print("Error: pymupdf is required. Install it with:")
    print("  pip install pymupdf")
    sys.exit(1)

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PDF_PATH = os.path.join(SCRIPT_DIR, "linkedin", "Profile.pdf")
OUTPUT_PATH = os.path.join(SCRIPT_DIR, "data", "profile.json")


def extract_text_from_pdf(pdf_path):
    """Extract all text from a PDF file."""
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    return text


def parse_linkedin_pdf(text):
    """Parse LinkedIn PDF text into structured data.

    LinkedIn PDF exports follow a predictable format:
    - Name at the top
    - Headline
    - Location
    - Summary/About section
    - Experience section with jobs
    - Education section
    - Skills section
    """
    lines = [line.strip() for line in text.split("\n") if line.strip()]

    profile = {
        "name": "",
        "headline": "",
        "location": "",
        "about": "",
        "experienceStartYear": 2022,
        "experience": [],
        "education": [],
        "skills": [],
        "certifications": [],
    }

    if not lines:
        return profile

    # First non-empty line is typically the name
    profile["name"] = lines[0]

    # Second line is typically the headline
    if len(lines) > 1:
        profile["headline"] = lines[1]

    # Find location - usually contains a country or region name
    for i, line in enumerate(lines[2:10], start=2):
        if any(
            loc in line.lower()
            for loc in [
                "ghana",
                "accra",
                "nigeria",
                "lagos",
                "kenya",
                "nairobi",
                "london",
                "new york",
                "region",
                "area",
                "city",
                "state",
                "country",
            ]
        ):
            profile["location"] = line
            break

    # Parse sections
    section_markers = {
        "summary": ["summary", "about"],
        "experience": ["experience"],
        "education": ["education"],
        "skills": ["skills", "top skills"],
        "certifications": [
            "licenses & certifications",
            "certifications",
            "licenses",
        ],
    }

    current_section = None
    section_lines = {key: [] for key in section_markers}
    i = 0

    while i < len(lines):
        line_lower = lines[i].lower().strip()

        # Check if this line starts a new section
        found_section = None
        for section, markers in section_markers.items():
            if line_lower in markers:
                found_section = section
                break

        if found_section:
            current_section = found_section
            i += 1
            continue

        if current_section:
            section_lines[current_section].append(lines[i])

        i += 1

    # Parse About/Summary
    if section_lines["summary"]:
        # Filter out page markers and join
        about_lines = [
            l for l in section_lines["summary"] if not re.match(r"^Page \d+", l)
        ]
        profile["about"] = " ".join(about_lines)

    # Parse Experience
    exp_lines = section_lines["experience"]
    i = 0
    while i < len(exp_lines):
        line = exp_lines[i]

        # Look for date patterns like "Mon YYYY - Present" or "Mon YYYY - Mon YYYY"
        date_pattern = r"((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})\s*-\s*(Present|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})"
        date_match = re.search(date_pattern, line)

        if date_match:
            date_str = line.strip()
            # The title is usually the line before the date
            title = exp_lines[i - 1] if i > 0 else ""
            # The company is usually the line before the title, or after the date
            company = ""
            description = ""

            # Look ahead for company and description
            j = i + 1
            if j < len(exp_lines):
                # Next line could be company or location
                next_line = exp_lines[j]
                if not re.search(date_pattern, next_line):
                    company = next_line
                    j += 1

            # Collect description lines until next date or end
            desc_parts = []
            while j < len(exp_lines):
                if re.search(date_pattern, exp_lines[j]):
                    break
                # Stop if we hit what looks like a new title (short line followed by date)
                if (
                    j + 1 < len(exp_lines)
                    and re.search(date_pattern, exp_lines[j + 1])
                    and len(exp_lines[j]) < 60
                ):
                    break
                desc_parts.append(exp_lines[j])
                j += 1

            description = " ".join(desc_parts)

            profile["experience"].append(
                {
                    "title": title,
                    "company": company,
                    "date": date_str,
                    "description": description,
                }
            )

        i += 1

    # Find earliest experience year for experienceStartYear
    earliest_year = 2022  # default
    for exp in profile["experience"]:
        years = re.findall(r"\d{4}", exp["date"])
        for y in years:
            y_int = int(y)
            if y_int < earliest_year and y_int > 2000:
                earliest_year = y_int
    profile["experienceStartYear"] = earliest_year

    # Parse Education
    edu_lines = section_lines["education"]
    i = 0
    while i < len(edu_lines):
        line = edu_lines[i]
        # Education entries typically have institution name, then degree, then dates
        year_pattern = r"(\d{4})\s*-\s*(\d{4})"
        year_match = re.search(year_pattern, line)

        if year_match:
            date_str = line.strip()
            institution = edu_lines[i - 1] if i > 0 else ""
            degree = ""
            description = ""

            j = i + 1
            if j < len(edu_lines):
                if not re.search(year_pattern, edu_lines[j]):
                    degree = edu_lines[j]
                    j += 1

            desc_parts = []
            while j < len(edu_lines):
                if re.search(year_pattern, edu_lines[j]):
                    break
                if (
                    j + 1 < len(edu_lines)
                    and re.search(year_pattern, edu_lines[j + 1])
                    and len(edu_lines[j]) < 60
                ):
                    break
                desc_parts.append(edu_lines[j])
                j += 1

            description = " ".join(desc_parts)

            profile["education"].append(
                {
                    "institution": institution,
                    "degree": degree,
                    "date": date_str,
                    "description": description,
                }
            )

        i += 1

    # Parse Skills
    for line in section_lines["skills"]:
        skill = line.strip()
        if skill and len(skill) < 100 and not re.match(r"^Page \d+", skill):
            profile["skills"].append(skill)

    # Parse Certifications
    cert_lines = section_lines["certifications"]
    i = 0
    while i < len(cert_lines):
        line = cert_lines[i].strip()
        if line and len(line) < 100 and not re.match(r"^Page \d+", line):
            profile["certifications"].append(line)
        i += 1

    return profile


def main():
    if not os.path.exists(PDF_PATH):
        print(f"Error: LinkedIn PDF not found at {PDF_PATH}")
        print("Please export your LinkedIn profile as PDF and save it to linkedin/Profile.pdf")
        sys.exit(1)

    print(f"Reading PDF from {PDF_PATH}...")
    text = extract_text_from_pdf(PDF_PATH)

    print("Parsing profile data...")
    profile = parse_linkedin_pdf(text)

    # Ensure output directory exists
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(profile, f, indent=2, ensure_ascii=False)

    print(f"Profile data written to {OUTPUT_PATH}")
    print(f"  Name: {profile['name']}")
    print(f"  Headline: {profile['headline']}")
    print(f"  Experience entries: {len(profile['experience'])}")
    print(f"  Education entries: {len(profile['education'])}")
    print(f"  Skills: {len(profile['skills'])}")
    print(f"  Experience start year: {profile['experienceStartYear']}")


if __name__ == "__main__":
    main()
