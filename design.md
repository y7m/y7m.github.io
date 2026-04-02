## Core Principles

This document outlines the foundational design decisions that shape our digital products.

### Color Palette

* **Primary Color:** `#386FA4` - Our brand's signature color, used for primary actions and key elements.
* **Secondary Color:** `#9E7682` - A complementary color for secondary actions and supporting elements.
* **Tertiary Color:** `#C36F09` - An accent color for highlights and decorative details.
* **Neutral Color:** `#75777B` - The foundational neutral value. This color generates the full grayscale tonal ramp, which is used to define surfaces, text, and borders in both light and dark themes.

### Theme Modes

The system supports two color modes: **Light** and **Dark**. The core palette is adapted for each mode using a combination of the tonal ramps.

**Dark Mode Definition (Demonstrated):**
Our Dark Mode UI is based on a structured dark background with high-contrast light text, as demonstrated in our reference design.

* **Main Background:** A very dark neutral tone (`surface-dark`).
* **Content Surfaces/Cards:** A slightly lighter dark neutral tone for content separation (`surface-card-dark`).
* **Text (Headline, Body, Label):** A high-contrast light tone (near-white) from the neutral ramp.
* **Subdued/Secondary Text:** A lighter gray tone for less prominent information.
* **Interactive Elements:**
    * **Primary Actions:** Utilize a blend of light primary blue foreground elements against a neutral-dark background, creating clear call-to-actions without oversaturation.
    * **Secondary/Outlined Actions:** Use the secondary or outlined button styles with high-contrast text against dark backgrounds.

**Light Mode Definition:**
Our Light Mode UI will follow the inverse of the dark mode logic, utilizing light surfaces and dark text for optimal readability.

### Typography

Our typographic choices ensure clarity and consistency across all touchpoints. We prioritize the following best practices:

* **Font Family:** We use `manrope` for all text levels, from headlines to labels.
* **Readability Standards:** Target comfortable line-heights (e.g., 1.4 for body text, 1.2 for headlines) and avoid pure black or pure white text for extended reading comfort.
* **Visual Hierarchy:** Establish clear distinctions between heading levels and body content.

**Example Typographic System:**

* **Headlines (H1-H4):** `manrope`, Bold (700). High prominence. Use defined size ratios (e.g., base font size * power) to maintain clear relationships.
* **Body Text:** `manrope`, Regular (400). Moderate prominence. Optimized for sustained reading.
* **Labels:** `manrope`, Regular (400). Low prominence. Concise text for form labels and interactive controls.

### Code Display

* **Syntax Highlighting:** Code snippets utilize established syntax highlighting themes to provide an accessible and familiar developer experience.
    * **Light Mode Theme:** Atom One Light
    * **Dark Mode Theme:** One Dark Pro

### Language Tags

* **Tag Colors:** Language identifiers map directly to the official hex codes defined by GitHub's Linguist repository ([Source: GitHub Linguist `languages.yml`](https://github.com/github-linguist/linguist/blob/master/lib/linguist/languages.yml)).
* **Implementation:** The application uses a static, hardcoded dictionary derived from this repository to ensure UI stability and prevent external API dependencies.

### Shape and Form

* **Roundedness:** We utilize a defined `roundedness` token for our UI elements to provide a moderate and friendly feel.
* **Token Mapping:** `roundedness: 2` maps explicitly to a `4px` corner radius.

### Spacing

* **Whitespace:** Our `spacing` token maintains a balanced and normal amount of whitespace between elements, contributing to good readability and a clean layout.
* **Token Mapping:** `spacing: 2` maps explicitly to an `8px` spacing unit. All other spacing measurements are multiples of this unit (e.g., `spacing: 4` would be `16px`).

### Accessibility (a11y)

* **Contrast Standards:** Ensure that text and key UI elements meet Web Content Accessibility Guidelines (WCAG) 2.1 contrast ratios.
    * Minimum contrast ratio of 4.5:1 for normal text.
    * Minimum contrast ratio of 3:1 for large text and UI components.
* **Language Tag Fallback:** In the event that a language does not exist in our static tag color dictionary, it will default to a neutral gray color (e.g., `#BDBDBD` on a dark background) to maintain visual clarity and prevent unexpected colors.