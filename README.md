# PR Analyzer (Static Web App)

This is a client-side static web application for analyzing Photovoltaic (PV) Power Plant Performance Ratio (PR).
It runs entirely in the browser using React (via CDN), Tailwind CSS, and Babel Standalone.

## Project Structure

*   `index.html`: The main entry point containing the HTML structure and loading external libraries (CDN).
*   `js/app.js`: Contains the main React application logic, components, and data processing algorithms.
*   `data/`: Contains reference data files (e.g., `PV_reference.xlsx`).

## Features

1.  **PR Analyzer**
    *   **CSV Upload**: Supports Shift-JIS and UTF-8 encoded CSV files.
    *   **Dynamic Parsing**: Automatically detects PCS columns (`pcs_XXX_kwh`) and calculates daily PR.
    *   **Heatmap Visualization**: Displays daily PR values in a table with color-coded cells (Blue=Low to Orange=High).
    *   **Excel Export**: Download processed data as an `.xlsx` file.
    *   **Template Download**: Provides a strictly formatted CSV template for users.

2.  **Panel Area Calculator**
    *   Calculates total PV panel area based on dimensions (vertical/horizontal) and quantity.
    *   **Presets**: Includes presets for specific site configurations (e.g., Waki, Nasu).
    *   **Copy Feature**: Easily copy the calculated total area to clipboard.

3.  **Wake Reference Values (和気参考値)**
    *   Displays reference data tables loaded from an Excel file (`data/PV_reference.xlsx`).
    *   **Multi-Table Support**: Parses multiple sheets/tables from the Excel file.
    *   **Specific Data Injection**: The "工区別" (Work Area) table is currently preset with specific system values as per requirements, overriding the Excel file content for this section.
    *   **Formatting**: Includes 3-digit comma separation and specific highlighting for key metrics.

## How to Use

1.  Open `index.html` in a modern web browser.
2.  Navigate between "PR Analyzer", "Panel Area Calculator", and "Wake Reference" using the header menu.
3.  **For PR Analyzer**:
    *   Download the CSV template.
    *   Fill in your generation data (Date, Irradiation, PCS generation).
    *   Upload the CSV to view the Heatmap and export results.

## Technical Details

*   **Framework**: React 18 (UMD build)
*   **Styling**: Tailwind CSS (CDN)
*   **CSV Parsing**: PapaParse
*   **Excel Handling**: SheetJS (xlsx) for both reading reference data and exporting results.
*   **Deployment**: Static file hosting (no build process required).

## Development

To make changes:
1.  Edit `js/app.js` for logic and UI components.
2.  Edit `index.html` for global styles or library imports.
